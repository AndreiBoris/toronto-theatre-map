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

var google = google || {};
// instantiated TheatreMapViewModel from app.js
var tmvm = tmvm || {};

/**
 * mapManager is responsible for holding the map, markers data, and 
 * related logic
 */
var mapManager = {

    /**
     * The Google Maps API runs this function as a callback when it loads in 
     * order to pan over the correct region and then to load all the markers 
     * from the model.
     */
    initMap: function() {
        'use strict';

        var startingMapPosition = {
            lat: 43.657899,
            lng: -79.3782433
        };

        // Create a Map object and specify the DOM element for display.
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: startingMapPosition,
            scrollwheel: true,
            zoom: 12,
            // This places the selection between map and satellite view at the 
            // bottom of the screen.
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
        });

        /**
         * Add the markers stored in mapManager.markerData through an 
         * instantiated TheatreMapViewModel object. mapManager.markerData is 
         * populated when mapManager.load() is run at the bottom of this file.
         */
        tmvm.addMarkers();
    },

    /**
     * Perform a MediaWiki API AJAX request and apply retrieved info to the 
     * InfoWindow stored at position index of array.
     * @param  {string} nameOfTheatre Name we use to search the wiki
     * @param  {array}  array         Each item is an InfoWindow object
     * @param  {int}    index         Determines which InfoWindow to send 
     *                                retrieved info to.
     * @return {null}                 Returns if the API takes too long to 
     *                                        respond. In which case we apply
     *                                        the corresponding content from the
     *                                        a mapManager.markerData item. 
     */
    infoWinWikiAJAX: function(nameOfTheatre, array, index) {
        'use strict';

        console.log('running wiki AJAX');

        var self = this;

        var formattedName = nameOfTheatre.replace(/ /g, '_');

        // Only try find 1 article (specified by the &limit=1 part)
        var urlWiki = ('https://en.wikipedia.org/w/api.php?action=opensearch&' +
            'format=json&search=' + formattedName + '&limit=1&redirects=resolve');

        /**
         * wikipediaRequestTimeout will be cancelled if the AJAX request below 
         * is successful.
         */
        var wikipediaRequestTimeout = setTimeout(function() {
            // Fall back on whatever content is provided by markerData.
            array[index].infoWin.setContent(self.markerData[index].content);
            return;
        }, 5000);

        $.ajax({
            url: urlWiki,
            dataType: 'jsonp',
            success: function(data) {
                // Cancel the timeout since AJAX request is successful.
                clearTimeout(wikipediaRequestTimeout);
                // We either found 1 article or we found 0, hence the boolean.
                var wikiFound = data[1].length;
                var infoWindow = array[index].infoWin;
                var title, website, blurb;
                if (wikiFound) {
                    website = data[3][0];
                    blurb = data[2][0];
                } else {
                    // Fall back on whatever content is provided by markerData.
                    website = self.markerData[index].website;
                    blurb = self.markerData[index].blurb;
                }
                self.infoWindowMaker(infoWindow, nameOfTheatre, website, blurb);
            }
        });
    },
    /**
     * Perform a Google Geocoding API request and apply retrieved coordinates 
     * to Marker stored at index of array.
     * @param  {string} address The real world address used to find coordinates.
     * @param  {array}  array   An array of google.maps.Marker objects.
     * @param  {int}    index   Determines which Marker to send coordinates to.
     */
    mapPositionAJAX: function(address, marker) {
        'use strict';
        var self = this;

        // Might be safer to have no spaces in the url.
        var formattedAddress = address.replace(/ /g, '+');

        // The request is bounded around Toronto.
        var urlCoords = ('https://maps.googleapis.com/maps/api/geocode/json?' +
            'address=' + formattedAddress + '&bounds=43.573936,-79.560076|' +
            '43.758672,-79.275135&key=AIzaSyA4SAawmy-oEMzdWboD0iHk9gDmmjb61o4');

        $.getJSON(urlCoords, function(data) {
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            // Set position of appropriate Marker.
            marker.setPosition(new google.maps.LatLng(lat, lng));
            // Update model stored in mapManager so that it can be later stored.
            // self.markerData[index].position = {
            //     lat: lat,
            //     lng: lng
            // };
        }).error(function(e) { // Can't show the marker without coordinates.
            console.log('We experienced a failure when making the coordinate request for ' +
                address + ' for the place called ' + self.markerData[index].title);
            marker.setMap(null);
        });
    },
    infoWindowMaker: function(infoWindow, title, website, blurb) {
        'use strict';
        var content = '<div class="info-window"><h4><a href="' + website + '">' +
            title +
            '</a></h4>' +
            '<p>' + blurb + '</p></div>';
        infoWindow.setContent(content);
    },
    store: function() {
        'use strict';
        console.log('storing data');
        localStorage.markerData = JSON.stringify(this.markerData);
    },
    load: function() {
        'use strict';
        console.log('loading data');
        if (true) {
            this.markerData = [{
                twitter: 'yyzbuddies',
                title: 'Buddies in Bad Times Theatre',
                website: 'http://buddiesinbadtimes.com/events/',
                blurb: 'Buddies in Bad Times Theatre creates vital Canadian ' +
                    'theatre by developing and presenting voices that question ' +
                    'sexual and cultural norms. Built on the political and social ' +
                    'principles of queer liberation, Buddies supports artists and ' +
                    'works that reflect and advance these values. As the world’s ' +
                    'longest-running and largest queer theatre, Buddies is uniquely ' +
                    'positioned to develop, promote, and preserve stories and ' +
                    'perspectives that are challenging and alternative.',
                address: '12 Alexander St, Toronto, ON M4Y 1B4',
                position: {
                    lat: 43.663346,
                    lng: -79.383107
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Queer culture', 'Alternative', 'Community focused', 'Theatre venue'],
                founded: 1978
            }, {
                twitter: 'tarragontheatre',
                title: 'Tarragon Theatre',
                website: 'http://tarragontheatre.com/now-playing/',
                blurb: 'Tarragon Theatre’s mission is to create, develop and ' +
                    'produce new plays and to provide the conditions for new work ' +
                    'to thrive. To that end, the theatre engages the best theatre ' +
                    'artists and craftspeople to interpret new work; presents each ' +
                    'new work with high quality production values; provides an ' +
                    'administrative structure to support new work; develops marketing ' +
                    'strategies to promote new work; and continually generates an ' +
                    'audience for new work.',
                address: '30 Bridgman Ave, Toronto, ON M5R 1X3',
                position: {
                    lat: 43.674842,
                    lng: -79.412820
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Theatre venue'],
                founded: 1970
            }, {
                twitter: 'beyondwallsTPM',
                title: 'Theatre Passe Muraille',
                website: 'http://passemuraille.ca/current-season',
                blurb: 'Theatre Passe Muraille (TPM) believes there should be a ' +
                    'more diverse representation of artists, audience members, and ' +
                    'stories in our theatre in Canada. TPM aspires to be a leader ' +
                    'locally, nationally and internationally in establishing, ' +
                    'promoting, and embracing collaborative and inclusive theatre ' +
                    'practices that support and ignite the voices of unique artists, ' +
                    'communities and audiences.',
                address: '16 Ryerson Ave, Toronto, ON M5T 2P3',
                position: {
                    lat: 43.648553,
                    lng: -79.402584
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Diversity', 'Theatre venue'],
                founded: 1968
            }, {
                twitter: 'FactoryToronto',
                title: 'Factory Theatre',
                website: 'https://www.factorytheatre.ca/what-s-on/',
                blurb: 'From its founding in 1970 with a commitment to Canadian ' +
                    'stories; to the Heritage building that now houses the 45-year ' +
                    'old company; Factory\'s vision has always conveyed indomitable ' +
                    'courage and resolve; toughness; tenaciousness; and strength of ' +
                    'character. Factory has grit.',
                address: '125 Bathurst St, Toronto, ON M5V 2R2',
                position: {
                    lat: 43.645531,
                    lng: -79.402690
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Theatre venue'],
                founded: 1970
            }, {
                twitter: 'StorefrontTO',
                title: 'Storefront Theatre',
                website: 'http://thestorefronttheatre.com/current-season/',
                blurb: 'The Storefront Arts Initiative represents the Storefront ' +
                    'Theatre’s management team and its commitment to the artistic ' +
                    'independent scene in Toronto through affordable venues, ' +
                    'groundbreaking productions, collaborative discourse and ' +
                    'community-centric support.',
                address: '955 Bloor Street West, Toronto, ON M6H 1L7',
                position: {
                    lat: 43.661288,
                    lng: -79.428240
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Theatre venue'],
                founded: 2013
            }, {
                twitter: 'NativeEarth',
                title: 'Native Earth Performing Arts',
                website: 'http://www.nativeearth.ca/aki-studio-theatre/',
                blurb: 'Through stage productions (theatre, dance and ' +
                    'multi-disciplinary art), new script development, ' +
                    'apprenticeships and internships, Native Earth seeks to ' +
                    'fulfill a community of artistic visions. It is a vision ' +
                    'that is inclusive and reflective of the artistic directions ' +
                    'of members of the Indigenous community who actively ' +
                    'participate in the arts.',
                address: '585 Dundas St E #250, Toronto, ON M5A 2B7',
                position: {
                    lat: 43.659961,
                    lng: -79.362607
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Aboriginal', 'Community focused', 'Theatre venue'],
                founded: 1982
            }, {
                twitter: 'canadianstage',
                title: 'Berkeley Street Theatre',
                website: 'https://nowtoronto.com/locations/berkeley-street-theatre/',
                blurb: 'Berkeley Street Theatre is associated with the Canadian ' +
                    'Stage Company. <br>A home for innovative live performance from ' +
                    'Canada and around the world,<br>Where audiences encounter ' +
                    'daring productions, guided by a strong directorial vision ' +
                    '<br>Where theatre, dance, music and visual arts cohabit, clash, interrogate ' +
                    '<br>Where a bold, 21st-century aesthetic reigns',
                address: '26 Berkeley St, Toronto',
                position: {
                    lat: 43.650621,
                    lng: -79.363817
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Theatre venue'],
                founded: 1987
            }, {
                twitter: 'canadianstage',
                title: 'Bluma Appel Theatre',
                content: 'Bluma Appel Theatre',
                website: 'https://www.canadianstage.com/Online/default.asp',
                blurb: 'Bluma Appel Theatre is associated with the Canadian ' +
                    'Stage Company. <br>A home for innovative live performance from ' +
                    'Canada and around the world,<br>Where audiences encounter ' +
                    'daring productions, guided by a strong directorial vision ' +
                    '<br>Where theatre, dance, music and visual arts cohabit, clash, interrogate ' +
                    '<br>Where a bold, 21st-century aesthetic reigns',
                address: '27 Front St E, Toronto',
                position: {
                    lat: 43.647414,
                    lng: -79.375129
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['International', 'Theatre venue'],
                founded: 1987
            }, {
                twitter: 'Soulpepper',
                title: 'Soulpepper Theatre Company',
                website: 'https://www.soulpepper.ca/performances.aspx',
                blurb: 'Central to Soulpepper’s identity is its commitment to ' +
                    'being a Civic Theatre - a place of belonging for artists and ' +
                    'audiences of all ages and backgrounds. We are the largest ' +
                    'employer of theatre artists in Toronto, and our artists live ' +
                    'and play in this community. Our partners are our neighbours ' +
                    'and the stories we tell are infused with our shared ' +
                    'experiences. Soulpepper plays an intrinsic role in the ' +
                    'cultural life of this city.',
                address: '50 Tank House Lane, Toronto',
                position: {
                    lat: 43.650860,
                    lng: -79.357452
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Community focused', 'Theatre venue'],
                founded: 1998
            }, {
                twitter: 'fuGENTheatre',
                title: 'fu-GEN Theatre',
                website: 'http://fu-gen.org/current-season/',
                blurb: 'fu-GEN is a charitable theatre company dedicated to ' +
                    'the development of professional Asian Canadian theatre ' +
                    'artists through the production of new and established works.',
                address: '157 Carlton St #207, Toronto',
                position: {
                    lat: 43.663233,
                    lng: -79.372377
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Asian-Canadian', 'Company office'],
                founded: 2002
            }, {
                twitter: 'CahootsTheatre',
                title: 'Cahoots Theatre Company',
                website: 'http://www.cahoots.ca/',
                blurb: 'Cahoots Theatre investigates and examines the' +
                    'complexities of diversity through the creation and ' +
                    'production of new theatre works, development of ' +
                    'professional artists and the engagement of communities.',
                address: '388 Queen Street East, Unit 3, Toronto, Ontario M5A 1T3',
                position: {
                    lat: 43.656172,
                    lng: -79.363262
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Diversity', 'Community focused', 'Company office'],
                founded: 1986
            }, {
                twitter: 'bcurrentLIVE',
                title: 'b current',
                website: 'http://bcurrent.ca/events/',
                blurb: 'b current is the hotbed for culturally-rooted theatre ' +
                    'development in Toronto.<br>Originally founded as a place for ' +
                    'black artists to create, nurture, and present their new ' +
                    'works, our company has grown to support artists from all ' +
                    'diasporas. We strived over two decades to create space for ' +
                    'diverse voices to be heard, always with a focus on engaging ' +
                    'the communities from which our stories emerge.',
                address: '601 Christie St #251, Toronto, ON M6G 4C7',
                position: {
                    lat: 43.680006,
                    lng: -79.423700
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Diversity', 'Company office'],
                founded: 1991
            }, {
                twitter: 'Videofag',
                title: 'videofag',
                website: 'http://www.videofag.com/#!events/ckiy',
                blurb: 'videofag is a storefront cinema and performance lab ' +
                    'in toronto\'s kensington market dedicated to the creation ' +
                    'and exhibition of video, film, new media, and live art.',
                address: '187 Augusta Avenue, Toronto, Ontario, M5T 2L4',
                position: {
                    lat: 43.653486,
                    lng: -79.401357
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Alternative', 'Theatre venue'],
                founded: 2012
            }, {
                twitter: 'YPTToronto',
                title: 'Young People\'s Theatre',
                website: 'http://www.youngpeoplestheatre.ca/shows-tickets/',
                blurb: 'From the very beginning, Young Peoples Theatre ' +
                    'established its dedication to professional productions of ' +
                    'the highest quality – classic or contemporary – from Canada ' +
                    'and around the world, written just for children and the ' +
                    'people who care about them.',
                address: '165 Front St E, Toronto, ON M5A 3Z4, Canada',
                position: {
                    lat: 43.650022,
                    lng: -79.368883
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Theatre for children', 'Theatre venue'],
                founded: 1966
            }, {
                twitter: 'TheatreDirectCa',
                title: 'Theatre Direct',
                website: 'http://theatredirect.ca/productions/',
                blurb: 'Our work is driven by a belief that young people ' +
                    'deserve truth not diversion – that they have a right to ' +
                    'meaningful cultural content and experiences. We view our ' +
                    'audience as thinking, feeling, complex individuals – not a ' +
                    'market and not future audiences, but our present audience ' +
                    'of emerging citizens that demands relevant theatre that ' +
                    'engages all their faculties, feelings and intellect.',
                address: '601 Christie St, Toronto, ON M6G 4C7',
                position: {
                    lat: 43.679979,
                    lng: -79.424069
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Theatre for children', 'Company office'],
                founded: 1976
            }, {
                twitter: 'AlunaTheatre',
                title: 'Aluna Theatre',
                website: 'http://www.alunatheatre.ca/current-productions/',
                blurb: 'The artistic mission of Aluna Theatre is to embrace ' +
                    'the myriad of voices, cultures, and stories of our population, ' +
                    'which are transforming the landscape of Canadian theatre. In ' +
                    'our plays, works in translation, and international ' +
                    'co-creations, people are complex individuals who exist ' +
                    'beyond the restrictions of cultural labels.',
                address: '1 Wiltshire Ave #124, Toronto, ON M6N 2V7',
                position: {
                    lat: 43.667751,
                    lng: -79.449632
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Diversity', 'Women', 'Latin-Canadian', 'Company office'],
                founded: 2001
            }, {
                twitter: 'TGargantua',
                title: 'Theatre Gargantua',
                website: 'http://theatregargantua.ca/productions/',
                blurb: 'Each of Gargantua’s productions, while being ' +
                    'diverse in terms of subject, writing and performance ' +
                    'styles, melds daring physicality with striking designs, ' +
                    'underpinned by original live music and the innovative use ' +
                    'of technology.',
                address: '651 Dufferin St, Toronto, ON M6K 2B2',
                position: {
                    lat: 43.650239,
                    lng: -79.431099
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Technology', 'Company office'],
                founded: 1992
            }, {
                twitter: 'crowstheatre',
                title: 'Crow\'s Theatre',
                website: 'http://www.crowstheatre.com/production/in-development/',
                blurb: 'Crow’s has a mission to ignite passionate and ' +
                    'enduring engagement between our audiences and artists by ' +
                    'creating, producing and promoting unforgettable theatre ' +
                    'that examines and illuminates the pivotal narratives of ' +
                    'our times.',
                address: '696 Queen St E #2C, Toronto, ON M4M 1G9',
                position: {
                    lat: 43.659415,
                    lng: -79.350262
                },
                icon: 'dist/images/museum.png', 
                type: 'Theatre venue',
                flags: ['Theatre venue'],
                founded: 1983
            }, {
                twitter: 'nightwoodtheat',
                title: 'Nightwood Theatre',
                website: 'http://www.nightwoodtheatre.net/index.php/whats_on',
                blurb: 'Nightwood Theatre forges creative alliances among ' +
                    'women artists from diverse backgrounds in order to develop ' +
                    'and produce innovative Canadian Theatre. We produce ' +
                    'original Canadian plays and works from the contemporary ' +
                    'international repertoire.',
                address: '15 Case Goods Lane #306, Toronto, ON M5A 3C4',
                position: {
                    lat: 43.649895,
                    lng: -79.358575
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Women', 'Diversity', 'Company office'],
                founded: 1979
            }, {
                twitter: 'obsidiantheatre',
                title: 'Obsidian Theatre Company',
                website: 'http://www.obsidiantheatre.com/',
                blurb: 'Obsidian is Canada’s leading culturally diverse ' +
                    'theatre company. Our threefold mission is to produce plays, ' +
                    'to develop playwrights and to train emerging theatre ' +
                    'professionals. Obsidian is passionately dedicated to the ' +
                    'exploration, development, and production of the Black voice.',
                address: '1089 Dundas St E, Toronto, ON M4M 1R9',
                position: {
                    lat: 43.663814,
                    lng: -79.343623
                },
                icon: 'dist/images/city.png',
                type: 'Company office',
                flags: ['Black', 'Company office'],
                founded: 2000
            },{
                twitter: 'bradsucks',
                title: 'Brad Sucks',
                website: 'http://www.bradsucks.net/',
                address: '500 Bathurst Street',
                flags: ['Company office'],
                founded: 2001
            }];
        } else {
            //this.markerData = JSON.parse(localStorage.markerData);
        }

    }
};

mapManager.load();

var mapManager = mapManager || {};

mapManager.util = mapManager.util || {};

// Set InfoWindows to this before giving them relavant content.
mapManager.util.blankInfoWin = {
    content: '',
    maxWidth: 200
};

// What new markers are set to before being given the correct coordinates.
mapManager.util.nullPosition = {
    lat: 0,
    lng: 0
};

mapManager.util.hideItem = function(marker) {
    'use strict';
    marker.infoWin.close();
    marker.setMap(null);
    marker.listed(false);
};

mapManager.util.showItem = function(marker) {
    'use strict';
    marker.setMap(mapManager.map);
    marker.listed(true);
};

mapManager.util.alphabeticalSort = function(a, b) {
    'use strict';
    if (a.title === b.title) {
        return 0;
    } else {
        return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
    }
};

mapManager.util.alphabeticalSortReverse = function(a, b) {
    'use strict';
    if (a.title === b.title) {
        return 0;
    } else {
        return a.title.toLowerCase() < b.title.toLowerCase() ? 1 : -1;
    }
};

mapManager.util.foundingSort = function(a, b) {
    'use strict';
    if (a.founded === b.founded) {
        return 0;
    } else {
        return a.founded > b.founded ? 1 : -1;
    }
};

mapManager.util.foundingSortReverse = function(a, b) {
    'use strict';
    if (a.founded === b.founded) {
        return 0;
    } else {
        return a.founded < b.founded ? 1 : -1;
    }
};

mapManager.util.inArray = function(array, sought) {
    'use strict';
    var length = array.length;
    var i;
    for (i = 0; i < length; i++) {
        if (array[i] === sought) {
            return true;
        }
    }
    return false;
};

mapManager.util.itemFailsFilter = function(marker, filter) {
    'use strict';
    if (mapManager.util.inArray(marker.flags, filter) === false) {
        mapManager.util.hideItem(marker);
        return true;
    }
    return false;
};
