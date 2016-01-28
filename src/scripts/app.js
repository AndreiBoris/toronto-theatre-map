var ko = ko || {};
var google = google || {};
var mapManager = mapManager || {};

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
        mapManager.markers.forEach(function(curMarker, index, hardCodedMarkers) {
            self.markers.push(new google.maps.Marker({
                position: curMarker.position,
                map: mapManager.map,
                title: curMarker.title
            }));
        });
    };
};

// /**
//  * Once the Google Maps API loads asynchronously, it will run this function and 
//  * give us access to the map through the TheatreMapsViewModel. 
//  */
// TheatreMapViewModel.prototype.initMap = function() {
//     'use strict';
//     this.map = ko.observable();

//     this.map(new google.maps.Map(document.getElementById('map'), {
//         center: {
//             lat: 43.657899,
//             lng: -79.3782433
//         },
//         scrollwheel: true,
//         zoom: 12,
//         mapTypeControlOptions: {
//             style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
//             position: google.maps.ControlPosition.BOTTOM_CENTER
//         }
//     }));
// };
/**
 * tmvm is the instantiated ViewModel that we use to load the initial marker 
 * array through the initMap function in mapmaker.js
 * @type {TheatreMapViewModel}
 */
var tmvm = new TheatreMapViewModel();
ko.applyBindings(tmvm);

