var ko = ko || {};
var google = google || {};
var mapManager = mapManager || {};

var contentString = 'Words words words';

/**
 * The ViewModel is a function to take advantage of the 'var self = this' idiom
 */
var TheatreMapViewModel = function() {
    'use strict';
    var self = this;

    var torontoLatLng = {
        lat: 43.657899,
        lng: -79.3782433
    };

    self.searchText = ko.observable('');

    self.markers = ko.observableArray([]);

    self.infoWindows = [];

    var infowindow;

    /**
     * This is used inside the forEach loop in self.addMarkers, it makes sure
     * that the listeners are bound to the correct markers.
     * @param  {[type]} index      [description]
     * @param  {[type]} infowindow [description]
     * @return {[type]}            [description]
     */
    var infoWindowBinder = function(index, infowindow) {
        self.markers()[index].addListener('click', function() {
            self.infoWindows.forEach(function(infoWin, index, allInfoWindows) {
                infoWin.close();
            });
            infowindow.open(mapManager.map, self.markers()[index]);
            console.log('Good job, you clicked on ' + self.markers()[index].title);
            console.log('Here are all the infoWindows:' + self.infoWindows);
        });
    };

    self.addMarkers = function() {
        mapManager.markers.forEach(function(markerData, index, hardCodedMarkers) {
            self.markers.push(new google.maps.Marker({
                position: markerData.position,
                map: mapManager.map,
                title: markerData.title
            }));

            infowindow = new google.maps.InfoWindow({
                content: markerData.content,
                maxWidth: 150
            });
            self.infoWindows.push(infowindow);
            infoWindowBinder(index, infowindow);
        });
    };
};

/**
 * tmvm is the instantiated ViewModel that we use to load the initial marker 
 * array through the initMap function in mapmaker.js
 * @type {TheatreMapViewModel}
 */
var tmvm = new TheatreMapViewModel();
ko.applyBindings(tmvm);
