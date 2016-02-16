var google = google || {};
// instantiated TheatreMapViewModel from app.js
var TheatreMapViewModel = TheatreMapViewModel || {};
var ko = ko || {};

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
        
        /**
         * Here we initialize the services that will allow us to display 
         * directions to and from the theatres from various ttc locations.
         * NOTE: This is probably better to do in addMarkers inside markers.js
         * as that wouldn't slow down the initial rendering of the map.
         */
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer();

        // Keep a tab on the screen width in order to determine certain 
        // responsive features.
        this.util.windowWidth = window.innerWidth;

        // Use this to guess at whether we're on a phone or not. NOT GOOD.
        this.util.screenWidth = screen.width;

        // Create a Map object and specify the DOM element for display.
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: startingMapPosition,
            scrollwheel: true,
            zoom: 12,
            disableDefaultUI: true
        });

        // Assign the directions display to our map so that we can see 
        // directions.
        this.directionsDisplay.setMap(this.map);

        /**
         * Add the markers stored in mapManager.markerData through an 
         * instantiated TheatreMapViewModel object. mapManager.markerData is 
         * populated when mapManager.load() is run at the bottom of this file.
         */
        TheatreMapViewModel.addMarkers();
    },

    /**
     * Adds a marker to an array using the data in a markerItem object.
     * @param  {object} markerItem holds the data needed to create a marker
     * @param  {array}  array      is an observableArray of markers in the
     *                             TheatreMapViewModel
     */
    pushMarker: function(markerItem, array) {
        'use strict';
        array.push(new google.maps.Marker({
            position: this.util.nullPosition, // 0,0 placeholder
            map: this.map, // the Google map
            title: markerItem.title, // important for many methods
            twitterHandle: markerItem.twitter, // used to access twitter feed
            icon: markerItem.icon, // graphic on the map
            // The 'listed' observable manages whether the marker's 
            // corresponding button on the list is visible or not
            listed: ko.observable(true),
            founded: markerItem.founded, // Company's founding year
            flags: markerItem.flags, // Categories for filters
            //infoWin: {}, // placeholder
            //infoWindowOpen: false
            blurb: '',
            address: markerItem.address
        }));
    },

    /**
     * If the position coordinates exist, use those. Otherwise, use the address 
     * and make a Google Maps Geocoding call to find the corresponding 
     * coordinates. Failing those two things, we can't display the Marker.
     */
    adjustPosition: function(marker, markerItem) {
        'use strict';
        var position = markerItem.position;
        var address = markerItem.address;
        if (position) {
            marker.setPosition(position);
        } else if (address) {
            this.mapPositionAJAX(marker, address);
        } else {
            // Take the marker off the map.
            marker.setMap(null);
        }

    },

    /**
     * Fill an InfoWindow associated with marker using available data.
     * @param {object} marker  The marker corresponding to the InfoWindow.
     * @param {string} title   The title to display.
     * @param {string} website The website that the title should link to.
     * @param {string} blurb   The description corresponding to the marker.
     */
    setDescription: function(marker, title, website, blurb) {
        'use strict';
        if (title && website && blurb) { // we have all the data already
            // Fill the InfoWindow with all the important data.
            // this.infoWindowMaker(marker.infoWin, title, website, blurb);
            marker.website = website;
            marker.blurb = blurb;
        } else if (title) { // we have the title, so we can look up missing data
            // Make a call to the Wikipedia API to retrieve a website and/or blurb.
            this.markerDataAjax(marker, website, blurb);
        } else { // If there is no title, we can't do a wikipedia AJAX call.
            // FIll the InfoWindow as best as we can.
            // this.infoWindowMaker(marker.infoWin, title, website, blurb);
            marker.website = website;
            marker.blurb = blurb;
        }
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
    markerDataAjax: function(marker, fallbackWebsite, fallbackBlurp) {
        'use strict';

        console.log('running wiki AJAX');

        var self = this;

        var formattedName = marker.title.replace(/ /g, '_');

        // Only try find 1 article (specified by the &limit=1 part)
        var urlWiki = ('https://en.wikipedia.org/w/api.php?action=opensearch&' +
            'format=json&search=' + formattedName + '&limit=1&redirects=resolve');

        /**
         * wikipediaRequestTimeout will be cancelled if the AJAX request below 
         * is successful.
         */
        var wikipediaRequestTimeout = setTimeout(function() {
            // Fall back on whatever content is provided by markerData.
            // marker.infoWin.setContent(fallbackBlurp);
            marker.website = fallbackWebsite;
            marker.blurb = fallbackBlurp;
            return;
        }, 5000);

        $.ajax({
            url: urlWiki,
            dataType: 'jsonp',
            success: function(data) {
                // Cancel the timeout since AJAX request is successful.
                clearTimeout(wikipediaRequestTimeout);
                var wikiFound = data[1].length; // Max of 1.
                // var infoWindow = marker.infoWin;
                var title, website, blurb;
                // We either found 1 article or we found 0, hence the boolean.
                if (wikiFound) {
                    if (!fallbackWebsite) {
                        website = data[3][0];
                    } else {
                        website = fallbackWebsite;
                    }
                    if (!fallbackBlurp) {
                        blurb = data[2][0];
                    } else {
                        blurb = fallbackBlurp;
                    }
                } else {
                    // Fall back on whatever content is provided by markerData.
                    website = fallbackWebsite;
                    blurb = fallbackBlurp;
                }
                // self.infoWindowMaker(infoWindow, marker.title, website, blurb);
                marker.website = website;
                marker.blurb = blurb;
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
    mapPositionAJAX: function(marker, address) {
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
                address + ' for the place called ' + marker.title);
            marker.setMap(null);
        });
    },

    /**
     * Fill the content of infoWindow.
     * @param  {object} infoWindow The InfoWindow we want to fill.
     * @param  {string} title      The title of the associated marker.
     * @param  {string} website    The website the title should link to.
     * @param  {string} blurb      The description to include.
     * THIS IS NOT CURRENTLY BEING USED AT ALL
     */
    // infoWindowMaker: function(infoWindow, title, website, blurb) {
    //     'use strict';
    //     var content = '<div class="info-window"><h4><a href="' + website + '">' +
    //         title +
    //         '</a></h4>' +
    //         '<p>' + blurb + '</p></div>';
    //     infoWindow.setContent(content); // Apply the formatted content.
    // },

    // store: function() {
    //     'use strict';
    //     console.log('storing data');
    //     localStorage.markerData = JSON.stringify(this.markerData);
    // },
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
                flags: ['Aboriginal', 'Community focused', 'Theatre venue'],
                founded: 1982
            }, {
                twitter: 'canadianstage',
                title: 'Berkeley Street Theatre',
                website: 'https://nowtoronto.com/locations/berkeley-street-theatre/',
                blurb: 'Berkeley Street Theatre is associated with the Canadian ' +
                    'Stage Company.  A home for innovative live performance from ' +
                    'Canada and around the world, Where audiences encounter ' +
                    'daring productions, guided by a strong directorial vision ' +
                    'Where theatre, dance, music and visual arts cohabit, clash, interrogate ' +
                    'Where a bold, 21st-century aesthetic reigns',
                address: '26 Berkeley St, Toronto',
                position: {
                    lat: 43.650621,
                    lng: -79.363817
                },
                icon: 'dist/images/museum.png',
                flags: ['Theatre venue'],
                founded: 1987
            }, {
                twitter: 'canadianstage',
                title: 'Bluma Appel Theatre',
                content: 'Bluma Appel Theatre',
                website: 'https://www.canadianstage.com/Online/default.asp',
                blurb: 'Bluma Appel Theatre is associated with the Canadian ' +
                    'Stage Company. A home for innovative live performance from ' +
                    'Canada and around the world, Where audiences encounter ' +
                    'daring productions, guided by a strong directorial vision ' +
                    'Where theatre, dance, music and visual arts cohabit, clash, interrogate ' +
                    'Where a bold, 21st-century aesthetic reigns',
                address: '27 Front St E, Toronto',
                position: {
                    lat: 43.647414,
                    lng: -79.375129
                },
                icon: 'dist/images/museum.png',
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
                flags: ['Diversity', 'Community focused', 'Company office'],
                founded: 1986
            }, {
                twitter: 'bcurrentLIVE',
                title: 'b current',
                website: 'http://bcurrent.ca/events/',
                blurb: 'b current is the hotbed for culturally-rooted theatre ' +
                    'development in Toronto. Originally founded as a place for ' +
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
                flags: ['Black', 'Diversity', 'Company office'],
                founded: 2000
            }];
        } else {
            //this.markerData = JSON.parse(localStorage.markerData);
        }

    }
};

