// Thanks to Jake Archibald for this!
//
// http://www.html5rocks.com/en/tutorials/speed/script-loading/

// Use this version to load more quickly (slightly)

'use strict';

    var googleWatcherObject = {
        googleWatcherVariable: '',
        googleWatcherFunction: function() {
            this.googleWatcherVariable = 'success';
        },
        googleWatcherError: function() {
            this.googleWatcherVariable = 'failure';
        }
    };
    var scripts = [
        'dist/perm/production/jquery_and_knockout.min.js',
        // 'src/scripts/mapmanager.js',
        // 'src/scripts/utilities.js',
        // 'src/scripts/divs.js',
        // 'src/scripts/glow.js',
        // 'src/scripts/markers.js',
        // 'src/scripts/directions.js',
        // 'src/scripts/twitter.js',
        // 'src/scripts/filter.js',
        // 'src/scripts/sort.js',
        // 'src/scripts/start.js'
        'dist/scripts/main.min.js', // PRODUCTION mode
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