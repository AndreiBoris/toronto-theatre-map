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
        console.log('Running filter markers');
        var length = self.markers().length; // number of theatres
        var numFilters = self.filters.length; // number of filters
        var i, j;
        var marker; // makes loop easier to read
        self.glowingList = true;
        var filterString = self.filterText().toLowerCase();
        for (i = 0; i < length; i++) { // check each theatre

            marker = self.markers()[i]; // current theatre

            // Here we make the theatre visible. This makes it so this function
            // can handle both a filter being turned on and off.
            mapManager.util.showItem(marker);

            // If there is a filterString, check if marker.title has it as substring
            if (filterString !== '' && self.itemFailsTextFilter(marker, filterString)) {
                continue; // Don't check filters, marker won't be shown
            }

            for (j = 0; j < numFilters; j++) { // cycle through each filter
                if (self.filters[j].filter()) { // the filter is turned on
                    if (self.itemFailsFilter(marker, self.filters[j].flag)) {
                        // If an item doesn't pass the filter, we don't need to
                        // test the other filters.
                        break;
                    }
                }
            }
        }
    });

    /**
     * Check to see if the filterString is in the marker and return true 
     * otherwise
     * @param  {object} marker       The marker that we are trying to filter
     * @param  {string} filterString User inputted string to search for in marker
     * @return {boolean}             True if marker fails and isn't shown, false
     *                                    if marker passes and should be shown.
     */
    self.itemFailsTextFilter = function(marker, filterString){
        if (marker.title.toLowerCase().search(filterString) !== -1) { // string in theatre name
            return false;
        } else { // Marker fails filter 
            mapManager.util.hideItem(marker); // Hide marker and corresponding button.
            // Caller can avoid checking filters for this marker since it has 
            // already failed the text filter
            return true;
        }
    };

    /**
     * Check to see if the marker has filter in its flags attribute array.
     * @param  {object} marker is the item we want to check
     * @param  {string} filter is the string we need to find in the marker.flags 
     *                         array.
     * @param  {string} typedText is the string the user typed into search field   
     */
    self.itemFailsFilter = function(marker, filter) {
        if (mapManager.util.inArray(marker.flags, filter)) { // Marker passes filter
            return false;
        } else { // Marker fails filter
            mapManager.util.hideItem(marker); // Hide marker and corresponding button.
            // Call will be able to stop checking other filters for this marker, 
            // since it has already failed this one such work is unnecessary.
            return true;
        }
    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko, mapManager));
