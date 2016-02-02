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
    var infoWindowBinder = function(index) {
        self.markers()[index].addListener('click', function() {
            self.openInfoWindow(index);
            self.activeTwitter(self.markers()[index].twitterHandle);
        });
    };

    /**
     * Close all InfoWindows and open the one that is at position index in 
     * self.infoWindows. 
     * @param  {int} index  Corresponds to index of self.infoWindows and 
     *                      self.markers
     */
    self.openInfoWindow = function(index) {
        self.markers().forEach(function(marker, number) {
            marker.infoWin.close();
        });
        self.markers()[index].infoWin.open(mapManager.map, self.markers()[index]);
    };

    self.closeInfoWindows = function() {
        self.markers().forEach(function(marker, number) {
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

    self.remoteAccess = function(theatre) {
        var index = theatre.index;
        self.openInfoWindow(index);
        self.activeTwitter(self.markers()[index].twitterHandle);
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
                index: index
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
            infoWindowBinder(index);

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
                position: google.maps.ControlPosition.BOTTOM_CENTER
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
    mapPositionAJAX: function(address, array, index) {
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
            array[index].setPosition(new google.maps.LatLng(lat, lng));
            // Update model stored in mapManager so that it can be later stored.
            self.markerData[index].position = {
                lat: lat,
                lng: lng
            };
        }).error(function(e) { // Can't show the marker without coordinates.
            console.log('We experienced a failure when making the coordinate request for ' +
                address + ' for the place called ' + self.markerData[index].title);
            array[index].setMap(null);
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
                type: 'venue',
                flags: ['queer', 'alternative', 'community'],
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
                type: 'venue',
                flags: ['new work', 'Canadian'],
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
                type: 'venue',
                flags: ['diverse', 'eclectic', 'community', 'Canadian'],
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
                type: 'venue',
                flags: ['Canadian', 'grit', 'authenticity'],
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
                type: 'venue',
                flags: ['community'],
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
                type: 'venue',
                flags: ['Aboriginal', 'community'],
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
                type: 'venue',
                flags: ['Canadian'],
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
                type: 'venue',
                flags: ['Canadian', 'international', 'large venue'],
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
                type: 'venue',
                flags: ['community', 'development'],
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
                type: 'office',
                flags: ['asian', 'education', 'Asian Canadian'],
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
                type: 'office',
                flags: ['diverse', 'community'],
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
                type: 'office',
                flags: ['diverse', 'authenticity', 'culture'],
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
                type: 'venue',
                flags: ['multimedia', 'hub', 'alternative'],
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
                type: 'venue',
                flags: ['youth'],
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
                type: 'office',
                flags: ['youth'],
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
                type: 'office',
                flags: ['innovation', 'diverse', 'women', 'Latin Canadian'],
                founded: 2001,
                partners: ['The Theatre Centre']
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
                type: 'office',
                flags: ['innovation', 'technology', 'development',
                    'original music'
                ],
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
                type: 'venue',
                flags: ['cultural narratives', 'development'],
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
                type: 'office',
                flags: ['women', 'diverse', 'innovation', 'equality'],
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
                type: 'office',
                flags: ['black', 'diverse', 'Canadian'],
                founded: 2000
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
