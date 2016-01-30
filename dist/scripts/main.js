var ko = ko || {};
var google = google || {};
var mapManager = mapManager || {};

/**
 * The ViewModel is a function to take advantage of the 'var self = this' idiom
 */
var TheatreMapViewModel = function() {
    'use strict';
    var self = this;

    self.searchText = ko.observable('');

    /**
     * Holds all the google.maps.Marker type objects so we can easily manipulate
     * them through Knockout. Will probably need to switch to observableArray.
     * @type {Array}
     */
    self.markers = [];

    /**
     * Holds all the google.maps.InfoWindow type objects. Will probably need to 
     * switch to observableArray.
     * @type {Array}
     */
    self.infoWindows = [];

    self.infoWindowsContent = ko.observableArray([]);

    /**
     * This is used inside the forEach loop in self.addMarkers. It makes sure
     * that the listeners are bound to the correct markers and that the 
     * InfoWindows open when the markers are clicked.
     * @param  {int} index      This corresponds to the index number of the
     *                          self.infoWindows and self.markers, which are 
     *                          created in parallel.
     */
    var infoWindowBinder = function(index) {
        self.markers[index].addListener('click', function() {
            self.openInfoWindow(index);
            console.log('Good job, you clicked on ' + self.markers[index].title);
        });
    };

    /**
     * Close all InfoWindows and open the one that is at position index in 
     * self.infoWindows. 
     * @param  {int} index  Corresponds to index of self.infoWindows and 
     *                      self.markers
     */
    self.openInfoWindow = function(index) {
        self.infoWindows.forEach(function(infoWin, number, allInfoWindows) {
            infoWin.close();
        });
        self.infoWindows[index].open(mapManager.map, self.markers[index]);
    };

    // just a tester function
    self.printSomething = function() {
        console.log(self.infoWindowsContent());
    };
    // just a demonstration of our ability to openInfoWindow without using click
    self.moveMarker = function() {
        self.openInfoWindow(0);
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
        // curInfoWindow is the placeholder name for all added InfoWindows
        var curInfoWindow;
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
            // If there is no title, we don't do a wikipedia ajax call.
            var hasTitle = markerItem.title ? true : false;

            // Add a marker into the position 0,0, which we will later move.
            self.markers.push(new google.maps.Marker({
                position: mapManager.nullPosition,
                map: mapManager.map,
                title: markerItem.title
            }));

            /**
             * If the markerItem has coordinates, use those. If it has an
             * address, we can make a Google Maps Geocoding call to find the 
             * corresponding coordinates. Failing those two things, we can't 
             * display the Marker.
             */
            if (markerItem.position) {
                self.markers[index].setPosition(markerItem.position);
            } else if (markerItem.address) {
                mapManager.coordinateRequest(markerItem.address, self.markers, index);
            } else {
                // Take the marker off the map.
                self.markers[index].setMap(null);
            }

            // Create an empty InfoWindow which we will fill below.
            curInfoWindow = new google.maps.InfoWindow({
                content: '',
                maxWidth: 150
            });

            self.infoWindows.push(curInfoWindow);
            // Set up a listener on the marker that will open the corresponding
            // InfoWindow when the Marker is clicked.
            infoWindowBinder(index);

            /**
             * If we have a title, we can use that to search for information 
             * from the wikipedia resource, otherwise we use the information 
             * provided in the markerItem.
             */
            if (hasTitle) {
                mapManager.wikipediaRequest(markerItem.title, self.infoWindows, index);
            } else {
                self.infoWindows[index].content = markerItem.content;
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
     * nullPosition is what new markers are set to before being given the
     * correct coordinates.
     */
    nullPosition: {
        lat: 0,
        lng: 0
    },

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
    wikipediaRequest: function(nameOfTheatre, array, index) {
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
            array[index].setContent(self.markerData[index].content);
            return;
        }, 5000);

        $.ajax({
            url: urlWiki,
            dataType: 'jsonp',
            success: function(data) {
                console.log(data);
                // Cancel the timeout since AJAX request is successful.
                clearTimeout(wikipediaRequestTimeout);
                // We either found 1 article or we found 0, hence the boolean.
                var wikiFound = data[1].length;
                if (wikiFound) {
                    // Here we are formatting some HTML to conform with the 
                    // established pattern.
                    var wikiTitle = '<h4><a href="' + data[3][0] + '">' +
                    data[1][0] +
                    '</a></h4>' +
                    '<p>' + data[2][0] + '</p>';
                    array[index].setContent(wikiTitle);
                } else {
                    // Fall back on whatever content is provided by markerData.
                    array[index].setContent(self.markerData[index].content);
                }
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
    coordinateRequest: function(address, array, index) {
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
                position: {
                    lat: 43.663346,
                    lng: -79.383107
                },
                title: 'Buddies in Bad Times Theatre',
                content: 'Buddies in Bad Times Theatre.'
            }, {
                position: {
                    lat: 43.674842,
                    lng: -79.412820
                },
                title: 'Tarragon Theatre',
                content: 'Tarragon Theatre'
            }, {
                position: {
                    lat: 43.648553,
                    lng: -79.402584
                },
                title: 'Theatre Passe Muraille',
                content: 'Theatre Passe Muraille'
            }, {
                position: {
                    lat: 43.645531,
                    lng: -79.402690
                },
                title: 'Factory Theatre',
                content: 'Factory Theatre'
            }, {
                position: {
                    lat: 43.661288,
                    lng: -79.428240
                },
                title: 'Storefront Theatre',
                content: '<a href="http://thestorefronttheatre.com/">Storefront ' +
                    'Theatre</a><p>Storefront Theatre is an independent theatre that is ' +
                    'home of the Red One Theatre Collective.</p>'
            }, {
                position: {
                    lat: 43.659961,
                    lng: -79.362607
                },
                title: 'Native Earth Performing Arts',
                content: '<a href="http://www.nativeearth.ca/">Native Earth Performing ' +
                    'Arts</a><p>Founded in 1982, it is the oldest professional Aboriginal ' +
                    'performing arts company in Canada.</p>'
            }, {
                title: 'Berkeley Street Theatre',
                content: 'Berkeley Street Theatre',
                address: '26 Berkeley St, Toronto',
                position: {
                    lat: 43.650621,
                    lng: -79.363817
                }

            }, {
                title: 'Bluma Appel Theatre',
                content: 'Bluma Appel Theatre',
                address: '27 Front St E, Toronto',
                position: {
                    lat: 43.647414,
                    lng: -79.375129
                }
            }, {
                title: 'Harbourfront Center',
                content: 'Harbourfront Center',
                address: '235 Queens Quay W',
                position: {
                    lat: 43.638818,
                    lng: -79.381911
                }
            }, {
                title: 'High Park Amphitheare',
                content: '<a href="https://www.canadianstage.com/Online/' +
                    'default.asp?BOparam::WScontent::loadArticle::permalink=' +
                    '1314shakespeare">Shakespeare in High Park</a><p>Each ' +
                    'summer, a shakespeare show is performed at High Park ' +
                    'Amphitheatre.</p>',
                position: {
                    lat: 43.646378,
                    lng: -79.462464
                }
            }, {
                title: 'Royal Alexandra Theatre',
                content: '<a href="http://www.mirvish.com/theatres/royal' +
                    'alexandratheatre">Royal Alexandra Theatre</a><p>A venue owned' +
                    'by Mirvish Productions with some of the highest production-' +
                    'value shows in the city.</p>',
                address: '260 King Street West, Toronto',
                position: {
                    lat: 43.647354,
                    lng: -79.387593
                }
            }, {
                title: 'Soulpepper Theatre Company',
                content: '<a href="https://www.soulpepper.ca/">Soulpepper</a>' +
                    '<p>Founded in 1998, this theatre company resides in the ' +
                    'distillery district of Toronto.</p>',
                address: '50 Tank House Lane, Toronto',
                position: {
                    lat: 43.650860,
                    lng: -79.357452
                }
            }];
        } else {
            //this.markerData = JSON.parse(localStorage.markerData);
        }

    }
};

mapManager.load();

var mapManager = mapManager || {};

mapManager.utilities = mapManager.utilities || {};

mapManager.utilities.emailMsg = 'Please contant the developer at ' + 
    'Andrei.Borissenko@gmail.com so that the issue can be promptly resolved.';