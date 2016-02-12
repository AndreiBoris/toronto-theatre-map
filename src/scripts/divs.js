var mapManager = mapManager || {};

/**
 * The ViewModel is a function to take advantage of the 'var self = this' idiom
 */
var TheatreMapViewModel = (function(self) {
    'use strict';

    /**
     * Close the info div.
     */
    self.closeLeftDiv = function() {
        self.$divInfo.addClass('left-div-off');
        self.$divInfo.removeClass('left-div-on');
    };

    /**
     * Close the info div and the Info Window to clear the map of clutter.
     */
    self.closeMarkerInfo = function() {
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

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}));
