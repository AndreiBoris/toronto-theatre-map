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

    self.$twitterErrorDiv = $('#twitter-error');
    self.errorTimeoutRequest = null; // Allows us to clear old requests

    /**
     * We hide the error div momentarily so that it doesn't normally get seen
     * by users. It will only appear if a twitter feed did not load after a 
     * full second and a half following a request.
     */
    self.blinkTwitterError = function() {
        // If we don't clear the request then an older timeout request can 
        // interrupt the process and display the error when it shouldn't be 
        // displayed.
        if (self.errorTimeoutRequest){ 
            clearTimeout(self.errorTimeoutRequest);
        }
        self.$twitterErrorDiv.hide();
        self.errorTimeoutRequest = setTimeout(function() {
            self.$twitterErrorDiv.show();
        }, 1500);
    };

    /**
     * Holds all the google.maps.Marker type objects so we can easily manipulate
     * them through Knockout.
     */
    self.markers = ko.observableArray([]);

    /**
     * Track whether each respective div is open.
     */
    self.listIsOpen = ko.observable(false);
    self.filterIsOpen = ko.observable(false);
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

    self.$divTwitter = $('#twitter-div');
    self.$tabHLTwitter = $('#twitter-tab-highlight');
    self.$tabBackTwitter = $('#twitter-tab-back');
    self.$tabAllTwitter = $('.twitter-tab-image');

    /**
     * Slide the div with the list of theatres on and off screen.
     */
    self.slideList = function() {
        if (self.listIsOpen()) { // Then close it
            console.log('Closing list.'); // DEBUG
            self.listIsOpen(false); // Update value for other uses
            self.$divList.addClass('right-div-off'); // Place the div offscreen
            self.$tabAllList.addClass('tab-off'); // Move the tab as well
            self.$divList.removeClass('right-div-on');
            self.$tabAllList.removeClass('tab-on');
            self.$tabBackList.css('opacity', 0); // Show list label.
        } else { // open list
            if (self.glowingList) { // Shouldn't glow if the div is open.
                self.glowingList = false; // Update for glowAnimation
                self.stopGlow(); // Reset default glow values
            }
            console.log('Opening list.'); // DEBUG
            self.listIsOpen(true); // Update value for other uses
            self.$divList.addClass('right-div-on'); // Place the div onscreen
            self.$tabAllList.addClass('tab-on'); // Move the tab as well
            self.$divList.removeClass('right-div-off');
            self.$tabAllList.removeClass('tab-off');
            self.$tabBackList.css('opacity', 1); // Show back button.
        }
    };



    self.slideFilter = function() {
        if (self.filterIsOpen()) { // then close it
            console.log('Closing filter.'); // DEBUG
            self.filterIsOpen(false);
            self.$divFilter.addClass('right-div-off'); // Place the div offscreen
            self.$tabAllFilter.addClass('tab-off'); // Move the tab as well
            self.$divFilter.removeClass('right-div-on');
            self.$tabAllFilter.removeClass('tab-on');
            self.$tabBackFilter.css('opacity', 0); // Show List label.
        } else { // open filter
            console.log('Opening filter.'); // DEBUG
            self.filterIsOpen(true);
            self.$divFilter.addClass('right-div-on'); // Place the div onscreen
            self.$tabAllFilter.addClass('tab-on'); // Move the tab as well
            self.$divFilter.removeClass('right-div-off');
            self.$tabAllFilter.removeClass('tab-off');
            self.$tabBackFilter.css('opacity', 1); // Show back button.
        }
    };

    // To determine whether to load the twitter list or a particular account.
    self.twitterListView = ko.observable(true);

    /**
     * Slide the twitter pane in and out of view, enabling/disabling its drain 
     * on resources.
     */
    self.slideTwitter = function() {
        if (self.twitterIsOpen()) { // then close it
            console.log('Closing twitter.'); // DEBUG
            self.twitterIsOpen(false); // Don't load anything to Twitter
            self.$divTwitter.addClass('right-div-off'); // Place the div offscreen
            self.$tabAllTwitter.addClass('tab-off'); // Move the tab as well
            self.$divTwitter.removeClass('right-div-on');
            self.$tabAllTwitter.removeClass('tab-on');
            self.$tabBackTwitter.css('opacity', 0); // Show Twitter logo.
        } else { // open twitter
            console.log('Opening twitter.'); // DEBUG
            self.twitterIsOpen(true); // Load things into Twitter
            self.determineNeedToReload(); // May need to replace loaded DOM element
            self.$divTwitter.addClass('right-div-on'); // Place the div onscreen
            self.$tabAllTwitter.addClass('tab-on'); // Move the tab as well
            self.$divTwitter.removeClass('right-div-off');
            self.$tabAllTwitter.removeClass('tab-off');
            self.$tabBackTwitter.css('opacity', 1); // Show back button.
        }

    };

    self.currentTitle = ko.observable('');
    self.currentWebsite = ko.observable('');
    self.currentBlurb = ko.observable('');
    self.currentAddress = ko.observable('');

    self.currentInfo = ko.computed(function() {
        var content = '<div><span class="info-title">' +
            self.currentTitle() +
            '</span><br>' +
            self.currentAddress() +
            '</div>';
        return content;
    });

    self.currentDisplay = ko.computed(function() {
        var content = '<div class="current-display"><h4><a target="_blank" href="' +
            self.currentWebsite() + '">' +
            self.currentTitle() +
            '</a></h4>' +
            '<p>' +
            self.currentBlurb() + '</p>' +
            '<br>' +
            self.currentAddress() + '</div>';
        return content;
    });

    self.activeTwitter = ko.observable(''); // current Twitter user selected
    self.lastTwitterUser = ko.observable(''); // current Twitter user loaded

    /**
     * Determine whether the loaded twitter user matches the selected one
     */
    self.newTwitterUser = ko.computed(function() {
        var result = self.activeTwitter() !== self.lastTwitterUser();
        if (result) {
            self.glowingTwitter = true;
        }
        console.log('We have a new twitter user? ' + result); // DEBUG
        console.log(self.glowingTwitter);
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
            self.glowingTwitter = true;
        }
    };

    self.$twitterListDiv = $('#twitter-list');
    self.$twitterAccountDiv = $('#twitter-account');

    /**
     * Toggled by user interaction on the view. Changes whether a short or long
     * feed should be requested.
     */
    self.toggleTwitterLength = function() {
        console.log('Toggling twitter length.');
        self.blinkTwitterError(); // Hide twitter error message momentarily.
        self.twitterLong(!self.twitterLong()); // Toggle feed type requested.
        // If the twitter list is long, we don't need to allow css scrolling
        if (self.twitterLong()) {
            self.$twitterListDiv.removeClass('scroll-div');
            self.$twitterAccountDiv.removeClass('scroll-div');
        } else {
            self.$twitterListDiv.addClass('scroll-div');
            self.$twitterAccountDiv.addClass('scroll-div');
        }
        // A change to requested feed type might require a reload.
        self.determineNeedToReload();
    };

    self.switchTwitter = function() {
        self.blinkTwitterError();
        self.twitterListView(!self.twitterListView());
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

    self.glowingTwitter = false;
    // The twitter tab bright image is currently fading.
    self.glowingTwitterFading = false;
    // Opacity tracking self.$tabHLList
    self.glowingTwitterOpacity = 0;


    self.glowingList = false;
    // The twitter tab bright image is currently fading.
    self.glowingListFading = false;
    // Opacity tracking self.$tabHLList
    self.glowingListOpacity = 0;

    self.glowingFilter = false;
    // The twitter tab bright image is currently fading.
    self.glowingFilterFading = false;
    // Opacity tracking self.$tabHLList
    self.glowingFilterOpacity = 0;

    /**
     * Animation for the  glow that indicates there is new content in the any of
     * the right side divs.
     */
    self.glowAnimation = function() {
        // Stop the Twitter glow if Twitter is open.
        if (self.twitterIsOpen() && self.glowingTwitter) {
            console.log('Twitter is open. Stop the twitter tab from glowing.');
            self.glowingTwitter = false;
            self.stopGlow(); // Reset corresponding variables.
        }
        // Stop the list glow if the list is open.
        if (self.listIsOpen() && self.glowingList) {
            console.log('List is open. Stop the list tab from glowing.');
            self.glowingList = false;
            self.stopGlow(); // Reset corresponding variables.
        }
        // Reset filter glow variables if filter is open.
        if (self.filterIsOpen() && self.glowingFilter) {
            console.log('Filter is open. Reset the filter tab glow.');
            self.stopGlow(); // Reset corresponding variables.
        }
        if (self.glowingTwitter) { // Glow when some change occured.
            self.animateGlowTab('Twitter');
        }
        if (self.glowingList) { // Glow when some change occured.
            self.animateGlowTab('List');
        }
        // Glow when any filter is on and the filter tab isn't already open. 
        // Since the filter tab doesn't stop glowing by opening the tab, we have 
        // to do a slightly different testing condition.
        if (self.glowingFilter && !self.filterIsOpen()) {
            self.animateGlowTab('Filter');
        }
        // Keep animating.
        window.requestAnimationFrame(self.glowAnimation);
    };

    /**
     * This is used to make the right side tabs glow. Since all the 
     * corresponding variables are named in a consistent way, we can do this to
     * keep things dry.
     * @param  {string} type is a string starting with a capital letter that 
     *                       denotes the type of tab that we are animating
     */
    self.animateGlowTab = function(type) {
        if (self['glowing' + type + 'Fading']) { // Decrease opacity.
            self['glowing' + type + 'Opacity'] -= 0.01; // Track opacity in variable.
            // Set opacity.
            self['$tabHL' + type].css('opacity', self['glowing' + type + 'Opacity']);
            if (self['glowing' + type + 'Opacity'] <= 0) { // Reached endpoint.
                self['glowing' + type + 'Fading'] = false; // Switch to increasing opacity.
            }
        } else { // The tab is brighting. Increase opacity.
            self['glowing' + type + 'Opacity'] += 0.01; // Track opacity in variable.
            // Set opacity.
            self['$tabHL' + type].css('opacity', self['glowing' + type + 'Opacity']);
            // Go beyond 1.0 to pause at brightest point.
            if (self['glowing' + type + 'Opacity'] >= 1.3) {
                self['glowing' + type + 'Fading'] = true; // Switch to decreasing opacity.
            }
        }
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
            self.blinkTwitterError(); // Hide twitter error message momentarily.
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
                        height: screen.height * 0.67
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
            self.blinkTwitterError(); // Hide twitter error message momentarily.
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
                        height: screen.height * 0.75
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
     * Here we determine whether the Reset Filters button should be enabled.
     */
    self.filterClicked = ko.computed(function() {
        var length = self.filters.length;
        var i;
        for (i = 0; i < length; i++) {
            if (self.filters[i].filter()) {
                self.glowingFilter = true; // If filters are set, glow.
                return true;
            }
        }
        self.glowingFilter = false; // If no filters are set, don't glow.
        self.stopGlow(); // Reset glow defaults.
        return false;
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
    self.currentSort = ko.observable('');

    /**
     * Sort alphabetically. First from a-z then from z-a. Case-insensitive.
     */
    self.sortListAlpha = function() {
        self.resetSorts('sortedAlpha'); // reset all sort orders but 'sortedAlpha'
        if (self.sortedAlpha) { // then sort from z-a
            self.sortedAlpha = false; // next time sort a-z
            self.markers.sort(mapManager.util.alphabeticalSortReverse); // sort z-a
            self.currentSort('alpha-reverse');
        } else {
            self.sortedAlpha = true; // next time sort from z-a
            self.markers.sort(mapManager.util.alphabeticalSort); // sort a-z
            self.currentSort('alpha');
        }
        console.log(self.currentSort());
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
            self.currentSort('date-reverse');
        } else {
            self.sortedFounded = true; // next time sort from latest to earliest
            // sort from earliest to latest
            self.markers.sort(mapManager.util.foundingSort);
            self.currentSort('date');
        }
        console.log(self.currentSort());
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
     * Runs whenever one of the filter checkboxes is changed. It filters which
     * items are visible based on varied criteria.
     *
     * NOTE: This function has many embedded loops.
     * I think its acceptable in this case because it is safe (the function will 
     * be executed correctly, though expensively!), and the projected maximum 
     * number of theatres included in this app is not likely to exceed more than 
     * a couple hundred at any point. Should this no longer be the case, this 
     * is probably one of the first things worth redesigning.
     */
    self.filterMarkers = ko.computed(function() {
        var length = self.markers().length; // number of theatres
        var numFilters = self.filters.length; // number of filters
        var i, j;
        var marker; // makes loop easier to read
        self.glowingList = true;
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
                        //self.checkInfoWindow(marker);
                        break; // If an item doesn't pass the filter, we don't 
                    } // need to test the other filters.
                }
            }
        }
    });

    // Is an an InfoWindow open? The corresponding logic is naive and worth 
    // redesigning. Currently, THIS WILL BREAK if we allow for more than one 
    // InfoWindow to be open at any given time. It is probably worth redesigning
    // the implementation of InfoWindows so that only one exists and we just 
    // update its contents, seeing as how the design hinged on only one window
    // being open.
    //self.infoWindowOpen = ko.observable(false);

    /**
     * If the marker has its InfoWindow open we tell the marker that we are 
     * closing the window and report that all InfoWindows are now closed so the 
     * button to close the InfoWindow in the view is disabled. This only gets 
     * called by filterMarkers. NOTE: This doesn't actually close the 
     * InfoWindow, that action is performed by hideItem in itemFailsFilter.
     */
    // self.checkInfoWindow = function(marker) {
    //     if (marker.infoWindowOpen) { // Marker's info window is open.
    //         marker.infoWindowOpen = false; // Tell the marker the window is closed.
    //         self.infoWindowOpen(false); // Tell the view that no windows are open.
    //     }
    // };

    /**
     * Open the marker and set the observable holding the active twitter account
     * to the value stored in it.
     * @param  {Object} marker to access
     */
    self.accessMarker = function(marker) {
        console.log('Accessing marker.');
        console.log('The screen width is ' + mapManager.util.screenWidth);
        if (self.listIsOpen() && mapManager.util.screenWidth < 700) {
            self.slideList(); // close list div on small screen when accessing
        }
        self.currentTitle(marker.title);
        self.currentWebsite(marker.website);
        self.currentBlurb(marker.blurb);
        self.currentAddress(marker.address);
        mapManager.map.panTo(marker.getPosition());
        self.openInfoWindow(marker);
        self.infoWindow.setContent(self.currentInfo());
        self.openLeftDiv();
        self.activeTwitter(marker.twitterHandle);
        self.userTwitter(); // Twitter should go into user, rather than list, mode
        self.determineNeedToReload(); // We might have a new twitter feed to load
        //mapManager.map.panTo(marker.getPosition());
    };

    self.$divInfo = $('#info-div');

    self.openLeftDiv = function() {
        self.$divInfo.addClass('left-div-on');
        self.$divInfo.removeClass('left-div-off');
        if (mapManager.util.screenWidth < 700) {
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

    self.closeLeftDiv = function() {
        self.$divInfo.addClass('left-div-off');
        self.$divInfo.removeClass('left-div-on');
    };

    self.closeMarkerInfo = function() {
        self.closeLeftDiv();
        self.closeInfoWindows();
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
     * Close all InfoWindows and open the one that is attached to the marker
     * @param  {object} marker  This is the marker containing the InfoWindow 
     *                          to be opened.
     */
    self.openInfoWindow = function(marker) {
        //self.closeInfoWindows();
        // self.infoWindow.setPosition(marker.getPosition());
        // var position = self.infoWindow.getPosition();
        // console.log(position);
        self.infoWindow.open(mapManager.map, marker);
        mapManager.map.panBy(0, -160);
        // console.log('The screen height is ' + screen.height);
        // if (screen.height < 400) {
        //     console.log('GOING');
        //     mapManager.map.panBy(0, -300);
        // } else {
        //     mapManager.map.panBy(0, -160);
        // }
        // Allows for scanning whether any InfoWindows are open or not.
        //marker.infoWindowOpen = true;
        //self.infoWindowOpen(true); // observable for the enabling of a button
    };

    /**
     * Avoid crowding the map with open windows.
     */
    self.closeInfoWindows = function() {
        self.infoWindow.close();
        // self.markers().forEach(function(marker) {
        //     marker.infoWin.close();
        //     // Allows for scanning whether any InfoWindows are open or not.
        //     //marker.infoWindowOpen = false;
        // });
        //self.infoWindowOpen(false); // observable for the disabling of a button
    };

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

    self.infoWindow = {};

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
            infoWindowBinder(curMarker);
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
};


/**
 * tmvm is the instantiated ViewModel that we use to load the initial marker 
 * array through the initMap function in mapmaker.js
 * @type {TheatreMapViewModel}
 */
var tmvm = new TheatreMapViewModel();
ko.applyBindings(tmvm);
