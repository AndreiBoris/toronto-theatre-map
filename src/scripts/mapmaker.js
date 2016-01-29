var google = google || {};
// instantiated TheatreMapViewModel from app.js
var tmvm = tmvm || {};

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
        title: 'Buddies in Bad Times Theatre',
        content: 'Buddies in Bad Times Theatre.'
    }, {
        position: {
            lat: 43.674842,
            lng: -79.412820
        },
        title: 'Tarragon Theatre',
        content: 'Tarragon Theatre'
    }, {
        position: {
            lat: 43.648553,
            lng: -79.402584
        },
        title: 'Theatre Passe Muraille',
        content: 'Theatre Passe Muraille'
    }, {
        position: {
            lat: 43.645531,
            lng: -79.402690
        },
        title: 'Factory Theatre',
        content: 'Factory Theatre'
    }, {
        position: {
            lat: 43.661288,
            lng: -79.428240
        },
        title: 'Storefront Theatre',
        content: '<a href="http://thestorefronttheatre.com/">Storefront ' +
            'Theatre</a><p>Storefront Theatre is an independent theatre that is ' +
            'home of the Red One Theatre Collective.</p>'
    }, {
        position: {
            lat: 43.659961,
            lng: -79.362607
        },
        title: 'Native Earth Performing Arts',
        content: '<a href="http://www.nativeearth.ca/">Native Earth Performing ' +
            'Arts</a><p>Founded in 1982, it is the oldest professional Aboriginal ' +
            'performing arts company in Canada.</p>'
    }, {
        title: 'Berkeley Street Theatre',
        content: 'Berkeley Street Theatre',
        address: '26 Berkeley St, Toronto'
    }, {
        title: 'Bluma Appel Theatre',
        content: 'Bluma Appel Theatre',
        address: '27 Front St E, Toronto'
    }, {
        title: 'Harbourfront Center',
        content: 'Harbourfront Center',
        address: '235 Queens Quay W'
    }, ],
    nullPosition: {
        lat: 0,
        lng: 0
    }
};

/**
 * Load the map initially
 * @return {[type]} [description]
 */
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

    /**
     * Add the markers stored in mapManager.markers through instantiated 
     * TheatreMapViewModel
     */
    tmvm.addMarkers();
}
