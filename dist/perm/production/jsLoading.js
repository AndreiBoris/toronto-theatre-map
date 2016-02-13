// Thank you to Jake Archibald at www.html5rocks.com for the following script!
// http://www.html5rocks.com/en/tutorials/speed/script-loading/#disqus_thread
// see dist/perm/production/jsLoading.js for details

/**
 * Download all the required JavaScript asynchronously now, before parsing
 * the HTML, and execute it in proper order. 
 * 
 * NOTE: I haven't had this problem yet and don't expect it, but it is 
 * technically possible (maybe?) that we will run through all the JavaScript 
 * and attempt to do the Knockout binding found at the end of the JavaScript 
 * sequence before creating the necessary DOM elements. In order to prevent 
 * this, it is perhaps advisable to dynamically create the DOM in the 
 * scripts. Is there any disadvantage to doing this? Perhaps so.
 */
'use strict';
var scripts = [
    'dist/perm/production/jquery_and_knockout.min.js',
    'src/scripts/mapmanager.js', // development mode
    'src/scripts/utilities.js', // development mode
    'src/scripts/attributes.js', // development mode
    'src/scripts/markers.js', // development mode
    'src/scripts/twitter.js', // development mode
    'src/scripts/filter.js', // development mode
    'src/scripts/glow.js', // development mode
    'src/scripts/sort.js', // development mode
    'src/scripts/divs.js', // development mode
    'src/scripts/start.js', // development mode
    // 'dist/scripts/main.min.js', // PRODUCTION mode
    'https://maps.googleapis.com/maps/api/js?key=AIzaSyCQCl1KRNkAF-BPdyKyO92M0d4vd6MOd0w&callback=mapManager.initMap&region=CA'
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
        // document.write('<script src="' + src + '" defer></' + 'script>');
        script = document.createElement('script');
        script.defer = true;
        script.src = src;
        document.body.appendChild(script);
    }
}
