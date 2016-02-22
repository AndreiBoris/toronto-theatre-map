var ko = ko || {};
var mapManager = mapManager || {};

/**
 * The module provides methods for filtering markers.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @param  {object} mapManager  Object with map related function and variables.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko, mapManager) {
    'use strict';

    self.filterText = ko.observable('');

    /**
     * These filters are connected to checkboxes on the view. If one of them is 
     * on, only the markers that pass that filter will be displayed. If filter
     * is added here, be sure to add it to self.filters directly below the 
     * following block of observables.
     */
    self.filterDiverse = ko.observable(false);
    self.filterWomen = ko.observable(false);
    self.filterBlack = ko.observable(false);
    self.filterAboriginal = ko.observable(false);
    self.filterQueer = ko.observable(false);
    self.filterAsian = ko.observable(false);
    self.filterLatin = ko.observable(false);
    self.filterAlternative = ko.observable(false);
    self.filterCommunity = ko.observable(false);
    self.filterInternational = ko.observable(false);
    self.filterChildren = ko.observable(false);
    self.filterTechnology = ko.observable(false);
    self.filterOffice = ko.observable(false);
    self.filterVenue = ko.observable(false);

    /**
     * Keeps the observable and the related flag (from the markers) in one place.
     * If you change something here, be sure to keep it consistent with the 
     * block of observables directly above this comment.
     */
    self.filters = [{
        filter: self.filterDiverse,
        flag: 'Diversity'
    }, {
        filter: self.filterWomen,
        flag: 'Women'
    }, {
        filter: self.filterBlack,
        flag: 'Black'
    }, {
        filter: self.filterAboriginal,
        flag: 'Aboriginal'
    }, {
        filter: self.filterQueer,
        flag: 'Queer culture'
    }, {
        filter: self.filterAsian,
        flag: 'Asian-Canadian'
    }, {
        filter: self.filterLatin,
        flag: 'Latin-Canadian'
    }, {
        filter: self.filterAlternative,
        flag: 'Alternative'
    }, {
        filter: self.filterCommunity,
        flag: 'Community focused'
    }, {
        filter: self.filterInternational,
        flag: 'International'
    }, {
        filter: self.filterChildren,
        flag: 'Theatre for children'
    }, {
        filter: self.filterTechnology,
        flag: 'Technology'
    }, {
        filter: self.filterOffice,
        flag: 'Company office'
    }, {
        filter: self.filterVenue,
        flag: 'Theatre venue'
    }];

    self.toggleFilter = function(clicked) {
        clicked.filter(!clicked.filter());
    };

    /**
     * Here we determine whether the filter tab should be grow.
     */
    self.filterClicked = ko.computed(function() {
        var length = self.filters.length;
        var i;
        for (i = 0; i < length; i++) {
            if (self.filters[i].filter()) {
                self.glowingFilter = true; // If filters are set, glow.
                return; // At least one filter is on, can exit.
            }
        }
        self.glowingFilter = false; // If no filters are set, don't glow.
        self.stopGlow(); // Reset glow defaults.
    });

    /**
     * This is connected to a button the view that allows users to reset the 
     * filters such that all the items are back on the screen.
     */
    self.clearFilters = function() {
        var numFilters = self.filters.length;
        var i;
        for (i = 0; i < numFilters; i++) {
            self.filters[i].filter(false); // set the observable to 'false'
        }
    };

    /**
     * Runs whenever one of the filter checkboxes is changed. It filters which
     * items are visible based on varied criteria.
     *
     * NOTE: This function has many embedded loops.
     * I think its acceptable in this case because it is safe (the function will 
     * be executed correctly, though expensively!), and the projected maximum 
     * number of theatres included in this app is not likely to exceed more than 
     * a couple hundred at any point. Should this no longer be the case, this 
     * is probably one of the first things worth redesigning.
     */
    self.filterMarkers = ko.computed(function() {
        var length = self.markers().length; // number of theatres
        var numFilters = self.filters.length; // number of filters
        var i, j;
        var marker; // makes loop easier to read
        self.glowingList = true;
        for (i = 0; i < length; i++) { // check each theatre

            marker = self.markers()[i]; // current theatre

            // Here we make the theatre visible. This makes it so this function
            // can handle both a filter being turned on and off.
            mapManager.util.showItem(marker);

            for (j = 0; j < numFilters; j++) { // cycle through each filter
                if (self.filters[j].filter()) { // the filter is turned on
                    if (mapManager.util.itemFailsFilter(marker, self.filters[j].flag)) {
                        // Since only one InfoWindow can be open at a given time
                        // we turn off the Close all Windows button if a 
                        // filtered marker had its open.
                        //self.checkInfoWindow(marker);
                        break; // If an item doesn't pass the filter, we don't 
                    } // need to test the other filters.
                }
            }
        }
    });
    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager));
