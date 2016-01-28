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

    self.consoleLogSearchText = function() {
        mapManager.map.setOptions({
            zoom: 4
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
