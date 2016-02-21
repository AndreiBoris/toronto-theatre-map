var mapManager = mapManager || {};
var google = google || {};
var ko = ko || {};
// Temp
var prompt = prompt || function() {};

/**
 * The module provides methods for accessing the Google Maps Directions API.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} mapManager  Object with map related methods and variables.
 * @param  {object} google      Google Maps API
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager, google) {
    'use strict';

    // Where to get the directions from.
    self.startingLocation = ko.observable('Yonge and Bloor');
    // If false, we should ask user for location.
    self.locationRequested = ko.observable(false);
    // Address to display as the starting position in the display div
    self.addressToDisplay = ko.observable('Yonge and Bloor');
    // We can display the direction steps
    self.directionsReady = ko.observable(false);
    // Display yes/no buttons to agree or disagree
    self.directionOption = ko.observable(false);
    // Display input for putting in an address
    self.directionInputDisplay = ko.observable(false);
    // Address stored in the input field.
    self.pendingAddress = ko.observable('');
    // Prompt to user when setting up starting position for directions.
    self.directionsPrompt = ko.observable('');

    // Direction setup questions
    self.directionQuestionGeolocation = ko.observable(false);
    self.directionQuestionDoubleCheck = ko.observable(false);
    self.directionQuestionTypeLocation = ko.observable(false);
    self.directionQuestionNewLocation = ko.observable(false);

    // Text to clarify customization of starting location for directions
    self.directionYesText = ko.observable('');
    self.directionNoText = ko.observable('');

    /**
     * Submit pendingAddress and put it as the startingLocation and the 
     * addressToDisplay, running a calcRoute with this value.
     * @return {[type]} [description]
     */
    self.enterAddress = function() {
        // This is the location to search from.
        self.startingLocation(self.pendingAddress());
        // This is the is the equivalent string to display to the user. The 
        // differentiation accounts for startingLocation sometimes being a 
        // coordinate rather than a string.
        self.addressToDisplay(self.pendingAddress());
        self.pendingAddress(''); // Clear the input field.
        self.directionInputDisplay(false); // Hide input area
        // Use new starting location to calculate route
        self.calcRoute(self.currentPosition());
    };

    /**
     * Allow user to customize a new location from which to get directions
     */
    self.newStartingLocation = function() {
        self.directionsReady(false); // Hide step by step directions
        self.directionOption(true); // Show 'Yes' and 'No' buttons
        self.directionsPrompt('Do you want to pick a new starting location for ' +
            'directions?'); // Prompt for user to understand buttons
        self.nextQuestion(true, 'NewLocation'); // Handle 'Yes' and 'No' correctly
    };

    /**
     * Determine how to get to the requested location. Create a visual overlay
     * as well as a list of written directions.
     * @param  {object} destination A LatLng object that is the position of the
     *                              marker we are trying to get directions to.
     */
    self.calcRoute = function(destination) {
        // We no longer need to find a startingLocation each time we get 
        // directions
        self.locationRequested(true);
        var request = {
            origin: self.startingLocation(), // where we travel from
            destination: destination, // location of the marker we are targeting
            travelMode: google.maps.TravelMode.TRANSIT // transit directions only
        };
        // Clear the directions and duration from the last caclRoute call
        self.currentDirections.removeAll();
        self.currentTravelDuration(0); // Reset calculated travel duration
        self.directionSuccess(false); // Toggle display of opening comment
        // Request the directions based on the request object defined above.
        mapManager.directionsService.route(request, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) { // got a response
                self.directionSuccess(true); // Toggle display of opening comment
                var tags = /<[^>]*>/g; // To remove html tafgs
                var destinationFix = /Destination/g; // To add arrow before word
                // Draw the graphical overlay showing directions on map
                mapManager.directionsDisplay.setDirections(result);
                // If no directions are found, we need a new starting address.
                var failed = true;
                // Create a new current directions array to display how to get to
                // the theatre in steps.
                result.routes[0].legs[0].steps.forEach(function(curVal, index, array) {
                    failed = false; // Found at least one step
                    self.directionsReady(true); // display directions
                    // Add current major step
                    self.currentDirections.push(curVal.instructions + ' - ' +
                        curVal.distance.text + ' (' + curVal.duration.text +
                        ')');
                    // Add time to complete current step to total travel time
                    self.currentTravelDuration(self.currentTravelDuration() +
                        parseInt(curVal.duration.text));
                    if (curVal.steps) { // Include detailed sub-steps
                        curVal.steps.forEach(function(innerVal, index, array) {
                            if (innerVal.instructions) { // There is a string
                                var rawStep = innerVal.instructions.replace(tags,
                                    ' '); // Remove html tags on these sub-steps
                                // Separate 'Destination' sentence from the rest
                                var cleanStep = rawStep.replace(destinationFix,
                                    '-> Destination');
                                // Add current sub-step to list of steps
                                self.currentDirections.push(cleanStep);
                            }
                        });
                    }
                });
                // Add Google copyright to be displayed below instructions
                self.currentCopyrights(result.routes[0].copyrights);
                if (failed) { // Get a new starting address.
                    self.directionsPrompt('Please try a more specific address.');
                    self.calcRouteFailed();
                } else { // success 
                    self.directionsReady(true); // Display directions
                }
            } else { // Get a new starting address.
                self.directionsPrompt('Please try a more specific address. ' +
                    'Though it is also possible that there is a network problem.');
                self.calcRouteFailed();
            }
        });
    };

    /**
     * Ask user for another address entered into input field to find starting 
     * location for directions.
     */
    self.calcRouteFailed = function() {
        console.log('There was some issue finding directions using ' +
            'the direction services on the Google Maps API');
        self.directionsReady(false); // Hide step directions
        self.directionInputDisplay(true); // enter a new value
    };

    /**
     * The sentence to display to user about the total travel time.
     */
    self.travelTime = ko.computed(function() {
        if (self.currentTravelDuration() === 0) {
            return 'Loading directions from Google Maps. If this message persists, ' +
                'there might be a connection problem :(';
        } else {
            var pluralWatch = self.currentTravelDuration() === 1 ? '.' : 's.';
            var sentence = 'This route will take approximately ' +
                self.currentTravelDuration().toString() + ' minute' +
                pluralWatch;
            return sentence;
        }
    });


    /**
     * Toggle whether the directions are being shown or not.
     */
    self.toggleDirections = function(option) {
        // This variable determines visibility of step instructions on the view
        self.showDirections(!self.showDirections()); // Toggle
        if (self.showDirections()) { // Direction should be showing
            if (option === 'infoWin' && self.locationRequested()) { // Called from InfoWindow
                self.closeLeftDiv(); // Remove display div to make space
                self.closeRightDivs(); // Remove right divs to make space
            }
            if (!self.locationRequested() && !self.leftDivOpen()) {
                // Need to figure out options for starting address
                self.openLeftDiv();
            }
            self.openDirections(); // Enable directions in view
        } else {
            // Hide the directions drawn on the map
            self.closeDirections();
        }
    };

    /**
     * Show directions without closing left or right divs
     */
    self.toggleDirectionsDisplay = function() {
        self.toggleDirections();
    };

    /**
     * Show directions and close the left and right divs.
     */
    self.toggleDirectionsInfo = function() {
        self.toggleDirections('infoWin');
    };

    /**
     * Set up for displaying Google Maps directions.
     */
    self.openDirections = function() {
        // Extend the display div so that it can better present directions. This
        // will not have any effect on smaller screens where display div is 
        // always extended.
        self.$divInfo.addClass('direction-extention');
        // Create a new object that will draw directions on the map. This 
        // overrides the old object, allowing us to not have to see a flash
        // of the old directions when we switch to new directions. 
        // NOTE: This might be eating up memory in some way as the 
        // DirectionsRenderer still displays on the google.map had it not
        // been `setMap`ed to `null` even when there is no reference to it.
        mapManager.directionsDisplay = new google.maps.DirectionsRenderer();
        // Apply this object to our Google map
        mapManager.directionsDisplay.setMap(mapManager.map);
        // Figure out how to get to the position of the currently selected
        // marker and display this information to user
        if (!self.locationRequested()) {
            self.directionsPrompt('Share your location to find directions?');
            self.nextQuestion(true, 'Geolocation');
        } else { // We already have the starting location
            self.calcRoute(self.currentPosition()); // Find directions
        }
    };

    /**
     * Set up different questions in the display div that require user input
     * @param  {boolean} nextStep true if there are more questions, false if all
     *                            questions are done.
     * @param  {string} choice is the next questions user will answer regarding
     *                         setup of the starting location.
     */
    self.nextQuestion = function(nextStep, choice) {
        // Disable all questions
        self.directionQuestionNewLocation(false);
        self.directionQuestionGeolocation(false);
        self.directionQuestionDoubleCheck(false);
        self.directionQuestionTypeLocation(false);
        if (nextStep) { // We are asking another question
            self.directionOption(true); // Provide 'Yes' and 'No' buttons
            // Enable relavant question so that directionYes and directionNo will
            // correctly handle the user response.
            self['directionQuestion' + choice](true);
            self.changeButtonText(); // Change text on buttons to reflect question
        } else {
            // Disable 'Yes' and 'No' buttons
            self.directionOption(false);
        }
    };

    /**
     * Update the text on 'Yes' and 'No' buttons to clarify meaning
     */
    self.changeButtonText = function() {
        if (self.directionQuestionNewLocation()) { // Want to change starting location?
            self.directionYesText('Edit');
            self.directionNoText('Cancel');
        } else if (self.directionQuestionGeolocation()) { // Allow geolocation?
            self.directionYesText('Allow');
            self.directionNoText('Deny');
        } else if (self.directionQuestionDoubleCheck()) { // Correct geolocation?
            self.directionYesText('Close Enough!');
            self.directionNoText('Way off!');
        } else if (self.directionQuestionTypeLocation()) { // Want to input location?
            self.directionYesText('Edit');
            self.directionNoText('Too lazy');
        } else { // Something went wrong
            self.directionYesText('Yes');
            self.directionNoText('No');

        }
    };

    /**
     * Handler for 'Yes' button in starting location setup
     */
    self.directionsYes = function() {
        if (self.directionQuestionGeolocation()) { // have permission to geolocate
            self.getLocation(); // Get user's position
        } else if (self.directionQuestionDoubleCheck()) { // geolocation is good
            self.nextQuestion(false, ''); // No more questions
            self.calcRoute(self.currentPosition());
        } else if (self.directionQuestionTypeLocation()) { // user will input location
            self.nextQuestion(false, ''); // No more questions
            self.directionsPrompt('Please enter a specific address.');
            self.directionInputDisplay(true); // enter a new starting address
        } else if (self.directionQuestionNewLocation()) { // user wants new starting location
            self.locationRequested(false); // Request a new location in openDirections
            mapManager.directionsDisplay.setMap(null); // Take direction graphics off map
            self.openDirections(); // Get new starting location and graphic display
        } else {
            console.log('Invalid situation to press yes button!'); // shouldn't happen
        }
    };

    /**
     * Handler for 'No' button in starting location set up
     */
    self.directionsNo = function() {
        if (self.directionQuestionGeolocation()) { // denied access to geolocate
            self.directionsPrompt('Want to enter the location ' +
                'you want to travel from yourself?');
            self.nextQuestion(true, 'TypeLocation');
        } else if (self.directionQuestionDoubleCheck()) { // geolocation is bad
            self.directionsPrompt('Sorry about that. Want to enter the location ' +
                'you want to travel from yourself?');
            self.nextQuestion(true, 'TypeLocation');
        } else if (self.directionQuestionTypeLocation()) { // refuses to type location
            if (self.addressToDisplay() === 'your location') { // error in addressAJAX
                self.nextQuestion(false, ''); // no more questions
                self.calcRoute(self.currentPosition()); // get directions
            } else {
                self.nextQuestion(false, ''); // no more questions
                self.startingLocation('Yonge and Bloor'); // set default value
                self.addressToDisplay('Yonge and Bloor'); // set default value
                self.calcRoute(self.currentPosition()); // get directions
            }
        } else if (self.directionQuestionNewLocation()) { // keep old starting location
            self.directionsReady(true); // display direction steps
            self.directionOption(false); // hide 'Yes' and 'No' buttons
        } else {
            console.log('Invalid situation to press no button!'); // shouldn't happen
        }
    };

    /**
     * Find the current position of the user.
     */
    self.getLocation = function() {
        if (navigator.geolocation) { // Browser can do geolocation
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                self.startingLocation({ // IMPORTANT: used by calcRoute
                    lat: lat,
                    lng: lng
                });

                // Convert to human-readable address
                self.addressAJAX(lat, lng);

            }, function() { // User doesn't consent to being tracked
                console.log('No permission to get geolocation of user!');
                self.directionsPrompt('We\'re struggling to find an address ' +
                    'corresponding to your coordinates. Would you like to ' +
                    'enter the address you want directions from instead?');
                self.nextQuestion(true, 'TypeLocation');
            });
        } else {
            // Browser doesn't support Geolocation
            console.log('Geolocation can\'t be used in this browser!');
            self.directionsPrompt('We\'re struggling to find an address ' +
                'corresponding to your coordinates. Would you like to ' +
                'enter the address you want directions from instead?');
            self.nextQuestion(true, 'TypeLocation');
        }
    };

    /**
     * Perform a Google Geocoding API request and get address from 
     * @param  {string} address The real world address used to find coordinates.
     * @param  {array}  array   An array of google.maps.Marker objects.
     * @param  {int}    index   Determines which Marker to send coordinates to.
     */
    self.addressAJAX = function(lat, lng) {
        /*jshint camelcase: false */ // Have to access non camel case object below

        // API call using lat and lng to find human readable address.
        var urlCoords = ('https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
            lat + ',' + lng + '&key=AIzaSyA4SAawmy-oEMzdWboD0iHk9gDmmjb61o4');

        $.ajax({
            url: urlCoords,
            success: function(data) { // Got a response
                if (data.results[0].formatted_address) { // Address found
                    self.addressToDisplay(data.results[0].formatted_address);
                    self.directionsPrompt('Are you travelling from ' +
                        data.results[0].formatted_address + '?');
                    // Check with user if this is the correct location
                    self.nextQuestion(true, 'DoubleCheck');
                } else { // No human reeadable address to extract
                    console.log('Could not generate human-readable address.');
                    self.handleDirectionAJAXFailure();
                }
            },
            error: function(e) { // no response
                console.log('Could not access reverse geocoding Google Maps API.');
                self.handleDirectionAJAXFailure();
            }
        });
    };

    self.handleDirectionAJAXFailure = function() {
        self.addressToDisplay('your location');
        self.directionsPrompt('We\'re struggling to find an address ' +
            'corresponding to your coordinates. Would you like to ' +
            'enter your address instead?');
        self.nextQuestion(true, 'TypeLocation');
    };

    /**
     * Text to display to display on button that controls directions.
     */
    self.directionText = ko.computed(function() {
        return self.showDirections() ? 'Hide Directions' : 'Show Directions';
    });

    /**
     * Hide the directions drawn on the map.
     */
    self.closeDirections = function() {
        // Test to make sure we already created a directionsDisplay object
        if (mapManager.directionsDisplay) {
            mapManager.directionsDisplay.setMap(null);
        }
        self.directionInputDisplay(false);
        self.showDirections(false);
        self.$divInfo.removeClass('direction-extention');
    };

    /**
     * Take the button to display direction and move it to the currently opened
     * InfoWindow. This allows us to use the same button the whole time, which
     * allows it to use the data-bind Knockout binding to control the
     * toggleDirections method.
     */
    self.moveButton = function() {
        // Select the new info window and add the unique $directionsButton to 
        // it.
        $('#opened-info-window').append(self.$directionsButton);
    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager, google));
