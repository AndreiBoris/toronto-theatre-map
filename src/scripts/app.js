var ko = ko || {};
var google = google || {};

var TheatreMapViewModel = function(){
    'use strict';
    var self = this;

    self.searchText = ko.observable('');

    self.consoleLogSearchText = function() {
        console.log(self.searchText());
    };
};

ko.applyBindings(new TheatreMapViewModel());