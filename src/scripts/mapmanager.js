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
    },
    initMap: function() {
        'use strict';

        var torontoLatLng = {
            lat: 43.657899,
            lng: -79.3782433
        };

        // Create a map object and specify the DOM element for display.
        this.map = new google.maps.Map(document.getElementById('map'), {
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
    },
    wikipediaRequest: function(nameOfTheatre, viewmodel, index) {
        'use strict';

        var self = this;

        var formattedName = nameOfTheatre.replace(/ /g, '_');

        // Only try find 1 article.
        var urlWiki = ('https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' +
            formattedName + '&limit=1&redirects=resolve');

        /**
         * wikipediaRequestTimeout will be cancelled if the ajax request below is 
         * successful
         */
        var wikipediaRequestTimeout = setTimeout(function() { // no wiki articles found
            viewmodel.infoWindows[index].setContent(self.markers[index].content);
            return false;
        }, 5000);

        $.ajax({
            url: urlWiki,
            dataType: 'jsonp',
            success: function(data) {
                // This will not let the timeout response to occur.
                clearTimeout(wikipediaRequestTimeout);
                var wikiFound = data[1].length;
                if (wikiFound) {
                    var wikiTitle = '<h4><a href="' + data[3][0] + '">' + data[1][0] +
                        '</a></h4><p>' + data[2][0] + '</p>';
                    viewmodel.infoWindows[index].setContent(wikiTitle);
                }
                if (wikiFound < 1) {
                    viewmodel.infoWindows[index].setContent(self.markers[index].content);
                }
            }
        });
    },
    coordinateRequest: function(address, viewmodel, index) {
        'use strict';

        var self = this;

        var formattedAddress = address.replace(/ /g, '+');

        var urlCoords = ('https://maps.googleapis.com/maps/api/geocode/json?address=' +
            formattedAddress + '&bounds=43.573936,-79.560076|43.758672,-79.275135' +
            '&key=AIzaSyA4SAawmy-oEMzdWboD0iHk9gDmmjb61o4');

        // TODO: perform some error handling
        $.getJSON(urlCoords, function(data) {
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            viewmodel.markers()[index].setPosition(new google.maps.LatLng(lat, lng));
            self.markers[index].position = { lat: lat, lng: lng };
        }).error(function(e) {
            console.log('We experienced a failure when making the coordinate request for ' + 
                address + ' for the place called ' + self.markers[index].title);
            viewmodel.markers()[index].setMap(null);
        });
    },
    store: function() {
        'use strict';
        console.log(this.markers);
    }
};
