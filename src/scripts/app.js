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
    self.twitterListView = ko.observable(true);

    // Determine whether to spend resources loading up twitter DOM elements
    self.twitterIsOpen = ko.observable(false);

    self.slideTwitter = function() {
        var twitterDiv = document.getElementById('twitter-div');
        if (self.twitterIsOpen()) {
            console.log('Closing twitter.');
            self.twitterIsOpen(false);
            twitterDiv.className = 'twitter-off';
        } else {
            console.log('Opening twitter.');
            self.twitterIsOpen(true);
            twitterDiv.className = 'twitter-on';
            self.determineNeedToReload();
        }

    };

    // The twitter handle of the account we want to display. A ko.computed
    // depends on this.
    self.activeTwitter = ko.observable('');
    self.lastTwitterUser = ko.observable('');
    self.newTwitterUser = ko.computed(function() {
        var result = self.activeTwitter() !== self.lastTwitterUser();
        console.log('We have a new twitter user? ' + result);
        return (self.activeTwitter() !== self.lastTwitterUser());
    });


    self.currentTwitterListLong = ko.observable(NaN);
    self.currentTwitterUserLong = ko.observable(NaN);

    self.twitterLong = ko.observable(false);

    self.needTwitterListReload = ko.observable(true);
    self.needTwitterUserReload = ko.observable(true);

    self.twitterLengthIndicator = ko.observable('Short');

    self.firstListLoad = true;

    self.determineNeedToReload = function() {
        console.log('Determining need to reload.');
        var longList = self.currentTwitterListLong();
        var longUser = self.currentTwitterUserLong();
        var longTwitter = self.twitterLong();
        console.log('longList: ' + longList);
        console.log('longUser: ' + longUser);
        console.log('longTwitter: ' + longTwitter);
        var listResult = (longList && !longTwitter) || (!longList && longTwitter);
        var userResult = (longUser && !longTwitter) || (!longUser && longTwitter);
        console.log('Current need to reload twitter list: ' + listResult);
        console.log('Current need to reload twitter user: ' + userResult);
        self.needTwitterListReload((longList && !longTwitter) || (!longList && longTwitter));
        self.needTwitterUserReload((longUser && !longTwitter) || (!longUser && longTwitter));
    };

    self.toggleTwitterLength = function() {
        console.log('Toggling twitter length.');
        self.twitterLong(!self.twitterLong());
        self.updateTwitterLengthIndicator();
        self.determineNeedToReload();
    };

    self.updateTwitterLengthIndicator = function() {
        if (self.twitterLong()){
            self.twitterLengthIndicator('Long');
        } else {
            self.twitterLengthIndicator('Short');
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
     * Turn on twitterListView so that all Twitter account can be viewed at 
     * the same time.
     */
    self.listTwitter = function() {
        self.twitterListView(true);
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
        if (self.twitterIsOpen() && !self.twitterListView() &&
            (self.needTwitterUserReload() || self.newTwitterUser())) {
            self.needTwitterUserReload(false);
            self.lastTwitterUser(self.activeTwitter());
            console.log('LOADING NEW TWITTER USER.'); // DEBUGGING
            console.log('Active twitter account is ' + self.activeTwitter()); // DEBUGGING
            // Clear div for generation of new twitter feed.
            document.getElementById('twitter-account').innerHTML = '';
            // Use twttr library to create new user timeline
            if (self.twitterLong()) {
                self.currentTwitterUserLong(true);
                twttr.widgets.createTimeline(
                    '694221648225001472', // widget ID made on my Twitter account
                    document.getElementById('twitter-account'), { // target div
                        screenName: self.activeTwitter(), // observable 
                    }
                );
            } else {
                self.currentTwitterUserLong(false);
                twttr.widgets.createTimeline(
                    '694221648225001472', // widget ID made on my Twitter account
                    document.getElementById('twitter-account'), { // target div
                        screenName: self.activeTwitter(), // observable
                        tweetLimit: 5 // Prevents excessive bandwidth use 
                    }
                );
            }
        }
    });

    /**
     * This computed depends on whether the twitter list has already been loaded
     * or not. It generates a feed to a twitter list containing all the featured
     * theatre companies.
     */
    self.twitterListFeed = ko.computed(function() {
        // If twitter is not open, we shouldn't waste cycles or bandwidth.
        if (self.twitterIsOpen() && self.twitterListView() && 
            (self.firstListLoad || self.needTwitterListReload())) {
            self.firstListLoad = false;
            self.needTwitterListReload(false);
            // Clear div for generation of new twitter feed.
            document.getElementById('twitter-list').innerHTML = '';
            console.log('LOADING NEW TWITTER LIST.'); // DEBUGGING
            // Use twttr library to create new list timeline
            if (self.twitterLong()) {
                self.currentTwitterListLong(true);
                twttr.widgets.createTimeline(
                    '694233158955323392', // widget ID made on my Twitter account
                    document.getElementById('twitter-list'), { // target div
                        listOwnerScreenName: 'BreathMachine', // List-holding account
                        listSlug: 'toronto-theatre', // Name of twitter list
                    }
                );
            } else {
                self.currentTwitterListLong(false);
                twttr.widgets.createTimeline(
                    '694233158955323392', // widget ID made on my Twitter account
                    document.getElementById('twitter-list'), { // target div
                        listOwnerScreenName: 'BreathMachine', // List-holding account
                        listSlug: 'toronto-theatre', // Name of twitter list
                        tweetLimit: 10 // Prevents excessive bandwidth use.
                    }
                );
            }

        }
    });

    // Is an an InfoWindow open? The corresponding logic is naive and worth 
    // redesigning. Currently, THIS WILL BREAK if we allow for more than one 
    // InfoWindow to be open at any given time. It is probably worth redesigning
    // the implementation of InfoWindows so that only one exists and we just 
    // update its contents, seeing as how the design hinged on only one window
    // being open.
    self.infoWindowOpen = ko.observable(false);

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

    self.filterClicked = ko.computed(function() {
        var length = self.filters.length;
        var i;
        for (i = 0; i < length; i++) {
            if (self.filters[i].filter()) {
                return true;
            }
        }
        return false;
    });

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
                        // Since only one InfoWindow can be open at a given time
                        // we turn off the Close all Windows button
                        self.checkInfoWindow(marker);
                        break; // If an item doesn't pass the filter, we don't 
                    } // need to test the other filters.
                }
            }
        }
    });

    self.checkInfoWindow = function(marker) {
        if (marker.infoWindowOpen) {
            marker.infoWindowOpen = false;
            self.infoWindowOpen(false);
        }
    };

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
        console.log('accessing');
        self.openInfoWindow(marker);
        self.activeTwitter(marker.twitterHandle);
        self.userTwitter(); // Go to the marker's corresponding twitter feed
        self.determineNeedToReload();
    };

    /**
     * Close all InfoWindows and open the one that is attached to the marker
     * @param  {object} marker  This is the marker containing the InfoWindow 
     *                          to be opened.
     */
    self.openInfoWindow = function(marker) {
        self.closeInfoWindows();
        marker.infoWin.open(mapManager.map, marker);
        // Allows for scanning whether any InfoWindows are open or not.
        marker.infoWindowOpen = true;
        self.infoWindowOpen(true); // observable for the enabling of a button
    };

    /**
     * Avoid crowding the map with open windows.
     */
    self.closeInfoWindows = function() {
        self.markers().forEach(function(marker) {
            marker.infoWin.close();
            // Allows for scanning whether any InfoWindows are open or not.
            marker.infoWindowOpen = false;
        });
        self.infoWindowOpen(false); // observable for the disabling of a button
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
            curMarker.infoWin = new google.maps.InfoWindow(mapManager.util.blankInfoWin);
            // Set up a listener on the marker that will open the corresponding
            // InfoWindow when the Marker is clicked.
            infoWindowBinder(curMarker);
            // These variables are set for readability.
            var title = markerItem.title; // Title of marker.
            var website = markerItem.website; // Website associated with marker.
            var blurb = markerItem.blurb; // Description associated with marker.
            // Fill the corresponding InfoWindow with the data we have.
            mapManager.setInfoWindow(curMarker, title, website, blurb);
        });
        // Sort the list of markers in alphabetical order such that the buttons
        // corresponding to the markers will be displayed in this way on the View
        self.sortListAlpha();
        // Save coordinates to localStorage so that we can avoid using AJAX
        // calls next time around. DOESN'T WORK YET.
        // mapManager.store();
    };
};


/**
 * tmvm is the instantiated ViewModel that we use to load the initial marker 
 * array through the initMap function in mapmaker.js
 * @type {TheatreMapViewModel}
 */
var tmvm = new TheatreMapViewModel();
ko.applyBindings(tmvm);
