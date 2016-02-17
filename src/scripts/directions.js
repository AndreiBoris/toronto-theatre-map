var mapManager = mapManager || {};
var google = google || {};

/**
 * The module provides methods for accessing the Google Maps Directions API.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} mapManager  Object with map related methods and variables.
 * @param  {object} google      Google Maps API
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, mapManager, google) {
    'use strict';

    /**
     * Determine how to get to the requested location. Create a visual overlay
     * as well as a list of written directions.
     * @param  {object} destination A LatLng object that is the position of the
     *                              marker we are trying to get directions to.
     */
    self.calcRoute = function(destination) {
        var request = {
            origin: { // Union station.... (NOT GOOD)
                lat: 43.645220,
                lng: -79.380836
            },
            destination: destination, // location of the marker we are targeting
            travelMode: google.maps.TravelMode.TRANSIT // transit directions
        };
        // Request the directions based on the request object defined above.
        mapManager.directionsService.route(request, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) { // got a response
                var tags = /<[^>]*>/g;
                var destinationFix = /Destination/g;
                // Draw the graphical overlay showing directions on map
                mapManager.directionsDisplay.setDirections(result);
                self.currentDirections.removeAll(); // Clear the current directions array
                // Create a new current directions array to display how to get to
                // the theatre in steps.
                result.routes[0].legs[0].steps.forEach(function(curVal, index, array) {
                    self.currentDirections.push(curVal.instructions);
                    if (curVal.steps) { // Include detailed sub-steps
                        curVal.steps.forEach(function(innerVal, index, array) {
                            if (innerVal.instructions) {
                                var rawStep = innerVal.instructions.replace(tags, ' ');
                                var cleanStep = rawStep.replace(destinationFix, '-> Destination');
                                //console.log('Replacing ' + innerVal.instructions +
                                //    ' with ' + cleanStep);
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
     * Toggle whether the directions are being shown or not.
     */
    self.toggleDirections = function() {
        // This variable determines visibility of step instructions on the view
        self.showDirections(!self.showDirections()); // Toggle
        if (self.showDirections()) { // Direction are showing
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
        } else {
            // Hide the directions drawn on the map
            mapManager.directionsDisplay.setMap(null);
        }
    };

    /**
     * Take the button to display direction and move it to the currently opened
     * InfoWindow. This allows us to use the same button the whole time, which
     * allows it to use the data-bind Knockout binding to control the
     * toggleDirections method.
     * @return {[type]} [description]
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

}(TheatreMapViewModel || {}, mapManager, google));
