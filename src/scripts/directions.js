var mapManager = mapManager || {};
var google = google || {};
var ko = ko || {};

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

    /**
     * Determine how to get to the requested location. Create a visual overlay
     * as well as a list of written directions.
     * @param  {object} destination A LatLng object that is the position of the
     *                              marker we are trying to get directions to.
     */
    self.calcRoute = function(destination) {
        var request = {
            origin: { // Yonge and Bloor
                lat: 43.670843, 
                lng: -79.385890 
            },
            destination: destination, // location of the marker we are targeting
            travelMode: google.maps.TravelMode.TRANSIT // transit directions
        };
        // Clear the directions and duration from the last caclRoute call
        self.currentDirections.removeAll();
        self.currentTravelDuration(0);
        self.directionSuccess(false);
        // Request the directions based on the request object defined above.
        mapManager.directionsService.route(request, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) { // got a response
                self.directionSuccess(true);
                var tags = /<[^>]*>/g;
                var destinationFix = /Destination/g;
                // Draw the graphical overlay showing directions on map
                mapManager.directionsDisplay.setDirections(result);
                // Create a new current directions array to display how to get to
                // the theatre in steps.
                result.routes[0].legs[0].steps.forEach(function(curVal, index, array) {
                    // Add current major step
                    console.log(curVal);
                    self.currentDirections.push(curVal.instructions + ' - ' + 
                        curVal.distance.text + ' (' + curVal.duration.text + 
                            ')');
                    console.log('major step: ' + curVal.distance.text);
                    // Add time to complete current step to total travel time
                    self.currentTravelDuration(self.currentTravelDuration() +
                        parseInt(curVal.duration.text));
                    if (curVal.steps) { // Include detailed sub-steps
                        curVal.steps.forEach(function(innerVal, index, array) {
                            if (innerVal.instructions) { // There is a string
                                // Remove html tags on these sub-steps
                                var rawStep = innerVal.instructions.replace(tags,
                                    ' ');
                                console.log('minor step: ' + innerVal.distance.text);
                                // Separate 'Destination' sentence from the rest
                                var cleanStep = rawStep.replace(destinationFix,
                                    '-> Destination');
                                // Add current sub-step
                                self.currentDirections.push(cleanStep);
                            }
                        });
                    }
                });
                // Add Google copyright to be displayed below instructions
                self.currentCopyrights(result.routes[0].copyrights);

            }
        });
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
            if (option === 'infoWin') { // Called from InfoWindow
                self.closeLeftDiv(); // Remove display div to make space
                self.closeRightDivs(); // Remove right divs to make space
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
        self.calcRoute(self.currentPosition());
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
