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

ko.applyBindings(new TheatreMapViewModel());

var google = google || {};

/**
 * mapManager is responsible for holding the map, markers information, and 
 * related logic
 */
var mapManager = {
    markers: [{
        position: {
            lat: 43.663346,
            lng: -79.383107
        },
        title: 'Buddies in Bad Times Theatre'
    }, {
        position: {
            lat: 43.674842, 
            lng: -79.412820
        },
        title: 'Tarragon Theatre'
    },
    {
        position: {
            lat: 43.648553, 
            lng: -79.402584
        },
        title: 'Theatre Passe Muraille'
    },
    {
        position: {
            lat: 43.645531, 
            lng: -79.402690
        },
        title: 'Factory Theatre'
    }]
};

function initMap() {
    'use strict';

    var torontoLatLng = {
        lat: 43.657899,
        lng: -79.3782433
    };

    // Create a map object and specify the DOM element for display.
    mapManager.map = new google.maps.Map(document.getElementById('map'), {
        center: torontoLatLng,
        scrollwheel: true,
        zoom: 12,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.BOTTOM_CENTER
        },
    });
}
