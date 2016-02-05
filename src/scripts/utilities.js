/**
 * This file is used to hold helper functions and objects in an encapsulated 
 * way.
 */

var mapManager = mapManager || {};
mapManager.util = mapManager.util || {};

// Set InfoWindows to this before giving them relavant content.
mapManager.util.blankInfoWin = {
    content: '',
    maxWidth: 200
};

// What new markers are set to before being given the correct coordinates.
mapManager.util.nullPosition = {
    lat: 0,
    lng: 0
};

/**
 * Hide the marker on the map and hide the corresponding button on the list.
 * @param  {object} marker
 */
mapManager.util.hideItem = function(marker) {
    'use strict';
    // Closing the infoWin first ensures hidden markers don't have windows open
    // when they are shown again.
    marker.infoWin.close();
    marker.setMap(null); // Detach the marker from the map.
    // Change the observable the view depends on when deciding whether to show
    // the button corresponding to the marker.
    marker.listed(false);
};

/**
 * Show the marker on the map and show the corresponding button on the list.
 * @param  {object} marker
 */
mapManager.util.showItem = function(marker) {
    'use strict';
    marker.setMap(mapManager.map);
    marker.listed(true);
};

/**
 * Sort two markers in alphabetical order based on their titles. Ignore case.
 * @param  {object} a is a Marker object
 * @param  {object} b is a Marker object
 */
mapManager.util.alphabeticalSort = function(a, b) {
    'use strict';
    if (a.title === b.title) {
        return 0;
    } else {
        return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
    }
};

/**
 * Sort two markers in reverse alphabetical order based on their titles. Ignore
 * case.
 * @param  {object} a is a Marker object
 * @param  {object} b is a Marker object
 */
mapManager.util.alphabeticalSortReverse = function(a, b) {
    'use strict';
    if (a.title === b.title) {
        return 0;
    } else {
        return a.title.toLowerCase() < b.title.toLowerCase() ? 1 : -1;
    }
};

/**
 * Sort two markers in ascending order based on the year the corresponding item
 * was founded.
 * @param  {object} a is a Marker object
 * @param  {object} b is a Marker object
 */
mapManager.util.foundingSort = function(a, b) {
    'use strict';
    if (a.founded === b.founded) {
        return 0;
    } else {
        return a.founded > b.founded ? 1 : -1;
    }
};

/**
 * Sort two markers in descending order based on the year the corresponding item
 * was founded.
 * @param  {object} a is a Marker object
 * @param  {object} b is a Marker object
 */
mapManager.util.foundingSortReverse = function(a, b) {
    'use strict';
    if (a.founded === b.founded) {
        return 0;
    } else {
        return a.founded < b.founded ? 1 : -1;
    }
};

/**
 * Determine if sought is present in the unsorted array.
 * @param  {array}      array  
 * @param  {primative}  sought can be any primitive to be searched for in the 
 *                             array.
 */
mapManager.util.inArray = function(array, sought) {
    'use strict';
    var length = array.length;
    var i;
    for (i = 0; i < length; i++) {
        if (array[i] === sought) {
            return true;
        }
    }
    return false;
};

/**
 * Check to see if the marker has filter in its flags attribute array.
 * @param  {object} marker is the item we want to check
 * @param  {string} filter is the string we need to find in the marker.flags 
 *                         array.
 */
mapManager.util.itemFailsFilter = function(marker, filter) {
    'use strict';
    if (mapManager.util.inArray(marker.flags, filter)) { // Marker passes filter
        return false;
    } else {    // Marker fails filter
        mapManager.util.hideItem(marker);   // Hide marker and corresponding button.
         // Call will be able to stop checking other filters for this marker, 
         // since it has already failed this one such work is unnecessary.
        return true;    
    }
};

/**
 * Resize the twitter tab appropriately according to the screen height. This 
 * gets run as soon as the app is loaded.
 */
mapManager.util.resizeTwitterTab = function() {
    'use strict';
    var tab = $('#twitter-tab');
    var tabHL = $('#twitter-tab-highlight');
    var screenHeight = screen.height;
    console.log('The screen height is ' + screenHeight); // DEBUG
    tab.css({'top': screenHeight / 3});
    tabHL.css({'top': screenHeight / 3});
};

mapManager.util.resizeTwitterTab();

mapManager.util.fading = false;

mapManager.util.highlight = $('#twitter-tab-highlight');

mapManager.util.curOpacity = 0;

mapManager.util.twitterGlow = function() {
    'use strict';
    if (mapManager.util.fading){
        mapManager.util.curOpacity -= 0.01;
        mapManager.util.highlight.css('opacity', mapManager.util.curOpacity);
        if (mapManager.util.curOpacity <= 0){
            mapManager.util.fading = false;
        }
    } else {
        mapManager.util.curOpacity += 0.01;
        mapManager.util.highlight.css('opacity', mapManager.util.curOpacity);
        if (mapManager.util.curOpacity >= 1){
            mapManager.util.fading = true;
        }
    }
    window.requestAnimationFrame(mapManager.util.twitterGlow);
};

window.requestAnimationFrame(mapManager.util.twitterGlow);