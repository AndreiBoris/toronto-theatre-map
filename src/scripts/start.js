var TheatreMapViewModel = TheatreMapViewModel || {};
var ko = ko || {};
var mapManager = mapManager || {};

/**
 * The module loads methods for dealing with the overlay.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} mapManager  Object with map related function and variables.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager) {
    'use strict';
    
    self.openCurtain = function() {
        self.$buttonOverlay.addClass('overlay-off');
        self.$titleOverlay.addClass('overlay-off');
        self.$twitterOverlay.addClass('overlay-off');
        self.$titleToronto.addClass('overlay-off');
        setTimeout(function() {
            self.$divOverlay.addClass('overlay-off');
            self.$titleOverlay.remove();
        }, 1000);
        // TODO: Delete unused DOM elements
    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager));


ko.applyBindings(TheatreMapViewModel);
