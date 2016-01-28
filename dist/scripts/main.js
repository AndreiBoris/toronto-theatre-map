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

    self.addMarker = function() {
        /*var marker = new google.maps.Marker({
            position: torontoLatLng,
            map: mapManager.map,
            title: 'the six'
        });*/
        self.markers.push(new google.maps.Marker({
            position: torontoLatLng,
            map: mapManager.map,
            title: 'the six'
        }));
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
 * mapManager is responsible for holding the map, markers, and related logic
 */
var mapManager = {
    markers: [],
    addMarker: function(pos, name){
        'use strict';

        var marker = new google.maps.Marker({
            position: pos,
            map: mapManager.map,
            title: 'the six'
        });
    }
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
        zoom: 11,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.BOTTOM_CENTER
        },
    });
}
