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
        viewmodel.infoWindows[index].setContent(mapManager.markers[index].content);
        return false;
    }, 5000);

    $.ajax({
        url: urlWiki,
        dataType: 'jsonp',
        success: function(data) {
            // This will not let the timeout response to occur.
            clearTimeout(wikiRequestTimeout);
            var wikiFound = data[1].length;
            if (wikiFound) {
                var wikiTitle = '<h4><a href="' + data[3][0] + '">' + data[1][0] + 
                '</a></h4><p>' + data[2][0] + '</p>';
                viewmodel.infoWindows[index].setContent(wikiTitle);
            }
            if (wikiFound < 1) {
                viewmodel.infoWindows[index].setContent(mapManager.markers[index].content);
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
