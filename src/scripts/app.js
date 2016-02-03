var ko = ko || {};
var google = google || {};
var mapManager = mapManager || {};
var twttr = twttr || {};

/**
 * The ViewModel is a function to take advantage of the 'var self = this' idiom
 */
var TheatreMapViewModel = function() {
    'use strict';
    var self = this;

    // Currently displaying the twitter list rather than a particular account.
    self.twitterListMode = ko.observable(true);

    /**
     * Holds all the google.maps.Marker type objects so we can easily manipulate
     * them through Knockout. Will probably need to switch to observableArray.
     * @type {Array}
     */
    self.markers = ko.observableArray([]);

    self.infoWindowsContent = ko.observableArray([]);

    self.activeTwitter = ko.observable('');

    self.twitterIsOpen = ko.observable(true);

    self.twitterListNotLoaded = ko.observable(true);

    self.crazyArray = ko.observableArray([]);

    self.showVenues = ko.observable(true);

    self.showOffices = ko.observable(true);

    self.toggleVenues = ko.computed(function() {
        self.markers().forEach(function(marker) {
            if (marker.type === 'venue') {
                if (self.showVenues()) {
                    mapManager.util.showItem(marker);
                } else {
                    mapManager.util.hideItem(marker);
                }
            }
        });
    });

    self.toggleOffices = ko.computed(function() {
        self.markers().forEach(function(marker) {
            if (marker.type === 'office') {
                if (self.showOffices()) {
                    mapManager.util.showItem(marker);
                } else {
                    mapManager.util.hideItem(marker);
                }
            }
        });
    });

    self.flipTwitter = function() {
        self.twitterListMode(!self.twitterListMode());
    };

    self.newTwitterFeed = ko.computed(function() {
        if (!self.twitterListMode() && self.twitterIsOpen()) {
            console.log('Eating resources');
            document.getElementById('twitter-account').innerHTML = '';
            twttr.widgets.createTimeline(
                '694221648225001472',
                document.getElementById('twitter-account'), {
                    screenName: self.activeTwitter(),
                    tweetLimit: 5
                }
            );
        }
    });

    self.twitterListFeed = ko.computed(function() {
        if (self.twitterListNotLoaded() && self.twitterListMode() && self.twitterIsOpen()) {
            var windowHeight = screen.height;
            console.log(windowHeight);
            self.twitterListNotLoaded(false);
            console.log('making the list for the only time');
            twttr.widgets.createTimeline(
                '694233158955323392',
                document.getElementById('twitter-list'), {
                    listOwnerScreenName: 'BreathMachine',
                    listSlug: 'toronto-theatre',
                    tweetLimit: 10
                }
            );
            document.getElementById('twitter-div').style.height = windowHeight;
            document.getElementById('twitter-list').style.height = windowHeight;
        }
    });

    /**
     * This is used inside the forEach loop in self.addMarkers. It makes sure
     * that the listeners are bound to the correct markers and that the 
     * InfoWindows open when the markers are clicked.
     * @param  {int} index      This corresponds to the index number of the
     *                          self.infoWindows and self.markers, which are 
     *                          created in parallel.
     */
    var infoWindowBinder = function(marker) {
        marker.addListener('click', function() {
            self.openInfoWindow(marker);
            self.activeTwitter(marker.twitterHandle);
        });
    };

    /**
     * Close all InfoWindows and open the one that is at position index in 
     * self.infoWindows. 
     * @param  {int} index  Corresponds to index of self.infoWindows and 
     *                      self.markers
     */
    self.openInfoWindow = function(theatre) {
        self.closeInfoWindows();
        theatre.infoWin.open(mapManager.map, theatre);
    };

    self.closeInfoWindows = function() {
        self.markers().forEach(function(marker) {
            marker.infoWin.close();
        });
    };

    // just a tester function
    self.printSomething = function() {
        console.log(self.infoWindowsContent());
    };
    // just a demonstration of our ability to openInfoWindow without using click
    self.moveMarker = function() {
        self.openInfoWindow(0);
    };

    self.sortListAlpha = function() {
        self.markers.sort(mapManager.util.alphabeticalSort);
    };

    self.remoteAccess = function(theatre) {
        self.openInfoWindow(theatre);
        self.activeTwitter(theatre.twitterHandle);
    };

    /**
     * Does the following :
     *     - adds all the Markers from the mapManager onto the map
     *     - adds the InfoWindows 
     *     - binds the InfoWindows to clicks on corresponding Markers
     *     
     * We make a AJAX calls to find wikipedia resources for the InfoWindows and, 
     * when necessary, calls to Google Maps geocoding API in order to translate 
     * addresses into coordinates on the map.
     */
    self.addMarkers = function() {
        // tempInfoWindow is the placeholder name for all added InfoWindows
        var tempInfoWindow;
        /**
         * mapManager.markerData holds a series of objects with the information 
         * about theatres needed to create appropriate Markers.
         * 
         * @param  {object} markerData        An object holding information 
         *                                    about a theatre venue.
         *                                    
         * @param  {int}    index             The position in the array we're 
         *                                    on, this is useful for the AJAX 
         *                                    calls we make that use the indices 
         *                                    to asynchronously apply retrieved 
         *                                    data to the correct Markers and 
         *                                    InfoWindows.               
         */
        mapManager.markerData.forEach(function(markerItem, index) {
            // Add a marker with the position 0,0, which we will later move.
            self.markers.push(new google.maps.Marker({
                position: mapManager.util.nullPosition,
                map: mapManager.map,
                title: markerItem.title,
                twitterHandle: markerItem.twitter,
                index: index,
                icon: markerItem.icon,
                type: markerItem.type,
                listed: ko.observable(true)
            }));

            /**
             * If the markerItem has coordinates, use those. If it has an
             * address, we can make a Google Maps Geocoding call to find the 
             * corresponding coordinates. Failing those two things, we can't 
             * display the Marker.
             */
            if (markerItem.position) {
                self.markers()[index].setPosition(markerItem.position);
            } else if (markerItem.address) {
                mapManager.mapPositionAJAX(markerItem.address, self.markers(), index);
            } else {
                // Take the marker off the map.
                self.markers()[index].setMap(null);
            }

            // Create an empty InfoWindow which we will fill below.
            tempInfoWindow = new google.maps.InfoWindow(mapManager.util.blankInfoWin);

            self.markers()[index].infoWin = tempInfoWindow;
            // Set up a listener on the marker that will open the corresponding
            // InfoWindow when the Marker is clicked.
            infoWindowBinder(self.markers()[index]);

            // Here is the window we're currently making.
            var curInfoWindow = self.markers()[index].infoWin;

            var title = markerItem.title;
            var website = markerItem.website;
            var blurb = markerItem.blurb;

            // If we have all the information, we don't need to do a wiki AJAX
            // call.
            if (title && website && blurb) {
                mapManager.infoWindowMaker(curInfoWindow, title, website, blurb);
            } else if (title) {
                mapManager.infoWinWikiAJAX(title, self.markers(), index);
            } else { // If there is no title, we can't do a wikipedia AJAX call.
                mapManager.infoWindowMaker(curInfoWindow, title, website, blurb);
            }
        });
        self.sortListAlpha();
        // Save coordinates to localStorage so that we can avoid using AJAX
        // calls next time around. DOESN'T WORK YET.
        mapManager.store();
    };
};


/**
 * tmvm is the instantiated ViewModel that we use to load the initial marker 
 * array through the initMap function in mapmaker.js
 * @type {TheatreMapViewModel}
 */
var tmvm = new TheatreMapViewModel();
ko.applyBindings(tmvm);
