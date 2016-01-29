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

    self.markers = [];

    self.infoWindows = [];

    self.infoWindowsContent = ko.observableArray([]);

    var infowindow;

    /**
     * This is used inside the forEach loop in self.addMarkers, it makes sure
     * that the listeners are bound to the correct markers.
     * @param  {int} index      This corresponds to the index number
     * @param  {google.maps.InfoWindow} infowindow [description]
     */
    var infoWindowBinder = function(index) {
        self.markers[index].addListener('click', function() {
            // All other infoWindows are closed so as to not clutter up the 
            // map
            self.openInfoWindow(index);
            console.log('Good job, you clicked on ' + self.markers[index].title);
        });
    };

    self.openInfoWindow = function(index) {
        self.infoWindows.forEach(function(infoWin, number, allInfoWindows) {
            infoWin.close();
        });
        self.infoWindows[index].open(mapManager.map, self.markers[index]);
    };

    self.printSomething = function() {
        console.log(self.infoWindowsContent());
    };

    self.moveMarker = function() {
        self.openInfoWindow(0);
    };

    self.addMarkers = function() {
        mapManager.markerData.forEach(function(markerData, index, hardCodedMarkers) {
            var goodToGo = true;
            // handle lack of title here
            if (markerData.title === undefined) {
                console.log('One of the inputted locations is not being displayed ' +
                    'because it has no title attribute.');
                if (markerData.content !== undefined) {
                    console.log('It has the following content attached to it: ' +
                        markerData.content);
                }
                console.log(mapManager.utilities.emailMsg);
                goodToGo = false;
            }
            if (markerData.position === undefined) {
                // TODO: handle lack of address here.
                self.markers.push(new google.maps.Marker({
                    position: mapManager.nullPosition,
                    map: mapManager.map,
                    title: markerData.title
                }));
                mapManager.coordinateRequest(markerData.address, self, index);
            } else {
                self.markers.push(new google.maps.Marker({
                    position: markerData.position,
                    map: mapManager.map,
                    title: markerData.title
                }));
            }

            if (goodToGo) {
                mapManager.wikipediaRequest(markerData.title, self, index);
            }

            infowindow = new google.maps.InfoWindow({
                content: '',
                maxWidth: 150
            });

            if (!goodToGo) {
                self.markers[index].setMap(null);
            }

            self.infoWindows.push(infowindow);
            infoWindowBinder(index);
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
