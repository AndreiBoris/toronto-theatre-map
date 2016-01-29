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
