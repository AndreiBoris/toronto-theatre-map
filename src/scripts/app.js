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
