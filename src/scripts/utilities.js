var mapManager = mapManager || {};

/**
 * This file is used to hold helper functions and objects in an encapsulated 
 * way.
 * @param  {Object} mapManager  is the original mapManager object that we are 
 *                              adding attributes and variables to.
 */
mapManager.util = (function(mapManager) {
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
         * Resize the right tabs appropriately according to window height. This 
         * gets run as soon as the app is loaded and then whenever the page is 
         * resized.
         */
        repositionTabs: function() {
            console.log('Resizing tabs');
            var $allTabs = $('.tab-image');
            var $twitterTabs = $('.twitter-tab-image');
            var $listTabs = $('.list-tab-image');
            var $filterTabs = $('.filter-tab-image');
            // Base positioning and tab size on the height of the window
            var screenHeight = window.innerHeight;
            // Put a limit on minimum size of tabs to avoid overly small targets.
            var tabSizeMeasure = screenHeight < 450 ? 450 : screenHeight;
            // Resize the tabs according to the size of the window
            $allTabs.css('height', tabSizeMeasure / 4.5);
            $listTabs.css({
                'top': screenHeight * 0.05 // top tab position
            });
            $twitterTabs.css({
                'top': screenHeight * 0.35 // center tab position
            });
            $filterTabs.css({
                'top': screenHeight * 0.65 // bottom tab position
            });
        }
    };
    return utilities;
}(mapManager));

// Position twitter tab as soon as page loads.
mapManager.util.repositionTabs();
