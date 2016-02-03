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

mapManager.util.hideItem = function(marker) {
    'use strict';
    marker.infoWin.close();
    marker.setMap(null);
    marker.listed(false);
};

mapManager.util.showItem = function(marker) {
    'use strict';
    marker.setMap(mapManager.map);
    marker.listed(true);
};

mapManager.util.alphabeticalSort = function(a, b) {
    'use strict';
    if (a.title === b.title) {
        return 0;
    } else {
        return a.title > b.title ? 1 : -1;
    }
};

mapManager.util.alphabeticalSortReverse = function(a, b) {
    'use strict';
    if (a.title === b.title) {
        return 0;
    } else {
        return a.title < b.title ? 1 : -1;
    }
};

mapManager.util.foundingSort = function(a, b) {
    'use strict';
    if (a.founded === b.founded) {
        return 0;
    } else {
        return a.founded > b.founded ? 1 : -1;
    }
};

mapManager.util.foundingSortReverse = function(a, b) {
    'use strict';
    if (a.founded === b.founded) {
        return 0;
    } else {
        return a.founded < b.founded ? 1 : -1;
    }
};

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

mapManager.util.itemFailsFilter = function(marker, filter) {
    'use strict';
    if (mapManager.util.inArray(marker.flags, filter) === false) {
        mapManager.util.hideItem(marker);
        return true;
    }
    return false;
};
