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
