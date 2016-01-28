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

    self.addMarkers = function() {
        
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });

        mapManager.markers.forEach(function(curMarker, index, hardCodedMarkers) {
            self.markers.push(new google.maps.Marker({
                position: curMarker.position,
                map: mapManager.map,
                title: curMarker.title
            }));
            self.markers()[index].addListener('click', function() {
                infowindow.open(mapManager.map, self.markers()[index]);
            });
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
