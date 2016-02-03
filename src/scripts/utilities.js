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
