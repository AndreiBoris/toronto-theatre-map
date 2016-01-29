var ko = ko || {};
var google = google || {};
var mapManager = mapManager || {};


function loadData(nameOfTheatre, viewmodel, index) {
    'use strict';

    var formattedName = nameOfTheatre.replace(/ /g, '_');

    // Only try find 1 article.
    var urlWiki = ('https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' +
        formattedName + '&limit=1&redirects=resolve');

    /**
     * wikiRequestTimeout will be cancelled if the ajax request below is 
     * successful
     */
    var wikiRequestTimeout = setTimeout(function() { // no wiki articles found
        return false;
    }, 5000);

    $.ajax({
        url: urlWiki,
        dataType: 'jsonp',
        success: function(data) {
            // This will not let the timeout response to occur.
            console.log('We succeed at the AJAX call');
            clearTimeout(wikiRequestTimeout);
            var wikiFound = data[1].length;
            var wikiTitle = '<h4><a href="' + data[3][0] + '">' + data[1][0] + '</a></h4>';
            console.log(wikiTitle);
            // var wikiLink = '<li id="article-' + i + '" class="article">' + wikiTitle + '</li>';
            if (wikiFound) {
                console.log('alledgedly pushing a value');
                viewmodel.infoWindowsContent.push(wikiTitle);
                viewmodel.infoWindows[index].setContent(wikiTitle);
                console.log(viewmodel.infoWindowsContent());
            }
            if (wikiFound < 1) {
                console.log('we fail to find an article');
                viewmodel.infoWindowsContent.push(mapManager.markers.content);
                viewmodel.infoWindows[index].setContent(mapManager.markers.content);
            }
        }
    });
}

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

    self.infoWindows = [];

    self.infoWindowsContent = ko.observableArray([]);

    var infowindow;

    /**
     * This is used inside the forEach loop in self.addMarkers, it makes sure
     * that the listeners are bound to the correct markers.
     * @param  {int} index      This corresponds to the index number
     * @param  {google.maps.InfoWindow} infowindow [description]
     */
    var infoWindowBinder = function(index, infowindow) {
        self.markers()[index].addListener('click', function() {
            // All other infoWindows are closed so as to not clutter up the 
            // map
            self.infoWindows.forEach(function(infoWin, index, allInfoWindows) {
                infoWin.close();
            });
            infowindow.open(mapManager.map, self.markers()[index]);
            console.log('Good job, you clicked on ' + self.markers()[index].title);
        });
    };

    self.printSomething = function() {
        console.log(self.infoWindowsContent());
    };

    self.addMarkers = function() {
        mapManager.markers.forEach(function(markerData, index, hardCodedMarkers) {
            self.markers.push(new google.maps.Marker({
                position: markerData.position,
                map: mapManager.map,
                title: markerData.title
            }));
            loadData(markerData.title, self, index);
            infowindow = new google.maps.InfoWindow({
                content: '',
                maxWidth: 150
            });
            self.infoWindows.push(infowindow);
            infoWindowBinder(index, infowindow);
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

var google = google || {};
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

    tmvm.addMarkers();
}

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
        content: 'Buddies in Bad Times Theatre. This is an obnoxiously long ' +
                'message. Let\'s see how it gets handled in the little window.'
    }, {
        position: {
            lat: 43.674842, 
            lng: -79.412820
        },
        title: 'Tarragon Theatre',
        content: 'Tarragon Theatre'
    },
    {
        position: {
            lat: 43.648553, 
            lng: -79.402584
        },
        title: 'Theatre Passe Muraille',
        content: 'Theatre Passe Muraille'
    },
    {
        position: {
            lat: 43.645531, 
            lng: -79.402690
        },
        title: 'Factory Theatre',
        content: 'Factory Theatre'
    }]
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
