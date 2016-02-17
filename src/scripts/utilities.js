/**
 * This file is used to hold helper functions and objects in an encapsulated 
 * way.
 */

var mapManager = mapManager || {};

mapManager.util = (function() {
    'use strict';
    var utilities = {
        // Set InfoWindows to this before giving them relevant content.
        blankInfoWin: {
            content: '',
            maxWidth: 240,
        },

        // What new markers are set to before being given the correct coordinates.
        nullPosition: {
            lat: 0,
            lng: 0
        },

        /**
         * Hide the marker on the map and hide the corresponding button on the list.
         * @param  {object} marker
         */
        hideItem: function(marker) {
            marker.setMap(null); // Detach the marker from the map.
            // Change the observable the view depends on when deciding whether to show
            // the button corresponding to the marker.
            marker.listed(false);
        },

        /**
         * Show the marker on the map and show the corresponding button on the list.
         * @param  {object} marker
         */
        showItem: function(marker) {
            marker.setMap(mapManager.map);
            marker.listed(true);
        },

        /**
         * Sort two markers in alphabetical order based on their titles. Ignore case.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        alphabeticalSort: function(a, b) {
            if (a.title === b.title) {
                return 0;
            } else {
                return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
            }
        },

        /**
         * Sort two markers in reverse alphabetical order based on their titles. Ignore
         * case.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        alphabeticalSortReverse: function(a, b) {
            if (a.title === b.title) {
                return 0;
            } else {
                return a.title.toLowerCase() < b.title.toLowerCase() ? 1 : -1;
            }
        },

        /**
         * Sort two markers in ascending order based on the year the corresponding item
         * was founded.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        foundingSort: function(a, b) {
            if (a.founded === b.founded) {
                return 0;
            } else {
                return a.founded > b.founded ? 1 : -1;
            }
        },

        /**
         * Sort two markers in descending order based on the year the corresponding item
         * was founded.
         * @param  {object} a is a Marker object
         * @param  {object} b is a Marker object
         */
        foundingSortReverse: function(a, b) {
            if (a.founded === b.founded) {
                return 0;
            } else {
                return a.founded < b.founded ? 1 : -1;
            }
        },

        /**
         * Determine if sought is present in the unsorted array.
         * @param  {array}      array  
         * @param  {primative}  sought can be any primitive to be searched for in the 
         *                             array.
         */
        inArray: function(array, sought) {
            var length = array.length;
            var i;
            for (i = 0; i < length; i++) {
                if (array[i] === sought) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Check to see if the marker has filter in its flags attribute array.
         * @param  {object} marker is the item we want to check
         * @param  {string} filter is the string we need to find in the marker.flags 
         *                         array.
         */
        itemFailsFilter: function(marker, filter) {
            if (mapManager.util.inArray(marker.flags, filter)) { // Marker passes filter
                return false;
            } else { // Marker fails filter
                mapManager.util.hideItem(marker); // Hide marker and corresponding button.
                // Call will be able to stop checking other filters for this marker, 
                // since it has already failed this one such work is unnecessary.
                return true;
            }
        },

        /**
         * Resize the twitter tab appropriately according to the screen height. This 
         * gets run as soon as the app is loaded.
         */
        repositionTabs: function() {
            var $twitterTabs = $('.twitter-tab-image');
            var $listTabs = $('.list-tab-image');
            var $filterTabs = $('.filter-tab-image');
            var screenHeight = screen.height;
            console.log('The screen height is ' + screenHeight); // DEBUG
            if (screenHeight >= 600) {
                $listTabs.css({
                    'top': screenHeight * 0.1
                });
                $twitterTabs.css({
                    'top': screenHeight * 0.3
                });
                $filterTabs.css({
                    'top': screenHeight * 0.5
                });
            } else {
                $listTabs.css({
                    'top': 0
                });
                $twitterTabs.css({
                    'top': screenHeight * 0.4
                });
                $filterTabs.css({
                    'top': screenHeight * 0.7
                });
            }

        }



    };
    return utilities;
}());



// Position twitter tab as soon as page loads.
mapManager.util.repositionTabs();
