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
     * Here we add all the markers from the mapManager onto the map, add the 
     * InfoWindows, and bind the InfoWindows to clicks on corresponding markers.
     * We make a couple AJAX calls to find wikipedia resources for the 
     * InfoWindows and, when necessary, calls to Google Maps geocoding API in 
     * order to translate addresses into coordinates on the map.
     */
    self.addMarkers = function() {
        // curInfoWindow is the placeholder name for all added InfoWindows
        var curInfoWindow;
        /**
         * mapManager.markerData holds a series of objects with the information 
         * about theatres needed to create appropriate markers.
         * @param  {object} markerData        An object holding information about
         *                                    the theatre in question.
         * @param  {int}    index             The position in the array we're on,
         *                                    this is useful for the AJAX calls
         *                                    we make that use the indices to 
         *                                    asynchronously apply their data to
         *                                    the correct markers and InfoWindows.               
         */
        mapManager.markerData.forEach(function(markerData, index) {
            // If the markerData object has no title, we won't be able to put 
            // it on the map
            var hasTitle = true;
            if (!markerData.title) {
                hasTitle = false;
            }

            self.markers.push(new google.maps.Marker({
                position: mapManager.nullPosition,
                map: mapManager.map,
                title: markerData.title
            }));

            if (markerData.position) {
                console.log('1');
                self.markers[index].setPosition(markerData.position);
            } else if (markerData.address) {
                console.log('2');
                mapManager.coordinateRequest(markerData.address, self, index);
            } else {
                console.log('3');
                self.markers[index].setMap(null);
            }

            curInfoWindow = new google.maps.InfoWindow({
                content: '',
                maxWidth: 150
            });
            self.infoWindows.push(curInfoWindow);
            infoWindowBinder(index);

            if (hasTitle) {
                mapManager.wikipediaRequest(markerData.title, self, index);
            } else {
                self.infoWindows[index].content = markerData.content;
            }


            /*if (!hasTitle) {
                self.markers[index].setMap(null);
            }*/
        });
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
    nullPosition: {
        lat: 0,
        lng: 0
    },
    initMap: function() {
        'use strict';

        var torontoLatLng = {
            lat: 43.657899,
            lng: -79.3782433
        };

        // Create a map object and specify the DOM element for display.
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: torontoLatLng,
            scrollwheel: true,
            zoom: 12,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.BOTTOM_CENTER
            },
        });

        /**
         * Add the markers stored in mapManager.markerData through instantiated 
         * TheatreMapViewModel
         */
        tmvm.addMarkers();
    },
    wikipediaRequest: function(nameOfTheatre, viewmodel, index) {
        'use strict';

        var self = this;

        var formattedName = nameOfTheatre.replace(/ /g, '_');

        // Only try find 1 article.
        var urlWiki = ('https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' +
            formattedName + '&limit=1&redirects=resolve');

        /**
         * wikipediaRequestTimeout will be cancelled if the ajax request below is 
         * successful
         */
        var wikipediaRequestTimeout = setTimeout(function() { // no wiki articles found
            viewmodel.infoWindows[index].setContent(self.markerData[index].content);
            return false;
        }, 5000);

        $.ajax({
            url: urlWiki,
            dataType: 'jsonp',
            success: function(data) {
                // This will not let the timeout response to occur.
                clearTimeout(wikipediaRequestTimeout);
                var wikiFound = data[1].length;
                if (wikiFound) {
                    var wikiTitle = '<h4><a href="' + data[3][0] + '">' + data[1][0] +
                        '</a></h4><p>' + data[2][0] + '</p>';
                    viewmodel.infoWindows[index].setContent(wikiTitle);
                }
                if (wikiFound < 1) {
                    viewmodel.infoWindows[index].setContent(self.markerData[index].content);
                }
            }
        });
    },
    coordinateRequest: function(address, viewmodel, index) {
        'use strict';

        var self = this;

        var formattedAddress = address.replace(/ /g, '+');

        var urlCoords = ('https://maps.googleapis.com/maps/api/geocode/json?address=' +
            formattedAddress + '&bounds=43.573936,-79.560076|43.758672,-79.275135' +
            '&key=AIzaSyA4SAawmy-oEMzdWboD0iHk9gDmmjb61o4');

        // TODO: perform some error handling
        $.getJSON(urlCoords, function(data) {
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            viewmodel.markers[index].setPosition(new google.maps.LatLng(lat, lng));
            self.markerData[index].position = {
                lat: lat,
                lng: lng
            };
        }).error(function(e) {
            console.log('We experienced a failure when making the coordinate request for ' +
                address + ' for the place called ' + self.markerData[index].title);
            viewmodel.markers[index].setMap(null);
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
            }];
        } else {
            //this.markerData = JSON.parse(localStorage.markerData);
        }

    }
};

/**
 * Is this safe?
 */
mapManager.load();

var mapManager = mapManager || {};

mapManager.utilities = mapManager.utilities || {};

mapManager.utilities.emailMsg = 'Please contant the developer at ' + 
    'Andrei.Borissenko@gmail.com so that the issue can be promptly resolved.';