mapManager.load();

/**
 * This file is used to hold helper functions and objects in an encapsulated 
 * way.
 */

var mapManager = mapManager || {};

mapManager.util = (function() {
    'use strict';
    var utilities = {
        // Set InfoWindows to this before giving them relevant content.
        blankInfoWin: {
            content: '',
            maxWidth: 200,
        },

        // What new markers are set to before being given the correct coordinates.
        nullPosition: {
            lat: 0,
            lng: 0
        },

        /**
         * Hide the marker on the map and hide the corresponding button on the list.
         * @param  {object} marker
         */
        hideItem: function(marker) {
            marker.setMap(null); // Detach the marker from the map.
            // Change the observable the view depends on when deciding whether to show
            // the button corresponding to the marker.
            marker.listed(false);
        },

        /**
         * Show the marker on the map and show the corresponding button on the list.
         * @param  {object} marker
         */
        showItem: function(marker) {
            marker.setMap(mapManager.map);
            marker.listed(true);
        },

        /**
         * Sort two markers in alphabetical order based on their titles. Ignore case.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        alphabeticalSort: function(a, b) {
            if (a.title === b.title) {
                return 0;
            } else {
                return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
            }
        },

        /**
         * Sort two markers in reverse alphabetical order based on their titles. Ignore
         * case.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        alphabeticalSortReverse: function(a, b) {
            if (a.title === b.title) {
                return 0;
            } else {
                return a.title.toLowerCase() < b.title.toLowerCase() ? 1 : -1;
            }
        },

        /**
         * Sort two markers in ascending order based on the year the corresponding item
         * was founded.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        foundingSort: function(a, b) {
            if (a.founded === b.founded) {
                return 0;
            } else {
                return a.founded > b.founded ? 1 : -1;
            }
        },

        /**
         * Sort two markers in descending order based on the year the corresponding item
         * was founded.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        foundingSortReverse: function(a, b) {
            if (a.founded === b.founded) {
                return 0;
            } else {
                return a.founded < b.founded ? 1 : -1;
            }
        },

        /**
         * Determine if sought is present in the unsorted array.
         * @param  {array}      array  
         * @param  {primative}  sought can be any primitive to be searched for in the 
         *                             array.
         */
        inArray: function(array, sought) {
            var length = array.length;
            var i;
            for (i = 0; i < length; i++) {
                if (array[i] === sought) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Check to see if the marker has filter in its flags attribute array.
         * @param  {object} marker is the item we want to check
         * @param  {string} filter is the string we need to find in the marker.flags 
         *                         array.
         */
        itemFailsFilter: function(marker, filter) {
            if (mapManager.util.inArray(marker.flags, filter)) { // Marker passes filter
                return false;
            } else { // Marker fails filter
                mapManager.util.hideItem(marker); // Hide marker and corresponding button.
                // Call will be able to stop checking other filters for this marker, 
                // since it has already failed this one such work is unnecessary.
                return true;
            }
        },

        /**
         * Resize the twitter tab appropriately according to the screen height. This 
         * gets run as soon as the app is loaded.
         */
        repositionTabs: function() {
            var $twitterTabs = $('.twitter-tab-image');
            var $listTabs = $('.list-tab-image');
            var $filterTabs = $('.filter-tab-image');
            var screenHeight = screen.height;
            console.log('The screen height is ' + screenHeight); // DEBUG
            if (screenHeight >= 600) {
                $listTabs.css({
                    'top': screenHeight * 0.1
                });
                $twitterTabs.css({
                    'top': screenHeight * 0.3
                });
                $filterTabs.css({
                    'top': screenHeight * 0.5
                });
            } else {
                $listTabs.css({
                    'top': 0
                });
                $twitterTabs.css({
                    'top': screenHeight * 0.4
                });
                $filterTabs.css({
                    'top': screenHeight * 0.7
                });
            }

        }



    };
    return utilities;
}());



// Position twitter tab as soon as page loads.
mapManager.util.repositionTabs();

var ko = ko || {};

/**
 * The module loads attributes used by other modules.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko) {
    'use strict';

    /**
     * Div for holding the error messages that are seen when twitter fails to 
     * load quickly enough.
     */
    self.$twitterErrorDiv = $('#twitter-error');
    self.errorTimeoutRequest = null; // Allows us to clear old requests

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


    // To determine whether to load the twitter list or a particular account.
    self.twitterListView = ko.observable(true);

    /**
     * These variables hold the currently selected marker's information for 
     * various uses.
     */
    self.currentTitle = ko.observable('');
    self.currentWebsite = ko.observable('');
    self.currentBlurb = ko.observable('');
    self.currentAddress = ko.observable('');
    self.currentDirections = ko.observableArray([]);
    self.currentCopyrights = ko.observable('');

    /**
     * These observables are used in the computed newTwitterUser to determine
     * if the Twitter account requested is different from the one that is loaded.
     */
    self.activeTwitter = ko.observable(''); // current Twitter user selected
    self.lastTwitterUser = ko.observable(''); // current Twitter user loaded

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


    self.$twitterListDiv = $('#twitter-list');
    self.$twitterAccountDiv = $('#twitter-account');

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
     * These filters are connected to checkboxes on the view. If one of them is 
     * on, only the markers that pass that filter will be displayed. If filter
     * is added here, be sure to add it to self.filters directly below the 
     * following block of observables.
     */
    self.filterDiverse = ko.observable(false);
    self.filterWomen = ko.observable(false);
    self.filterBlack = ko.observable(false);
    self.filterAboriginal = ko.observable(false);
    self.filterQueer = ko.observable(false);
    self.filterAsian = ko.observable(false);
    self.filterLatin = ko.observable(false);
    self.filterAlternative = ko.observable(false);
    self.filterCommunity = ko.observable(false);
    self.filterInternational = ko.observable(false);
    self.filterChildren = ko.observable(false);
    self.filterTechnology = ko.observable(false);
    self.filterOffice = ko.observable(false);
    self.filterVenue = ko.observable(false);


    // These are used to sort first forwards and then backwards.
    self.sortedAlpha = false;
    self.sortedFounded = false;
    self.currentSort = ko.observable('');

    /**
     * This is the div that comes in from the left and displays information 
     * about a marker.
     */
    self.$divInfo = $('#display-div');


    /**
     * This will be the only google.maps.InfoWindow that is displayed.
     */
    self.infoWindow = {};


    /**
     * The credit div at the bottom of the app.
     */
    self.$creditDiv = $('#credit-div');
    self.creditOn = ko.observable(false);

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko));

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
        // This has to come after the last 4, as currentInfo is a computed based
        // on currentTitle and currentAddress.
        self.infoWindow.setContent(self.currentInfo());
        // Move to a position where the Info Window can be displayed and open it.
        mapManager.map.panTo(marker.getPosition());
        self.openInfoWindow(marker);

        // Show the directions from Union Station to this location
        self.calcRoute(marker.position);

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
        var content = '<div><span class="info-title">' +
            self.currentTitle() +
            '</span><br>' +
            self.currentAddress() +
            '</div>';
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

