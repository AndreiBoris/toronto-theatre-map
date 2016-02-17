var ko = ko || {};
var mapManager = mapManager || {};
var google = google || {};

/**
 * The module loads methods for creating the markers.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} mapManager  Object with map related methods and variables.
 * @param  {object} google      Google Maps API
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager, google) {
    'use strict';

    /**
     * Here we open the info div. Close all other divs if the screen is small
     * enough.
     */
    self.openLeftDiv = function() {
        self.$divInfo.addClass('left-div-on');
        self.$divInfo.removeClass('left-div-off');
        console.log('opening left div');
        if (mapManager.util.windowWidth < 1040) {
            if (self.listIsOpen()) {
                self.slideList();
            }
            if (self.twitterIsOpen()) {
                self.slideTwitter();
            }
            if (self.filterIsOpen()) {
                self.slideFilter();
            }
        }
    };

    /**
     * Reset the glow animation variables for all tabs that are no longer 
     * glowing.
     */
    self.stopGlow = function() {
        if (!self.glowingTwitter) { // Reset Twitter tab.
            self.glowingTwitterFading = false; // Glow begins like this.
            self.$tabHLTwitter.css('opacity', 0); // Set to transparent.
            self.glowingTwitterOpacity = 0; // Transparency tracking variable.
        }
        if (!self.glowingList) { // Reset list tab
            self.glowingTwitterFading = false; // Glow begins like this.
            self.$tabHLList.css('opacity', 0); // Set to transparent.
            self.glowingTwitterOpacity = 0; // Transparency tracking variable.
        }
        if (self.filterIsOpen()) { // Reset filter tab.
            self.glowingTwitterFading = false; // Glow begins like this.
            self.$tabHLFilter.css('opacity', 0); // Set to transparent.
            self.glowingTwitterOpacity = 0; // Transparency tracking variable.
        }

    };

    /**
     * Works to slide all right-divs off and on screen
     * @param  {string} type      The kind of div that you want to slide, start
     *                            with a Capital letter as that's how the code
     *                            is structured.
     * @param  {string} direction 'on' or 'off'
     */
    self.slideHelper = function(type, direction) {
        var lowered = type.toLowerCase();
        if (direction === 'off') {
            console.log('Closing ' + type); // DEBUG
            self[lowered + 'IsOpen'](false); // Don't load anything to Twitter
            self['$div' + type].addClass('right-div-off'); // Place the div offscreen
            self['$tabAll' + type].addClass('tab-off'); // Move the tab as well
            self['$div' + type].removeClass('right-div-on');
            self['$tabAll' + type].removeClass('tab-on');
            self['$tabBack' + type].css('opacity', 0); // Show Twitter logo.
        } else if (direction === 'on') {
            console.log('Opening ' + type); // DEBUG
            self[lowered + 'IsOpen'](true); // Load things into Twitter
            self.determineNeedToReload(); // May need to replace loaded DOM element
            self['$div' + type].addClass('right-div-on'); // Place the div onscreen
            self['$tabAll' + type].addClass('tab-on'); // Move the tab as well
            self['$div' + type].removeClass('right-div-off');
            self['$tabAll' + type].removeClass('tab-off');
            self['$tabBack' + type].css('opacity', 1); // Show back button.
        } else {
            console.log('Invalid direction' + direction + 'passed to slideHelper');
        }
    };

    /**
     * Slide the div with the list of theatres on and off screen.
     */
    self.slideList = function() {
        if (self.listIsOpen()) { // Then close it
            self.slideHelper('List', 'off');
        } else { // open list
            if (self.glowingList) { // Shouldn't glow if the div is open.
                self.glowingList = false; // Update for glowAnimation
                self.stopGlow(); // Reset default glow values
            }
            self.slideHelper('List', 'on');
        }
    };

    /**
     * Toggle whether the filter div in on or offscreen.
     */
    self.slideFilter = function() {
        if (self.filterIsOpen()) { // then close it
            self.slideHelper('Filter', 'off');
        } else { // open filter
            self.slideHelper('Filter', 'on');
        }
    };


    /**
     * Slide the twitter pane in and out of view, enabling/disabling its drain 
     * on resources.
     */
    self.slideTwitter = function() {
        if (self.twitterIsOpen()) { // then close it
            self.slideHelper('Twitter', 'off');
        } else { // open twitter
            self.slideHelper('Twitter', 'on');
        }
    };

    /**
     * Turn off twitterListView so that individual Twitter accounts can be 
     * viewed.
     */
    self.userTwitter = function() {
        self.twitterListView(false);
    };

    /**
     * Update needTwitterUserReload and needTwitterListReload depending on 
     * whether the currently loaded feed type matches the requested feed type.
     * This function is called whenever any change is done to the Twitter 
     * portion of the app. There were some issues regarding using a computed 
     * for this purpose that I did not fully understand so this solution was 
     * chosen.
     */
    self.determineNeedToReload = function() {
        // The following three variables are created for readability.
        var longUser = self.currentTwitterUserLong; // Loaded user feed
        var longList = self.currentTwitterListLong; // Loaded list feed
        var longTwitter = self.twitterLong(); // Requested feed type
        console.log('Determining need to reload.'); // DEBUG
        console.log('longList: ' + longList); // DEBUG
        console.log('longUser: ' + longUser); // DEBUG
        console.log('longTwitter: ' + longTwitter); // DEBUG
        var listResult = (longList && !longTwitter) || (!longList && longTwitter); // DEBUG
        var userResult = (longUser && !longTwitter) || (!longUser && longTwitter); // DEBUG
        console.log('Current need to reload twitter list: ' + listResult); // DEBUG
        console.log('Current need to reload twitter user: ' + userResult); // DEBUG
        // If the requested and loaded feeds don't match, a reload is required.
        self.needTwitterUserReload((longUser && !longTwitter) ||
            (!longUser && longTwitter));
        self.needTwitterListReload((longList && !longTwitter) ||
            (!longList && longTwitter));
        if (self.needTwitterUserReload() || self.needTwitterListReload()) {
            // If there is some change worth reloading, twitter tab should glow 
            // to indicate this.
            self.glowingTwitter = true;
        }
    };

    /**
     * Open the marker and set the observable holding the active twitter account
     * to the value stored in it.
     * @param  {Object} marker to access
     */
    self.accessMarker = function(marker) {
        console.log('Accessing marker.');
        console.log('The screen width is ' + mapManager.util.windowWidth);
        if (self.listIsOpen() && mapManager.util.windowWidth < 1040) {
            self.slideList(); // close list div on small screen when accessing
        }
        // Set observables holding information on selected marker.
        self.currentTitle(marker.title);
        self.currentWebsite(marker.website);
        self.currentBlurb(marker.blurb);
        self.currentAddress(marker.address);
        self.currentPosition(marker.position);
        // This has to come after the last 4, as currentInfo is a computed based
        // on currentTitle and currentAddress.
        self.infoWindow.setContent(self.currentInfo());
        // Move to a position where the Info Window can be displayed and open it.
        mapManager.map.panTo(marker.getPosition());
        self.openInfoWindow(marker);
        // Move button to show directions to the opened InfoWindow
        self.moveButton();

        if (self.showDirections()){
            self.showDirections(false);
            mapManager.directionsDisplay.setMap(null);
        }

        self.openLeftDiv(); // Open the div that slides from offscreen left.
        self.activeTwitter(marker.twitterHandle); // What Twitter feed to get
        self.userTwitter(); // Twitter should go into user view
        self.determineNeedToReload(); // We might have a new twitter feed to load
    };

    /**
     * This is used inside the forEach loop in self.addMarkers. It makes sure
     * that the listeners are bound to the correct markers and that the 
     * InfoWindows open when the markers are clicked.
     * @param  {object} marker  This is the marker that we want to create a 
     *                          binding for.
     */
    self.infoWindowBinder = function(marker) {
        marker.addListener('click', function() {
            self.accessMarker(marker);
        });
    };

    /**
     * Does the following :
     *     - adds all the Markers from the mapManager onto the map
     *     - adds the InfoWindows 
     *     - binds the InfoWindows to open on clicks on corresponding Markers
     *     
     * When necessary, makeAJAX calls to find wikipedia resources for the 
     * InfoWindows and calls to Google Maps geocoding API in order to translate 
     * addresses into coordinates on the map. These calls only happen if there
     * is incomplete information in each markerItem.
     */
    self.addMarkers = function() {
        /**
         * mapManager.markerData holds a series of objects with the information 
         * about theatres needed to create appropriate Markers.
         * @param  {object} markerData        An object holding data for a 
         *                                    marker.                                 
         * @param  {int}    index             Used to set curMarker             
         */
        mapManager.markerData.forEach(function(markerItem, index) {
            // Store marker in an observable array self.markers.
            mapManager.pushMarker(markerItem, self.markers);
            var curMarker = self.markers()[index]; // Marker that was just pushed
            // Move the marker to the correct position on the map.
            mapManager.adjustPosition(curMarker, markerItem);
            // Add a blank InfoWindow to curMarker to be filled below.
            //curMarker.infoWin = new google.maps.InfoWindow(mapManager.util.blankInfoWin);
            // Set up a listener on the marker that will open the corresponding
            // InfoWindow when the Marker is clicked.
            //curMarker.infoWin.setContent(curMarker.title);
            self.infoWindowBinder(curMarker);
            // These variables are set for readability.
            var title = markerItem.title; // Title of marker.
            var website = markerItem.website; // Website associated with marker.
            var blurb = markerItem.blurb; // Description associated with marker.
            // Fill the corresponding InfoWindow with the data we have.
            mapManager.setDescription(curMarker, title, website, blurb);
        });

        // Sort the list of markers in alphabetical order such that the buttons
        // corresponding to the markers will be displayed in this way on the View
        self.sortListAlpha();
        // Save coordinates to localStorage so that we can avoid using AJAX
        // calls next time around. DOESN'T WORK YET.
        // mapManager.store();
        self.infoWindow = new google.maps.InfoWindow(mapManager.util.blankInfoWin);
        self.glowingList = false;
        self.pickRandomTheatre();
        /**
         * Begin the glow animation on the tabs, indicating some update to
         * particular tab. Updates are handled separately through the 
         * self.glowing* variables.
         */
        window.requestAnimationFrame(self.glowAnimation);
    };

    /**
     * This computed creates some html content to be used by self.infoWindow.
     * @return {string}   html containing the selected marker's title and 
     *                         website properly formatted.
     */
    self.currentInfo = ko.computed(function() {
        var content = '<div id="opened-info-window"><span class="info-title">' +
            self.currentTitle() +
            '</span><br>' +
            self.currentAddress() +
            '<br></div>';
        return content;
    });

    /**
     * Picks a random twitter account from the set of markers and makes it the 
     * initial active twitter in the Twitter div.
     */
    self.pickRandomTheatre = function() {
        var num = self.markers().length;
        var choice = Math.floor((Math.random() * num));
        self.activeTwitter(self.markers()[choice].twitterHandle);
        self.currentTitle(self.markers()[choice].title);
        /**
         * Since this is only run when the app loads, we don't want to have it 
         * set off the glow on the Twitter tab.
         */
        self.glowingTwitter = false;
        self.stopGlow();
    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager, google));
