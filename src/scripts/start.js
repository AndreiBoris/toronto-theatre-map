var TheatreMapViewModel = TheatreMapViewModel || {};
var ko = ko || {};
var mapManager = mapManager || {};
var googleWatcherObject = googleWatcherObject || {};

/**
 * The module loads methods for dealing with the overlay.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} mapManager  Object with map related function and variables.
 * @param  {object} googleWatcherObject  Used to handle Google Maps API load
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager, googleWatcherObject) {
    'use strict';

    /**
     * Remove the overlay and reveal the map.
     */
    self.openOverlay = function() {
        self.$buttonOverlay.addClass('overlay-off');
        self.$titleOverlay.addClass('overlay-off');
        self.$rightOverlay.addClass('overlay-off');
        self.$titleToronto.addClass('overlay-off');
        self.$divOverlay.css('z-index', 0); // To be able to click on the map.
        
        setTimeout(function() {
            self.slideList(); // Show list div
        }, 600); // Slightly after the openOverlay is run

        // When transition ends, delete all offscreen overlay elements.
        setTimeout(function() {
            self.$titleOverlay.remove();
            self.$divOverlay.remove();
            self.$rightOverlay.remove();
            self.$buttonOverlay.remove();
        }, 1400); // Time matches the transition time in _overlay.scss

    };

    /**
     * Perform the load animation over the enter-button
     */
    self.loadAnimation = function() {
        self.$loadMover.addClass('first-move'); // Expand black dot to line
        setTimeout(function() {
            self.$loadMover.addClass('second-move'); // Expand line to block
            setTimeout(function() {
                self.$loadMover.addClass('third-move'); // Turn block white
                setTimeout(function() {
                    self.$loadMover.addClass('fourth-move'); // Fade out
                    self.$loadButton.addClass('fourth-move'); // Fade out
                    setTimeout(function() {
                        self.$loadButton.remove(); // Button is clickable
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    };

    /**
     * Once the Google Maps API has loaded, initilize the map.
     */
    self.launchAttempt = function() {
        if (googleWatcherObject.googleWatcherVariable === 'success') {
            mapManager.initMap(); // Load markers
        } else if (googleWatcherObject.googleWatcherVariable === 'failure') {
            self.googleMapFailed(true); // Display error message
        } else {
            setTimeout(function() {
                self.launchAttempt(); // Try again
            }, 50);
        }

    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager, googleWatcherObject));

// Animation on the button used to enter the useable part of the app from the 
// opening page.
TheatreMapViewModel.loadAnimation();
// Apply Knockout bindings
ko.applyBindings(TheatreMapViewModel);
// Once we've loaded everything, we can try to launch the map, which also 
// requires that the Google Maps API has loaded.
TheatreMapViewModel.launchAttempt();
