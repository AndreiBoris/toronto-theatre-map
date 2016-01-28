var ko = ko || {};
var google = google || {};

function initMap() {
    'use strict';
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 43.657899, lng: -79.3782433},
        scrollwheel: true,
        zoom: 11
  });
}

var TheatreMapViewModel = function(){
    'use strict';
    var self = this;

    self.searchText = ko.observable('');

    self.consoleLogSearchText = function() {
        console.log(self.searchText());
    };
};

ko.applyBindings(new TheatreMapViewModel());