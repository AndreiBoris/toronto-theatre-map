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
        flag: 'Diversity'
    }, {
        filter: self.filterWomen,
        flag: 'Women'
    }, {
        filter: self.filterQueer,
        flag: 'Queer culture'
    }, {
        filter: self.filterAlternative,
        flag: 'Alternative'
    }, {
        filter: self.filterCommunity,
        flag: 'Community focused'
    }, {
        filter: self.filterAboriginal,
        flag: 'Aboriginal'
    }, {
        filter: self.filterInternational,
        flag: 'International'
    }, {
        filter: self.filterAsian,
        flag: 'Asian-Canadian'
    }, {
        filter: self.filterChildren,
        flag: 'Theatre for children'
    }, {
        filter: self.filterLatin,
        flag: 'Latin-Canadian'
    }, {
        filter: self.filterTechnology,
        flag: 'Technology'
    }, {
        filter: self.filterBlack,
        flag: 'Black'
    }, {
        filter: self.filterOffice,
        flag: 'Company office'
    }, {
        filter: self.filterVenue,
        flag: 'Theatre venue'
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
        var length = self.markers().length; // number of theatres
        var numFilters = self.filters.length; // number of filters
        var i, j;
        var marker; // makes loop easier to read
        for (i = 0; i < length; i++) { // check each theatre

            marker = self.markers()[i]; // current theatre

            // Here we make the theatre visible. This makes it so this function
            // can handle both a filter being turned on and off.
            mapManager.util.showItem(marker);

            for (j = 0; j < numFilters; j++) { // cycle through each filter
                if (self.filters[j].filter()) { // the filter is turned on
                    if (mapManager.util.itemFailsFilter(marker, self.filters[j].flag)) {
                        break; // If an item doesn't pass the filter, we don't 
                    } // need to test the other filters.
                }
            }
        }
    });

    /**
     * This is connected to a button the view that allows users to reset the 
     * filters such that all the items are back on the screen.
     */
    self.clearFilters = function() {
        var numFilters = self.filters.length;
        var i;
        for (i = 0; i < numFilters; i++) {
            self.filters[i].filter(false); // set the observable to 'false'
        }
    };

    // These are used to sort first forwards and then backwards.
    self.sortedAlpha = false;
    self.sortedFounded = false;

    /**
     * Sort alphabetically. First from a-z then from z-a. Case-insensitive.
     */
    self.sortListAlpha = function() {
        self.resetSorts('sortedAlpha'); // reset all sort orders but 'sortedAlpha'
        if (self.sortedAlpha) { // then sort from z-a
            self.sortedAlpha = false; // next time sort a-z
            self.markers.sort(mapManager.util.alphabeticalSortReverse); // sort z-a
        } else {
            self.sortedAlpha = true; // next time sort from z-a
            self.markers.sort(mapManager.util.alphabeticalSort); // sort a-z
        }
    };

    /**
     * Sort by date that the company was founded. First from earliest to latest
     * and then from latest to earliest.
     */
    self.sortListFounding = function() {
        self.resetSorts('sortedFounded'); // reset all sort orders but 'sortedFounded'
        if (self.sortedFounded) { // then sort from latest to earliest
            self.sortedFounded = false; // next time sort from earliest to latest
            // sort from latest to earliest
            self.markers.sort(mapManager.util.foundingSortReverse);
        } else {
            self.sortedFounded = true; // next time sort from latest to earliest
            // sort from earliest to latest
            self.markers.sort(mapManager.util.foundingSort);
        }
    };

    /**
     * This is designed in such a way as to be easily scalable should other 
     * sort orders be introduced. It resets all sort order except for the one 
     * entered into the argument.
     *
     * The function allows for consistent behaviour from the sorts. Ex. the 
     * alphabetical sort will always sort from a-z first.
     * @param  {string} exception this identifies the sort parameter that we 
     *                            want to leave unchanged. 
     */
    self.resetSorts = function(exception) {
        var saved = self[exception];
        self.sortedFounded = false;
        self.sortedAlpha = false;
        self[exception] = saved;
    };

    // This switches from user view to list view on Twitter. This is probably
    // going to be replaced in some way in a later version.
    self.flipTwitter = function() {
        self.twitterListMode(!self.twitterListMode());
    };

    /**
     * This computed depends on whether the user is using the appropriate 
     * Twitter view and on what the selected twitter account is. If the view
     * is opened, or the account is changed, a new twitter feed for that 
     * account is added to the #twitter-account div.
     *
     * Both this and the twitterListFeed below occupy the same #twitter-div but
     * only one is visible at any given time.
     */
    self.newTwitterFeed = ko.computed(function() {
        if (!self.twitterListMode() && self.twitterIsOpen()) {
            console.log('Eating resources'); // DEBUGGING
            // Clear div for generation of new twitter feed.
            document.getElementById('twitter-account').innerHTML = '';
            // Use twttr library to create new user timeline
            twttr.widgets.createTimeline(
                '694221648225001472', // widget ID made on my Twitter account
                document.getElementById('twitter-account'), { // target div
                    screenName: self.activeTwitter(), // observable
                    tweetLimit: 5 // Prevents excessive bandwidth use 
                }
            );
        }
    });

    /**
     * This computed depends on whether the twitter list has already been loaded
     * or not. It generates a feed to a twitter list containing all the featured
     * theatre companies.
     */
    self.twitterListFeed = ko.computed(function() {
        // If twitter is not open, we shouldn't waste cycles or bandwidth.
        if (self.twitterListNotLoaded() && self.twitterListMode() && self.twitterIsOpen()) {
            self.twitterListNotLoaded(false); // Prevents waste of bandwidth.
            console.log('making the list for the only time'); // DEBUGGING
            // Use twttr library to create new list timeline
            twttr.widgets.createTimeline(
                '694233158955323392', // widget ID made on my Twitter account
                document.getElementById('twitter-list'), { // target div
                    listOwnerScreenName: 'BreathMachine', // List-holding account
                    listSlug: 'toronto-theatre', // Name of twitter list
                    tweetLimit: 10 // Prevents excessive bandwidth use.
                }
            );
        }
    });

    /**
     * This is used inside the forEach loop in self.addMarkers. It makes sure
     * that the listeners are bound to the correct markers and that the 
     * InfoWindows open when the markers are clicked.
     * @param  {object} marker  This is the marker that we want to create a 
     *                          binding for.
     */
    var infoWindowBinder = function(marker) {
        marker.addListener('click', function() {
            self.accessMarker(marker);
        });
    };

    /**
     * Open the marker and set the observable holding the active twitter account
     * to the value stored in it.
     * @param  {Object} marker to access
     */
    self.accessMarker = function(marker) {
        self.openInfoWindow(marker);
        self.activeTwitter(marker.twitterHandle);
    };

    /**
     * Close all InfoWindows and open the one that is attached to the marker
     * @param  {object} marker  This is the marker containing the InfoWindow 
     *                          to be opened.
     */
    self.openInfoWindow = function(marker) {
        self.closeInfoWindows();
        marker.infoWin.open(mapManager.map, marker);
    };

    /**
     * Avoid crowding the map with open windows.
     */
    self.closeInfoWindows = function() {
        self.markers().forEach(function(marker) {
            marker.infoWin.close();
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
        // tempInfoWindow is the placeholder for all InfoWindows added to the 
        // markers
        var tempInfoWindow;
        /**
         * mapManager.markerData holds a series of objects with the information 
         * about theatres needed to create appropriate Markers.
         * 
         * @param  {object} markerData        An object holding data for a 
         *                                    marker.
         *                                    
         * @param  {int}    index             This is useful for giving the 
         *                                    markers each an ID and for 
         *                                    referring to the current marker
         *                                    being added to self.markers               
         */
        mapManager.markerData.forEach(function(markerItem, index) {
            // Store marker in an observable array self.markers.
            self.markers.push(new google.maps.Marker({
                position: mapManager.util.nullPosition, // 0,0 placeholder
                map: mapManager.map,                    // the Google map
                title: markerItem.title,                // important for many methods
                twitterHandle: markerItem.twitter,      // used to access twitter feed
                icon: markerItem.icon,                  // graphic on the map
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
                mapManager.mapPositionAJAX(markerItem.address, self.markers()[index]);
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
                mapManager.infoWinWikiAJAX(self.markers()[index], website, blurb);
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
