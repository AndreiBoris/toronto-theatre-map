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

    self.calcRoute = function(destination) {
        var request = {
            origin: {
                lat: 43.645220,
                lng: -79.380836
            },
            destination: destination,
            travelMode: google.maps.TravelMode.TRANSIT
        };
        mapManager.directionsService.route(request, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                mapManager.directionsDisplay.setDirections(result);
                self.currentDirections.removeAll();
                result.routes[0].legs[0].steps.forEach(function(curVal, index, array) {
                    self.currentDirections.push(curVal.instructions);
                });
                self.currentCopyrights(result.routes[0].copyrights);

            }
        });
    };

    self.toggleDirections = function() {
        self.showDirections(!self.showDirections());
        // Show the directions from Union Station to this location
        if (self.showDirections()) {
            mapManager.directionsDisplay = new google.maps.DirectionsRenderer();
            mapManager.directionsDisplay.setMap(mapManager.map);
            self.calcRoute(self.currentPosition());
        }
    };

    self.moveButton = function() {
        $('#opened-info-window').append(self.$directionsButton);
    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, mapManager, google));
