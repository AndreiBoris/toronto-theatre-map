var google = google || {};
// instantiated TheatreMapViewModel from app.js
var mapManager = mapManager || {};
var ko = ko || {};
var TheatreMapViewModel = TheatreMapViewModel || {};

/**
 * mapManager is responsible for holding the map, markers data, and 
 * related logic
 */
var mapManager = (function(self, ko, TheatreMapViewModel, google) {
    'use strict';

    /**
     * The Google Maps API runs this function as a callback when it loads in 
     * order to pan over the correct region and then to load all the markers 
     * from the model.
     */
    self.initMap = function() {

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
        self.directionsService = new google.maps.DirectionsService();

        // Keep a tab on the screen width in order to determine certain 
        // responsive features.
        self.util.windowWidth = window.innerWidth;

        // Use self to guess at whether we're on a phone or not. NOT GOOD.
        self.util.screenWidth = screen.width;

        // Create a Map object and specify the DOM element for display.
        self.map = new google.maps.Map(document.getElementById('map'), {
            center: startingMapPosition,
            scrollwheel: true,
            zoom: 12,
            disableDefaultUI: true,
            styles: [{ 'featureType': 'administrative', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#444444' }] }, { 'featureType': 'landscape', 'elementType': 'all', 'stylers': [{ 'color': '#f2f2f2' }] }, { 'featureType': 'poi', 'elementType': 'all', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'road', 'elementType': 'all', 'stylers': [{ 'saturation': -100 }, { 'lightness': 45 }] }, { 'featureType': 'road.highway', 'elementType': 'all', 'stylers': [{ 'visibility': 'simplified' }] }, { 'featureType': 'road.arterial', 'elementType': 'labels.icon', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'transit', 'elementType': 'all', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'water', 'elementType': 'all', 'stylers': [{ 'color': '#46bcec' }, { 'visibility': 'on' }] }]
        });

        self.geocoder = new google.maps.Geocoder();

        /**
         * Add the markers stored in mapManager.markerData through an 
         * instantiated TheatreMapViewModel object. mapManager.markerData is 
         * populated when mapManager.load() is run at the bottom of this file.
         */
        TheatreMapViewModel.addMarkers();
    };

    /**
     * Adds a marker to an array using the data in a markerItem object.
     * @param  {object} markerItem holds the data needed to create a marker
     * @param  {array}  array      is an observableArray of markers in the
     *                             TheatreMapViewModel
     */
    self.pushMarker = function(markerItem, array) {
        array.push(new google.maps.Marker({
            position: self.util.nullPosition, // 0,0 placeholder
            map: self.map, // the Google map
            title: markerItem.title, // important for many methods
            twitterHandle: markerItem.twitter, // used to access twitter feed
            icon: markerItem.icon, // graphic on the map
            // The 'listed' observable manages whether the marker's 
            // corresponding button on the list is visible or not
            listed: ko.observable(true),
            founded: markerItem.founded, // Company's founding year
            flags: markerItem.flags, // Categories for filters
            blurb: '',
            address: markerItem.address,
            // bounce animation drops instead of cutting to the downward position
            animation: google.maps.Animation.DROP
        }));
    };

    /**
     * If the position coordinates exist, use those. Otherwise, use the address 
     * and make a Google Maps Geocoding call to find the corresponding 
     * coordinates. Failing those two things, we can't display the Marker.
     */
    self.adjustPosition = function(marker, markerItem) {
        var position = markerItem.position;
        var address = markerItem.address;
        if (position) {
            marker.setPosition(position);
        } else if (address) {
            self.mapPositionAJAX(marker, address);
        } else {
            // Take the marker off the map.
            marker.setMap(null);
        }

    };

    /**
     * Fill an InfoWindow associated with marker using available data.
     * @param {object} marker  The marker corresponding to the InfoWindow.
     * @param {string} title   The title to display.
     * @param {string} website The website that the title should link to.
     * @param {string} blurb   The description corresponding to the marker.
     */
    self.setDescription = function(marker, title, website, blurb) {
        if (title && website && blurb) { // we have all the data already
            // Fill the InfoWindow with all the important data.
            // self.infoWindowMaker(marker.infoWin, title, website, blurb);
            marker.website = website;
            marker.blurb = blurb;
        } else if (title) { // we have the title, so we can look up missing data
            // Make a call to the Wikipedia API to retrieve a website and/or blurb.
            self.markerDataAjax(marker, website, blurb);
        } else { // If there is no title, we can't do a wikipedia AJAX call.
            // Fill the InfoWindow as best as we can.
            // self.infoWindowMaker(marker.infoWin, title, website, blurb);
            marker.website = website;
            marker.blurb = blurb;
        }
    };

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
    self.markerDataAjax = function(marker, fallbackWebsite, fallbackBlurp) {


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
                marker.website = website;
                marker.blurb = blurb;
            },
            error: function(e) { // no response
                console.log('Could not access Wikipedia API.');
                // Fall back on whatever content is provided by markerData.
                marker.website = fallbackWebsite;
                marker.blurb = fallbackBlurp;
            }
        });
    };

    /**
     * Perform a Google Geocoding API request and apply retrieved coordinates 
     * to Marker stored at index of array.
     * @param  {string} address The real world address used to find coordinates.
     * @param  {array}  array   An array of google.maps.Marker objects.
     * @param  {int}    index   Determines which Marker to send coordinates to.
     */
    self.mapPositionAJAX = function(marker, address) {

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
        }).error(function(e) { // Can't show the marker without coordinates.
            console.log('We experienced a failure when making the coordinate request for ' +
                address + ' for the place called ' + marker.title);
            marker.setMap(null); // Don't display this marker.
        });
    };

    self.load = function() {
        self.markerData = [{
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
        }, {
            twitter: 'TheBoxToronto',
            title: 'The Box Toronto',
            website: 'http://www.theboxtoronto.com//',
            blurb: 'To fill the need in Toronto for affordable, accessible, ' +
                'clean rehearsal, studio and performance space and to help nurture ' +
                'and support theatre from the beginning stages of the artistic ' +
                'process to polished performance and everything inbetween.',
            address: '103-89 Niagara St, Toronto, On',
            position: {
                lat: 43.641601,
                lng: -79.403273
            },
            icon: 'dist/images/museum.png',
            flags: ['Theatre venue'],
            founded: 2013
        }];

    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(mapManager || {}, ko, TheatreMapViewModel, google));


mapManager.load();


