// Object used to store callbacks from Google Maps API
    var googleWatcherObject = {
        googleWatcherVariable: '',
        googleWatcherFunction: function() { 
            // On successful load of Google Maps API, load markers.
            this.googleWatcherVariable = 'success';
        },
        googleWatcherError: function() {
            // On unsuccessful load of Google Maps API, display error message.
            this.googleWatcherVariable = 'failure';
        }
    }

    // Thank you to Jake Archibald at www.html5rocks.com for the following script!
    // http://www.html5rocks.com/en/tutorials/speed/script-loading/#disqus_thread
    // see dist/perm/production/jsLoading.js for details
    // Currently in DEVELOPMENT MODE
    'use strict';
    // If you add a script here, be sure to add it to the gulp file load order
    // as well in the Scripts task
    var scripts = [
        'dist/perm/production/jquery_and_knockout.min.js',
        // 'src/scripts/mapmanager.js', // development mode
        // 'src/scripts/utilities.js', // development mode
        // 'src/scripts/attributes.js', // development mode
        // 'src/scripts/directions.js', // development mode
        // 'src/scripts/markers.js', // development mode
        // 'src/scripts/twitter.js', // development mode
        // 'src/scripts/filter.js', // development mode
        // 'src/scripts/glow.js', // development mode
        // 'src/scripts/sort.js', // development mode
        // 'src/scripts/divs.js', // development mode
        // 'src/scripts/start.js', // development mode
        'dist/scripts/main.min.js' // PRODUCTION mode
    ];

    var src;
    var script;
    var pendingScripts = [];
    var firstScript = document.scripts[0];

    // Watch scripts load in IE
    function stateChange() {
        // Execute as many scripts in order as we can
        var pendingScript;
        while (pendingScripts[0] && pendingScripts[0].readyState === 'loaded') {
            pendingScript = pendingScripts.shift();
            // avoid future loading events from this script (eg, if src changes)
            pendingScript.onreadystatechange = null;
            // can't just appendChild, old IE bug if element isn't closed
            firstScript.parentNode.insertBefore(pendingScript, firstScript);
        }
    }

    // loop through our script urls
    while (scripts.length > 0) {
        src = scripts.shift();
        if ('async' in firstScript) { // modern browsers
            script = document.createElement('script');
            script.async = false;
            script.src = src;
            document.head.appendChild(script);
        } else if (firstScript.readyState) { // IE<10
            // create a script and add it to our todo pile
            script = document.createElement('script');
            pendingScripts.push(script);
            // listen for state changes
            script.onreadystatechange = stateChange;
            // must set src AFTER adding onreadystatechange listener
            // else we’ll miss the loaded event for cached scripts
            script.src = src;
        } else { // fall back to defer
            document.write('<script src="' + src + '" defer></' + 'script>');
        }
    }