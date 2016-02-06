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

    self.listIsOpen = ko.observable(false);

    self.$listDiv = $('#list-div');
    self.$listTabHL = $('#list-tab-highlight');
    self.$listTabBack = $('#list-tab-back');
    self.$listTabAll = $('.list-tab-image');

    self.slideList = function() {
        if (self.listIsOpen()) { // then close it
            console.log('Closing list.'); // DEBUG
            self.listIsOpen(false);
            self.$listDiv.addClass('right-div-off'); // Place the div offscreen
            self.$listTabAll.addClass('tab-off'); // Move the tab as well
            self.$listDiv.removeClass('right-div-on');
            self.$listTabAll.removeClass('tab-on');
            self.$listTabBack.css('opacity', 0); // Show List label.
        } else { // open list
            console.log('Opening list.'); // DEBUG
            self.listIsOpen(true);
            self.determineNeedToReload(); // May need to replace loaded DOM element
            self.$listDiv.addClass('right-div-on'); // Place the div onscreen
            self.$listTabAll.addClass('tab-on'); // Move the tab as well
            self.$listDiv.removeClass('right-div-off');
            self.$listTabAll.removeClass('tab-off');
            self.$listTabBack.css('opacity', 1); // Show back button.
        }
    };

    self.optionsIsOpen = ko.observable(false);

    self.$optionsDiv = $('#options-div');
    self.$optionsTabHL = $('#options-tab-highlight');
    self.$optionsTabBack = $('#options-tab-back');
    self.$optionsTabAll = $('.options-tab-image');

    self.slideOptions = function() {
        if (self.optionsIsOpen()) { // then close it
            console.log('Closing options.'); // DEBUG
            self.optionsIsOpen(false);
            self.$optionsDiv.addClass('right-div-off'); // Place the div offscreen
            self.$optionsTabAll.addClass('tab-off'); // Move the tab as well
            self.$optionsDiv.removeClass('right-div-on');
            self.$optionsTabAll.removeClass('tab-on');
            self.$optionsTabBack.css('opacity', 0); // Show List label.
        } else { // open options
            console.log('Opening options.'); // DEBUG
            self.optionsIsOpen(true);
            self.determineNeedToReload(); // May need to replace loaded DOM element
            self.$optionsDiv.addClass('right-div-on'); // Place the div onscreen
            self.$optionsTabAll.addClass('tab-on'); // Move the tab as well
            self.$optionsDiv.removeClass('right-div-off');
            self.$optionsTabAll.removeClass('tab-off');
            self.$optionsTabBack.css('opacity', 1); // Show back button.
        }
    };

    // To determine whether to spend resources loading up twitter DOM elements
    self.twitterIsOpen = ko.observable(false);

    // To determine whether to load the twitter list or a particular account.
    self.twitterListView = ko.observable(true);

    self.$twitterDiv = $('#twitter-div');
    self.$twitterTabHL = $('#twitter-tab-highlight');
    self.$twitterTabBack = $('#twitter-tab-back');
    self.$twitterTabAll = $('.twitter-tab-image');

    /**
     * Slide the twitter pane in and out of view, enabling/disabling its drain 
     * on resources.
     */
    self.slideTwitter = function() {
        if (self.twitterIsOpen()) { // then close it
            console.log('Closing twitter.'); // DEBUG
            self.twitterIsOpen(false); // Don't load anything to Twitter
            self.$twitterDiv.addClass('right-div-off'); // Place the div offscreen
            self.$twitterTabAll.addClass('tab-off'); // Move the tab as well
            self.$twitterDiv.removeClass('right-div-on');
            self.$twitterTabAll.removeClass('tab-on');
            self.$twitterTabBack.css('opacity', 0); // Show Twitter logo.
        } else { // open twitter
            console.log('Opening twitter.'); // DEBUG
            self.twitterIsOpen(true); // Load things into Twitter
            self.determineNeedToReload(); // May need to replace loaded DOM element
            self.$twitterDiv.addClass('right-div-on'); // Place the div onscreen
            self.$twitterTabAll.addClass('tab-on'); // Move the tab as well
            self.$twitterDiv.removeClass('right-div-off');
            self.$twitterTabAll.removeClass('tab-off');
            self.$twitterTabBack.css('opacity', 1); // Show back button.
        }

    };

    self.activeTwitter = ko.observable(''); // current Twitter user selected
    self.lastTwitterUser = ko.observable(''); // current Twitter user loaded

    /**
     * Determine whether the loaded twitter user matches the selected one
     */
    self.newTwitterUser = ko.computed(function() {
        var result = self.activeTwitter() !== self.lastTwitterUser();
        if (result) {
            self.startGlow();
        }
        console.log('We have a new twitter user? ' + result); // DEBUG
        return result;
    });

    /**
     * The following two variables keep track of the kind of Twitter feeds that 
     * are currently loaded. Short feeds save bandwidth by only allowing recent
     * posts to be loaded. Long feeds allow users to scroll down to display a 
     * limitless number of posts. 
     */
    self.currentTwitterListLong = false;
    self.currentTwitterUserLong = false;

    /**
     * The length of Twitter feed that the user wants to see. Default is to show 
     * the short feed.
     */
    self.twitterLong = ko.observable(false);

    /**
     * These observables are used by the computed newTwitterUserFeed and 
     * newTwitterListFeed to determine whether to run and load new feeds.
     * Both of these are changed by determineNeedToReload which gets run
     * whenever there might be a difference between the current requested and 
     * current loaded Twitter feed. Default is true for both as initially no
     * Twitter feed is loaded, though this is nominal, since 
     * determineNeedToReload gets run when twitter is first opened.
     */
    self.needTwitterUserReload = ko.observable(true);
    self.needTwitterListReload = ko.observable(true);

    /**
     * This is to tell the user if the Twitter feed is long or short. It is 
     * updated by updateTwitterLengthIndicator.
     */
    self.twitterLengthIndicator = ko.observable('Short');

    /**
     * If the twitter list feed has never been loaded before, it should be 
     * loaded whenever the user requests it.
     */
    self.firstListLoad = true;

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
            self.startGlow();
        }
    };

    /**
     * Toggled by user interaction on the view. Changes whether a short or long
     * feed should be requested.
     */
    self.toggleTwitterLength = function() {
        console.log('Toggling twitter length.');
        self.twitterLong(!self.twitterLong()); // Toggle feed type requested.
        // User-readable string about requested feed type.
        self.updateTwitterLengthIndicator();
        // A change to requested feed type might require a reload.
        self.determineNeedToReload();
    };

    /**
     * Change user-readable indicator about the currently requested Twitter feed
     * length.
     */
    self.updateTwitterLengthIndicator = function() {
        if (self.twitterLong()) { // Check the observable regarded feed length
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
     * Begin the Twitter glow animation on the tab, indicating some update to 
     * the Twitter feed.
     */
    self.startGlow = function() {
        if (!self.twitterIsOpen()) { // If the twitter div is open, don't.
            window.requestAnimationFrame(self.twitterGlow); // Start glow.
        }
    };

    /**
     * Reset the glow animation variables.
     */
    self.stopGlow = function() {
        self.fading = false; // Glow begins by brightning, not fading.
        self.$twitterTabHL.css('opacity', 0); // Set to transparent.
        self.curOpacity = 0; // Transparency tracking variable.
    };

    // The twitter tab bright image is currently fading.
    self.fading = false;

    // Opacity tracking $self.$highlight
    self.curOpacity = 0;

    /**
     * Animation for the twitter glow that indicates there is new content in the 
     * Twitter div.
     */
    self.twitterGlow = function() {
        if (self.twitterIsOpen()) { // Stop the animation if Twitter is open.
            console.log('Twitter is open. Stop the notification tab from glowing.');
            self.stopGlow(); // Reset corresponding variables.
            return; // Stop animation.
        }
        if (self.fading) { // Decrease opacity.
            self.curOpacity -= 0.01; // Track opacity in variable.
            // Set opacity.
            self.$twitterTabHL.css('opacity', self.curOpacity);
            if (self.curOpacity <= 0) { // Reached endpoint.
                self.fading = false; // Switch to increasing opacity.
            }
        } else { // The tab is brighting. Increase opacity.
            self.curOpacity += 0.01; // Track opacity in variable.
            // Set opacity.
            self.$twitterTabHL.css('opacity', self.curOpacity);
            // Go beyond 1.0 to pause at brightest point.
            if (self.curOpacity >= 1.3) {
                self.fading = true; // Switch to decreasing opacity.
            }
        }
        // Keep animating.
        window.requestAnimationFrame(self.twitterGlow);
    };

    /**
     * This computed depends on whether the user is using the appropriate 
     * Twitter view and on what the selected twitter account is. If the view
     * is opened, the account is changed, or a different feed length is
     * requested, a new twitter feed for that account is added to the 
     * #twitter-account div.
     *
     * Both this and the twitterListFeed below occupy the same #twitter-div but
     * only one is visible at any given time.
     */
    self.newTwitterUserFeed = ko.computed(function() {
        if (self.twitterIsOpen() && !self.twitterListView() &&
            (self.needTwitterUserReload() || self.newTwitterUser())) {
            // Faster than running determineNeedToReload. We know the current 
            // loaded feed is the same as the requested one.
            self.needTwitterUserReload(false);
            // Make the computed newTwitterUser false.
            self.lastTwitterUser(self.activeTwitter());
            console.log('LOADING NEW TWITTER USER.'); // DEBUG
            console.log('Active twitter account is ' + self.activeTwitter()); // DEBUG
            // Clear div for generation of new twitter feed.
            document.getElementById('twitter-account').innerHTML = '';
            // Use twttr library to create new user timeline
            if (self.twitterLong()) { // Load a long, limitless feed.
                self.currentTwitterUserLong = true;
                twttr.widgets.createTimeline(
                    '694221648225001472', // widget ID made on my Twitter account
                    document.getElementById('twitter-account'), { // target div
                        screenName: self.activeTwitter(), // observable 
                    }
                );
            } else { // Load only the 5 most recent tweets.
                self.currentTwitterUserLong = false;
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
     * This computed will only perform its function if Twitter is open and set 
     * to display the Twitter list view. Those two conditions met, it will run 
     * if its the first time the list feed is being loaded, or if the requested
     * feed type is different from the loaded feed type.
     */
    self.newTwitterListFeed = ko.computed(function() {
        // If twitter is not open, we shouldn't waste cycles or bandwidth.
        if (self.twitterIsOpen() && self.twitterListView() &&
            (self.firstListLoad || self.needTwitterListReload())) {
            // Only first load doesn't account for difference between the 
            // loaded and requested feed types.
            self.firstListLoad = false;
            // Faster than running determineNeedToReload. We know the current 
            // loaded feed is the same as the requested one.
            self.needTwitterListReload(false);
            // Clear div for generation of new twitter feed.
            document.getElementById('twitter-list').innerHTML = '';
            console.log('LOADING NEW TWITTER LIST.'); // DEBUG
            // Use twttr library to create new list timeline
            if (self.twitterLong()) {
                self.currentTwitterListLong = true;
                twttr.widgets.createTimeline(
                    '694233158955323392', // widget ID made on my Twitter account
                    document.getElementById('twitter-list'), { // target div
                        listOwnerScreenName: 'BreathMachine', // List-holding account
                        listSlug: 'toronto-theatre', // Name of twitter list
                    }
                );
            } else {
                self.currentTwitterListLong = false;
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
                        // we turn off the Close all Windows button if a 
                        // filtered marker had its open.
                        self.checkInfoWindow(marker);
                        break; // If an item doesn't pass the filter, we don't 
                    } // need to test the other filters.
                }
            }
        }
    });

    /**
     * If the marker has its InfoWindow open we tell the marker that we are 
     * closing the window and report that all InfoWindows are now closed so the 
     * button to close the InfoWindow in the view is disabled. This only gets 
     * called by filterMarkers. NOTE: This doesn't actually close the 
     * InfoWindow, that action is performed by hideItem in itemFailsFilter.
     */
    self.checkInfoWindow = function(marker) {
        if (marker.infoWindowOpen) { // Marker's info window is open.
            marker.infoWindowOpen = false; // Tell the marker the window is closed.
            self.infoWindowOpen(false); // Tell the view that no windows are open.
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
        console.log('Accessing marker.');
        console.log('The screen width is ' + mapManager.util.screenWidth);
        if (self.listIsOpen() && mapManager.util.screenWidth < 700){
            self.slideList(); // close list div on small screen when accessing
        }
        self.openInfoWindow(marker);
        self.activeTwitter(marker.twitterHandle);
        self.userTwitter(); // Go to the marker's corresponding twitter feed
        self.determineNeedToReload(); // We might have a new twitter feed to load
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
