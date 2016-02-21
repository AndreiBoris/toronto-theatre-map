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
        if (self.showDirections()) { // Direction are showing
            if (option === 'infoWin' && self.locationRequested()) { // Called from InfoWindow
                self.closeLeftDiv(); // Remove display div to make space
                self.closeRightDivs(); // Remove right divs to make space
            }
            if (!self.locationRequested() && !self.leftDivOpen()) {
                // Need to figure out options for starting address
                self.openLeftDiv();
            }
            self.openDirections();
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
            // if (geolocate) {
            //     self.getLocation();
            // } else {
            //     var typeIn = window.confirm('Do you want to type in location?');
            //     if (typeIn) {
            //         // Allow user to enter text
            //         var enteredLocation = prompt('Enter a location:');
            //         console.log(enteredLocation);
            //         self.startingLocation(enteredLocation);
            //         self.calcRoute(self.currentPosition());
            //     } else { // Find directions from stock location.
            //         self.startingLocation('Yonge and Bloor');
            //         self.calcRoute(self.currentPosition()); // Find directions
            //     }
            // }
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
        self.directionQuestionNewLocation(false);
        self.directionQuestionGeolocation(false);
        self.directionQuestionDoubleCheck(false);
        self.directionQuestionTypeLocation(false);
        if (nextStep) {
            self.directionOption(true);
            self['directionQuestion' + choice](true);
        } else {
            self.directionOption(false);
        }
    };

    /**
     * Handler for 'Yes' button in starting location set up
     */
    self.directionsYes = function() {
        if (self.directionQuestionGeolocation()) {
            self.getLocation();
        } else if (self.directionQuestionDoubleCheck()) {
            self.nextQuestion(false, '');
            self.calcRoute(self.currentPosition());
        } else if (self.directionQuestionTypeLocation()) {
            self.nextQuestion(false, '');
            self.directionsPrompt('Please enter a specific address.');
            self.directionInputDisplay(true); // enter a new value
        } else if (self.directionQuestionNewLocation()) {
            self.locationRequested(false);
            mapManager.directionsDisplay.setMap(null);
            self.openDirections();
        } else {
            console.log('Invalid situation to press yes button!');
        }
    };

    /**
     * Handler for 'No' button in starting location set up
     */
    self.directionsNo = function() {
        if (self.directionQuestionGeolocation()) {
            self.directionsPrompt('Want to enter the location ' +
                'you want to travel from yourself?');
            self.nextQuestion(true, 'TypeLocation');
        } else if (self.directionQuestionDoubleCheck()) {
            self.directionsPrompt('Sorry about that. Want to enter the location ' +
                'you want to travel from yourself?');
            self.nextQuestion(true, 'TypeLocation');
        } else if (self.directionQuestionTypeLocation()) {
            if (self.addressToDisplay() === 'your location') {
                self.nextQuestion(false, '');
                self.calcRoute(self.currentPosition());
            } else {
                self.nextQuestion(false, '');
                self.startingLocation('Yonge and Bloor');
                self.addressToDisplay('Yonge and Bloor');
                self.calcRoute(self.currentPosition());
            }
        } else if (self.directionQuestionNewLocation()) {
            self.directionsReady(true);
            self.directionOption(false);
        } else {
            console.log('Invalid situation to press no button!');
        }
    };

    self.getLocation = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                self.startingLocation({
                    lat: lat,
                    lng: lng
                });
                // Convert to human-readable address
                self.addressAJAX(lat, lng);

                // var placeFound = window.confirm('Is where you are travelling from ' +
                //     address + '?');
                // self.nextQuestion(true, 'DoubleCheck'); // Can't do this
                // if (placeFound) {
                //     self.calcRoute(self.currentPosition());
                // } else {
                //     var willType = window.confirm('Do you want to enter your starting place?');
                //     if (willType) {
                //         // Allow user to enter text
                //         var enteredLocation = prompt('Enter a location:');
                //         console.log(enteredLocation);
                //         self.startingLocation(enteredLocation);
                //         self.calcRoute(self.currentPosition());
                //     } else { // Find directions from stock location.
                //         self.startingLocation('Yonge and Bloor');
                //         self.calcRoute(self.currentPosition()); // Find directions
                //     }
                // }

            }, function() {
                console.log('Geolocation has encountered some error!');
                self.directionsPrompt('We\'re struggling to find an address ' +
                    'corresponding to your coordinates. Would you like to ' +
                    'enter your address instead?');
                self.nextQuestion(true, 'TypeLocation');
                //handleLocationError(true, infoWindow, mapManager.map.getCenter());
            });
        } else {
            // Browser doesn't support Geolocation
            //handleLocationError(false, infoWindow, mapManager.map.getCenter());
            console.log('Geolocation can\'t be used in this browser!');
            self.directionsPrompt('We\'re struggling to find an address ' +
                'corresponding to your coordinates. Would you like to ' +
                'enter your address instead?');
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
        // The request is bounded around Toronto.
        var urlCoords = ('https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
            lat + ',' + lng + '&key=AIzaSyA4SAawmy-oEMzdWboD0iHk9gDmmjb61o4');
        console.log(urlCoords);

        $.ajax({
            url: urlCoords,
            success: function(data) {
                if (data.results[0].formatted_address) {
                    self.addressToDisplay(data.results[0].formatted_address);
                    self.directionsPrompt('Are you travelling from ' +
                        data.results[0].formatted_address + '?');
                    self.nextQuestion(true, 'DoubleCheck');
                } else {
                    console.log('Could not generate human-readable address.');
                    self.addressToDisplay('your location');
                    self.directionsPrompt('We\'re struggling to find an address ' +
                        'corresponding to your coordinates. Would you like to ' +
                        'enter your address instead?');
                    self.nextQuestion(true, 'TypeLocation');
                }
            },
            error: function(e) {
                console.log('Could not access reverse geocoding Google Maps API.');
                self.addressToDisplay('your location');
                self.directionsPrompt('We\'re struggling to find an address ' +
                    'corresponding to your coordinates. Would you like to ' +
                    'enter your address instead?');
                self.nextQuestion(true, 'TypeLocation');
            }
        });

        // $.getJSON(urlCoords, function(data) {
        //     if (data.results[0].formatted_address) {
        //         self.addressToDisplay(data.results[0].formatted_address);
        //         self.directionsPrompt('Are you travelling from ' +
        //             data.results[0].formatted_address + '?');
        //         self.nextQuestion(true, 'DoubleCheck');
        //     } else {
        //         console.log('Could not generate human-readable address.');
        //         self.addressToDisplay('your location');
        //         self.directionsPrompt('We\'re struggling to find an address ' +
        //             'corresponding to your coordinates. Would you like to ' +
        //             'enter your address instead?');
        //         self.nextQuestion(true, 'TypeLocation');
        //     }
        // }.error(function(e) { // Can't show the marker without coordinates.
        //     console.log('Could not access reverse geocoding Google Maps API.');
        //     self.addressToDisplay('your location');
        //     self.directionsPrompt('We\'re struggling to find an address ' +
        //         'corresponding to your coordinates. Would you like to ' +
        //         'enter your address instead?');
        //     self.nextQuestion(true, 'TypeLocation');
        // }));
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
