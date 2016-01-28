var ko = ko || {};
var google = google || {};


var TheatreMapViewModel = function() {
    'use strict';
    var self = this;

    self.searchText = ko.observable('');

    self.consoleLogSearchText = function() {
        self.map().setOptions({ zoom: 4});
    };

    self.map = ko.observable(new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 43.657899,
            lng: -79.3782433
        },
        scrollwheel: true,
        zoom: 12,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.BOTTOM_CENTER
        },
    }));
};

ko.applyBindings(new TheatreMapViewModel());

// var google = google || {};

// function initMap() {
//     'use strict';

//     var torontoLatLng = {
//         lat: 43.657899,
//         lng: -79.3782433
//     };

//     // Create a map object and specify the DOM element for display.
//     var map = new google.maps.Map(document.getElementById('map'), {
//         center: torontoLatLng,
//         scrollwheel: true,
//         zoom: 11,
//         mapTypeControlOptions: {
//             style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
//             position: google.maps.ControlPosition.BOTTOM_CENTER
//         },
//     });

//     var marker = new google.maps.Marker({
//         position: torontoLatLng,
//         map: map,
//         title: 'The "Six" ...'
//     });
// }
