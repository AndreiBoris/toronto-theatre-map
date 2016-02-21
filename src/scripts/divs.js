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

    // Wrapper that holds all right divs 
    self.$rightDivWrapper = $('#right-divs-wrapper');

    /**
     * Track whether each respective div is open.
     */
    self.listIsOpen = ko.observable(false);
    self.filterIsOpen = ko.observable(false);
    self.leftDivOpen = ko.observable(false);
    self.twitterIsOpen = ko.observable(false);

    /**
     * Required to support slide and glow animations
     */
    self.$divList = $('#list-div');
    self.$tabHLList = $('#list-tab-highlight');
    self.$tabBackList = $('#list-tab-back');
    self.$tabAllList = $('.list-tab-image');

    self.$divFilter = $('#filter-div');
    self.$tabHLFilter = $('#filter-tab-highlight');
    self.$tabBackFilter = $('#filter-tab-back');
    self.$tabAllFilter = $('.filter-tab-image');

    // Support tab and glow animations
    self.$divTwitter = $('#twitter-div');
    self.$tabHLTwitter = $('#twitter-tab-highlight');
    self.$tabBackTwitter = $('#twitter-tab-back');
    self.$tabAllTwitter = $('.twitter-tab-image');

    /**
     * This is the div that comes in from the left and displays information 
     * about a marker.
     */
    self.$divDisplay = $('#display-div');
    self.$directionsButton = $('#direction-button');
    self.showDirections = ko.observable(false);

    /**
     * This button on the InfoWindow opens the left-div
     */
    self.$leftDivOpener = $('#left-div-open-button');

    /**
     * The credit div at the bottom of the app.
     */
    self.$creditDiv = $('#credit-div');
    self.creditOn = ko.observable(false);

    /**
     * Overlay
     */
    self.$overlayScreen = $('#overlay-screen');
    self.$buttonOverlay = $('.button-overlay');
    self.$titleOverlay = $('.title-background');
    self.$rightOverlay = $('.right-overlay');
    self.$titleToronto = $('.title-toronto');
    self.$titleText = $('.title-text');
    self.$loadButton = $('#load-button');
    self.$loadMover = $('#load-mover');

    // Credit marker that allows us to bring out the credit div
    self.$creditMarker = $('#credit-marker');

    /**
     * Close the info div.
     */
    self.closeLeftDiv = function() {
        self.$divDisplay.addClass('left-div-off');
        self.$divDisplay.removeClass('left-div-on');
        self.leftDivOpen(false);
    };

    /**
     * Close the info div and the Info Window to clear the map of clutter.
     */
    self.closeMarkerInfo = function() {
        self.closeDirections();
        self.closeLeftDiv();
        self.closeInfoWindow();
        self.closeRightDivs();
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
    };


    /**
     * Hide the credit marker on small screens when any right-div is on to avoid
     * having the credit marker appear over these divs.
     */
    self.hideCredits = ko.computed(function() {
        if (self.listIsOpen() || self.filterIsOpen() || self.twitterIsOpen()){
            self.$creditMarker.addClass('hide-credit');
        } else {
            self.$creditMarker.removeClass('hide-credit');
        }
    });

    /**
     * Fades out button on Info Window that displays the left div when it would
     * have no effect.
     */
    self.fadeDisplayDivButton = ko.computed(function() {
        if (self.leftDivOpen()) {
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
