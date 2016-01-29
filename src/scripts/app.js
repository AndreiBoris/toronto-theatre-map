var ko = ko || {};
var google = google || {};
var mapManager = mapManager || {};


function wikiRequest(nameOfTheatre, viewmodel, index) {
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

function coordRequest(address, viewmodel, index) {
    'use strict';

    var formattedAddress = address.replace(/ /g, '+');

    var urlCoords = ('https://maps.googleapis.com/maps/api/geocode/json?address=' +
        formattedAddress + '&bounds=43.573936,-79.560076|43.758672,-79.275135' +
        '&key=AIzaSyA4SAawmy-oEMzdWboD0iHk9gDmmjb61o4');

    // TODO: perform some error handling
    $.getJSON(urlCoords, function(data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        viewmodel.markers()[index].setPosition(new google.maps.LatLng(lat, lng));
    }).error(function(e) {
        console.log('Failure');
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

    self.emailme = 'Please contant the developer at Andrei.Borissenko@gmail.com ' +
    'so that the issue can be promptly resolved.';

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

    self.moveMarker = function() {
        self.markers()[0].setPosition(new google.maps.LatLng(43.657899, -79.3782433));
    };

    self.addMarkers = function() {
        mapManager.markers.forEach(function(markerData, index, hardCodedMarkers) {
            var goodToGo = true;
            // handle lack of title here
            if (markerData.title === undefined) {
                console.log('One of the inputted locations is not being displayed ' + 
                    'because it has no title attribute.');
                if (markerData.content !== undefined) {
                    console.log('It has the following content attached to it: ' + 
                        markerData.content);
                }
                console.log(self.emailme);
                goodToGo = false;
            }
            if (markerData.position === undefined) {
                // TODO: handle lack of address here.
                self.markers.push(new google.maps.Marker({
                    position: mapManager.nullPosition,
                    map: mapManager.map,
                    title: markerData.title
                }));
                coordRequest(markerData.address, self, index);
            } else {
                self.markers.push(new google.maps.Marker({
                    position: markerData.position,
                    map: mapManager.map,
                    title: markerData.title
                }));
            }

            if (goodToGo) {
                wikiRequest(markerData.title, self, index);
            }

            infowindow = new google.maps.InfoWindow({
                content: '',
                maxWidth: 150
            });

            if (!goodToGo) {
                self.markers()[index].setMap(null);
            }

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
