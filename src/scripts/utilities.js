var mapManager = mapManager || {};

mapManager.util = mapManager.util || {};

// Set InfoWindows to this before giving them relavant content.
mapManager.util.blankInfoWin = {
    content: '',
    maxWidth: 200
};

/**
 * nullPosition is what new markers are set to before being given the
 * correct coordinates.
 */
mapManager.util.nullPosition = {
    lat: 0,
    lng: 0
};
