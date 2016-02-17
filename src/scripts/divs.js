var mapManager = mapManager || {};
var ko = ko || {};

/**
 * The module provides methods for opening and closing the offscreen divs.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} mapManager  Object with map related methods and variables.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager) {
    'use strict';

    /**
     * Close the info div.
     */
    self.closeLeftDiv = function() {
        self.$divInfo.addClass('left-div-off');
        self.$divInfo.removeClass('left-div-on');
        self.leftDivOpen(false);
    };

    /**
     * Close the info div and the Info Window to clear the map of clutter.
     */
    self.closeMarkerInfo = function() {
        self.closeDirections();
        self.closeLeftDiv();
        self.closeInfoWindow();
    };

    /**
     * Open the Info Window on top of marker. Its contents were already set 
     * earlier in the accessMarker call.
     * @param  {object} marker  This is the marker containing the InfoWindow 
     *                          to be opened.
     */
    self.openInfoWindow = function(marker) {
        self.infoWindow.open(mapManager.map, marker);
        // Pan down to make sure the open left-div doesn't cover the Info Window
        mapManager.map.panBy(0, -160);
    };

    /**
     * Close the only info window that is on the map.
     */
    self.closeInfoWindow = function() {
        self.infoWindow.close();
    };

    /**
     * Toggle the credits between being on and offscreen.
     */
    self.slideCredits = function() {
        self.creditOn(!self.creditOn());
        console.log('going on with credits');
        console.log(self.creditOn());
    };

    self.fadeDisplayDivButton = ko.computed(function() {
        if (self.leftDivOpen()){
            self.$leftDivOpener.addClass('button-disabled');
        } else {
            self.$leftDivOpener.removeClass('button-disabled');
        }
    });

    /**
     * Determine message for the button on the InfoWindow that brings out the 
     * display div 
     * @return {string}   Text to display on the button.
     */
    self.detailText = ko.computed(function() {
        return self.showDirections() ? 'Direction Steps' : 'Get Details';
    });

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager));
