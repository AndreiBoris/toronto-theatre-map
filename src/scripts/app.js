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

    /**
     * Holds all the google.maps.Marker type objects so we can easily manipulate
     * them through Knockout.
     */
    self.markers = ko.observableArray([]);

    // Currently displaying the twitter list rather than a particular account.
    self.twitterListMode = ko.observable(true);
    // The twitter handle of the account we want to display. A ko.computed
    // depends on this.
    self.activeTwitter = ko.observable('');
    // Determine whether to spend resources loading up twitter DOM elements
    self.twitterIsOpen = ko.observable(true);
    // twitterListFeed depends on this.
    self.twitterListNotLoaded = ko.observable(true);

    /**
     * These filters are connected to checkboxes on the view. If one of them is 
     * on, only the markers that pass that filter will be displayed. If filter
     * is added here, be sure to add it to self.filters directly below the 
     * following block of observables.
     */
    self.filterDiverse = ko.observable(false);
    self.filterWomen = ko.observable(false);
    self.filterQueer = ko.observable(false);
    self.filterAlternative = ko.observable(false);
    self.filterCommunity = ko.observable(false);
    self.filterAboriginal = ko.observable(false);
    self.filterInternational = ko.observable(false);
    self.filterAsian = ko.observable(false);
    self.filterChildren = ko.observable(false);
    self.filterLatin = ko.observable(false);
    self.filterTechnology = ko.observable(false);
    self.filterBlack = ko.observable(false);
    self.filterOffice = ko.observable(false);
    self.filterVenue = ko.observable(false);

    /**
     * Keeps the observable and the related flag (from the markers) in one place.
     * If you change something here, be sure to keep it consistent with the 
     * block of observables directly above this comment.
     */
    self.filters = [{
        filter: self.filterDiverse,
        flag: 'diverse'
    }, {
        filter: self.filterWomen,
        flag: 'women'
    }, {
        filter: self.filterQueer,
        flag: 'queer'
    }, {
        filter: self.filterAlternative,
        flag: 'alternative'
    }, {
        filter: self.filterCommunity,
        flag: 'community'
    }, {
        filter: self.filterAboriginal,
        flag: 'aboriginal'
    }, {
        filter: self.filterInternational,
        flag: 'international'
    }, {
        filter: self.filterAsian,
        flag: 'asian'
    }, {
        filter: self.filterChildren,
        flag: 'children'
    }, {
        filter: self.filterLatin,
        flag: 'latin'
    }, {
        filter: self.filterTechnology,
        flag: 'technology'
    }, {
        filter: self.filterBlack,
        flag: 'black'
    }, {
        filter: self.filterOffice,
        flag: 'office'
    }, {
        filter: self.filterVenue,
        flag: 'venue'
    }];

    /**
     * Runs whenever one of the filter checkboxes is changed. It filters which
     * items are visible based on varied criteria.
     *
     * NOTE: This function has many embedded loops.
     * I think its acceptable in this case because it is safe, and the projected 
     * maximum number of theatres included in this app is not likely to exceed 
     * more than a couple hundred at any point. Should this no longer be the 
     * case, this is probably one of the first things worth redesigning.
     */
    self.filterMarkers = ko.computed(function() {
        var length = self.markers().length;     // number of theatres
        var numFilters = self.filters.length;   // number of filters
        var i, j;
        var marker; // makes loop easier to read
        for (i = 0; i < length; i++) {          // check each theatre

            marker = self.markers()[i];         // current theatre

            // Here we make the theatre visible. This makes it so this function
            // can handle both a filter being turned on and off.
            mapManager.util.showItem(marker);

            for (j = 0; j < numFilters; j++) {
                if (self.filters[j].filter()) {
                    if (mapManager.util.itemFailsFilter(marker, self.filters[j].flag)) {
                        break;
                    }
                }
            }
        }
    });

    self.clearFilters = function() {
        var numFilters = self.filters.length;
        var i;
        for (i = 0; i < numFilters; i++) {
            self.filters[i].filter(false);
        }
    };

    /**
     * These booleans are used 
     */
    self.sortedAlpha = false;
    self.sortedFounded = false;

    self.resetSorts = function(exception) {
        var saved = self[exception];
        self.sortedFounded = false;
        self.sortedAlpha = false;
        self[exception] = saved;
    };

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

    // just a demonstration of our ability to openInfoWindow without using click
    self.moveMarker = function() {
        self.openInfoWindow(0);
    };

    self.sortListAlpha = function() {
        self.resetSorts('sortedAlpha');
        if (self.sortedAlpha) {
            self.sortedAlpha = false;
            self.markers.sort(mapManager.util.alphabeticalSortReverse);
        } else {
            self.sortedAlpha = true;
            self.markers.sort(mapManager.util.alphabeticalSort);
        }
    };

    self.sortListFounding = function() {
        self.resetSorts('sortedFounded');
        if (self.sortedFounded) {
            self.sortedFounded = false;
            self.markers.sort(mapManager.util.foundingSortReverse);
        } else {
            self.sortedFounded = true;
            self.markers.sort(mapManager.util.foundingSort);
        }
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
                listed: ko.observable(true),
                founded: markerItem.founded,
                flags: markerItem.flags,
                infoWin: {}
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
        // self.ready(true);
    };
};


/**
 * tmvm is the instantiated ViewModel that we use to load the initial marker 
 * array through the initMap function in mapmaker.js
 * @type {TheatreMapViewModel}
 */
var tmvm = new TheatreMapViewModel();
ko.applyBindings(tmvm);