var ko = ko || {};
var twttr = twttr || {};

/**
 * The module required to handle Twitter actions.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} twttr       Twitter object for creating timelines
 * @param  {object} google      Google Maps API
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, twttr) {
    'use strict';

    /**
     * We hide the error div momentarily so that it doesn't normally get seen
     * by users. It will only appear if a twitter feed did not load after a 
     * full second and a half following a request.
     */
    self.blinkTwitterError = function() {
        // If we don't clear the request then an older timeout request can 
        // interrupt the process and display the error when it shouldn't be 
        // displayed.
        if (self.errorTimeoutRequest) {
            clearTimeout(self.errorTimeoutRequest);
        }
        self.$twitterErrorDiv.hide();
        self.errorTimeoutRequest = setTimeout(function() {
            self.$twitterErrorDiv.show();
        }, 1500);
    };

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

    /**
     * Switch between list view and user view.
     * @return {[type]} [description]
     */
    self.switchTwitter = function() {
        self.blinkTwitterError();
        self.twitterListView(!self.twitterListView());
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
            console.log('Inner height is ' + window.innerHeight);
            // Use twttr library to create new user timeline
            if (self.twitterLong()) { // Load a long, limitless feed.
                self.currentTwitterUserLong = true;
                twttr.widgets.createTimeline(
                    '694221648225001472', // widget ID made on my Twitter account
                    document.getElementById('twitter-account'), { // target div
                        screenName: self.activeTwitter(), // observable 
                        height: window.innerHeight - 105
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
            console.log('Inner height is ' + window.innerHeight);
            // Use twttr library to create new list timeline
            if (self.twitterLong()) {
                self.currentTwitterListLong = true;
                twttr.widgets.createTimeline(
                    '694233158955323392', // widget ID made on my Twitter account
                    document.getElementById('twitter-list'), { // target div
                        listOwnerScreenName: 'BreathMachine', // List-holding account
                        listSlug: 'toronto-theatre', // Name of twitter list
                        height: window.innerHeight - 70
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
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, twttr));

var ko = ko || {};
var mapManager = mapManager || {};

/**
 * The module provides methods for filtering markers.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} mapManager  Object with map related function and variables.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager) {
    'use strict';

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
        filter: self.filterBlack,
        flag: 'Black'
    }, {
        filter: self.filterAboriginal,
        flag: 'Aboriginal'
    }, {
        filter: self.filterQueer,
        flag: 'Queer culture'
    }, {
        filter: self.filterAsian,
        flag: 'Asian-Canadian'
    }, {
        filter: self.filterLatin,
        flag: 'Latin-Canadian'
    }, {
        filter: self.filterAlternative,
        flag: 'Alternative'
    }, {
        filter: self.filterCommunity,
        flag: 'Community focused'
    }, {
        filter: self.filterInternational,
        flag: 'International'
    }, {
        filter: self.filterChildren,
        flag: 'Theatre for children'
    }, {
        filter: self.filterTechnology,
        flag: 'Technology'
    }, {
        filter: self.filterOffice,
        flag: 'Company office'
    }, {
        filter: self.filterVenue,
        flag: 'Theatre venue'
    }];

    self.toggleFilter = function(clicked) {
        clicked.filter(!clicked.filter());
        console.log(clicked);
    };

    /**
     * Here we determine whether the filter tab should be grow.
     */
    self.filterClicked = ko.computed(function() {
        var length = self.filters.length;
        var i;
        for (i = 0; i < length; i++) {
            if (self.filters[i].filter()) {
                self.glowingFilter = true; // If filters are set, glow.
                return; // At least one filter is on, can exit.
            }
        }
        self.glowingFilter = false; // If no filters are set, don't glow.
        self.stopGlow(); // Reset glow defaults.
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
    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager));

var ko = ko || {};

/**
 * The module loads methods for making the rightside tabs glow.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko) {
    'use strict';
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
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko));

var ko = ko || {};
var mapManager = mapManager || {};

/**
 * The module loads methods for sorting the markers.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} mapManager  Object with map related function and variables.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager) {
    'use strict';
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
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager));

var mapManager = mapManager || {};

/**
 * The module provides methods for opening and closing the offscreen divs.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} mapManager  Object with map related methods and variables.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, mapManager) {
    'use strict';

    /**
     * Close the info div.
     */
    self.closeLeftDiv = function() {
        self.$divInfo.addClass('left-div-off');
        self.$divInfo.removeClass('left-div-on');
    };

    /**
     * Close the info div and the Info Window to clear the map of clutter.
     */
    self.closeMarkerInfo = function() {
        self.closeLeftDiv();
        self.closeInfoWindow();
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
        console.log('going on with credits');
        console.log(self.creditOn());
    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, mapManager));

var TheatreMapViewModel = TheatreMapViewModel || {};
var ko = ko || {};

ko.applyBindings(TheatreMapViewModel);
