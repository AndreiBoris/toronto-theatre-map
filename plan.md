# Plan

Look for cool APIs and test them in sterile environments.

Plan to make it work on cell phone.

## Steps

1. Get a KO text box working that allows me input text into my app. DONE
2. Get the Google Maps API on there. DONE
3. Get the search bar to appear on the map DONE
4. Set up some map markers - DONE
5. Set up basic console.log handlers to clicks on markers - DONE
6. Implement one marker that moves from marker to marker. Maybe create an 
observableArray(?) array of infoBoxes that opens a 'close all' button - DONE
7. Get geocoding working such that we don't have to type the coordinate of each
place in. That is super tedious. - DONE
7.5. Get position attribute to be loaded onto mapManager Marker if found using 
the ajax call.
8. Find a way to store that so they only need to make those requests during the
first time the page is loaded. Measure the difference. 
9. Maybe try to get the second section from wikipedia on the theatres cause 
the first is a bit general for some.
10. Make sure that the program fails gracefully when not enough information 
about a theatre location is provided (no address OR position)
11. Try to get the website link from wikipedia to the clickable link instead
of the wikipedia page itself (cause the wiki page is pretty useless!)

### TODO

* Get twitter feed
* probably should apply Bootstrap classes to the content of the InfoWindows
* Should add a way to stop the "close all infoWindows" feature, probably using 
an observable that can be switched on an off with a button.
* TTC directions must be available
* Need to handle error from coordRequest so that the marker doesn't do something 
odd when it gets no good information

### Bootstrap features to use

* buttons
* responsive utilities
* button groups
* labels
* badges (more twitter posts have come in, etc)
* jumbotron initial screen
* thumbnails for currently playing plays? (required scraping! )
* media items for twitter and reviews...

### Working with Google Maps API

* might have to use subscribe Knockout function

### Other APIs

### Features

* Needs to be fairly simple for me to add more twitter accounts to the feed.
* Look into [Web Scraping](https://blog.hartleybrody.com/web-scraping/)
* Scrape Theatre Now and Mooney On theatre reviews?
* How to get there from TTC
* Robust site that won't get outdated if a theatre goes out of business or moves

### Responsive Design

* Make sure the map controls are useable on mobile.

### End Game

1. Does failure work? Unplug internet to test AJAX failures.

Map API Key: AIzaSyCQCl1KRNkAF-BPdyKyO92M0d4vd6MOd0w
Geocoding API key: AIzaSyA4SAawmy-oEMzdWboD0iHk9gDmmjb61o4


### Twitter Feeds to get at

* [Factory](https://twitter.com/factorytoronto)
* [Tarragon](https://twitter.com/tarragontheatre)
* [Crow's Theatre](https://twitter.com/crowstheatre?lang=en)
* [Hart House Theatre](https://twitter.com/hhtheatre)
* [Nightwood Theatre](https://twitter.com/nightwoodtheat?lang=en)
* [Canadian Stage](https://twitter.com/canadianstage)
* [Theatre Pass Muraille](https://twitter.com/beyondwallstpm)
* [Theatre Centre](https://twitter.com/theatrecentre)
* [Obsidian Theatre](https://twitter.com/obsidiantheatre)
* [Mirvish Productions](https://twitter.com/mirvish?lang=en)
* [Buddies in Bad Times](https://twitter.com/yyzbuddies)
* [Toronto Fringe](https://twitter.com/toronto_fringe)
* [Gay Toronto Theatre](https://twitter.com/gaytheatreyyz)
* [Soulpepper Theatre](https://twitter.com/soulpepper)