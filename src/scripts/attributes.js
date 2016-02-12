var ko = ko || {};

/**
 * The module loads attributes used by other modules.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko) {
    'use strict';

    /**
     * Div for holding the error messages that are seen when twitter fails to 
     * load quickly enough.
     */
    self.$twitterErrorDiv = $('#twitter-error');
    self.errorTimeoutRequest = null; // Allows us to clear old requests

    /**
     * Holds all the google.maps.Marker type objects so we can easily manipulate
     * them through Knockout.
     */
    self.markers = ko.observableArray([]);

    /**
     * Track whether each respective div is open.
     */
    self.listIsOpen = ko.observable(false);
    self.filterIsOpen = ko.observable(false);
    self.twitterIsOpen = ko.observable(false);

    /**
     * Required to support slide and glow animations
     */
    self.$divList = $('#list-div');
    self.$tabHLList = $('#list-tab-highlight');
    self.$tabBackList = $('#list-tab-back');
    self.$tabAllList = $('.list-tab-image');

    self.$divFilter = $('#filter-div');
    self.$tabHLFilter = $('#filter-tab-highlight');
    self.$tabBackFilter = $('#filter-tab-back');
    self.$tabAllFilter = $('.filter-tab-image');

    self.$divTwitter = $('#twitter-div');
    self.$tabHLTwitter = $('#twitter-tab-highlight');
    self.$tabBackTwitter = $('#twitter-tab-back');
    self.$tabAllTwitter = $('.twitter-tab-image');


    // To determine whether to load the twitter list or a particular account.
    self.twitterListView = ko.observable(true);

    /**
     * These variables hold the currently selected marker's information for 
     * various uses.
     */
    self.currentTitle = ko.observable('');
    self.currentWebsite = ko.observable('');
    self.currentBlurb = ko.observable('');
    self.currentAddress = ko.observable('');

    /**
     * These observables are used in the computed newTwitterUser to determine
     * if the Twitter account requested is different from the one that is loaded.
     */
    self.activeTwitter = ko.observable(''); // current Twitter user selected
    self.lastTwitterUser = ko.observable(''); // current Twitter user loaded

    /**
     * The following two variables keep track of the kind of Twitter feeds that 
     * are currently loaded. Short feeds save bandwidth by only allowing recent
     * posts to be loaded. Long feeds allow users to scroll down to display a 
     * limitless number of posts. 
     */
    self.currentTwitterListLong = false;
    self.currentTwitterUserLong = false;

    /**
     * The length of Twitter feed that the user wants to see. Default is to show 
     * the short feed.
     */
    self.twitterLong = ko.observable(false);


    /**
     * These observables are used by the computed newTwitterUserFeed and 
     * newTwitterListFeed to determine whether to run and load new feeds.
     * Both of these are changed by determineNeedToReload which gets run
     * whenever there might be a difference between the current requested and 
     * current loaded Twitter feed. Default is true for both as initially no
     * Twitter feed is loaded, though this is nominal, since 
     * determineNeedToReload gets run when twitter is first opened.
     */
    self.needTwitterUserReload = ko.observable(true);
    self.needTwitterListReload = ko.observable(true);

    /**
     * If the twitter list feed has never been loaded before, it should be 
     * loaded whenever the user requests it.
     */
    self.firstListLoad = true;


    self.$twitterListDiv = $('#twitter-list');
    self.$twitterAccountDiv = $('#twitter-account');

    self.glowingTwitter = false;
    // The twitter tab bright image is currently fading.
    self.glowingTwitterFading = false;
    // Opacity tracking self.$tabHLList
    self.glowingTwitterOpacity = 0;


    self.glowingList = false;
    // The twitter tab bright image is currently fading.
    self.glowingListFading = false;
    // Opacity tracking self.$tabHLList
    self.glowingListOpacity = 0;

    self.glowingFilter = false;
    // The twitter tab bright image is currently fading.
    self.glowingFilterFading = false;
    // Opacity tracking self.$tabHLList
    self.glowingFilterOpacity = 0;


    /**
     * These filters are connected to checkboxes on the view. If one of them is 
     * on, only the markers that pass that filter will be displayed. If filter
     * is added here, be sure to add it to self.filters directly below the 
     * following block of observables.
     */
    self.filterDiverse = ko.observable(false);
    self.filterWomen = ko.observable(false);
    self.filterBlack = ko.observable(false);
    self.filterAboriginal = ko.observable(false);
    self.filterQueer = ko.observable(false);
    self.filterAsian = ko.observable(false);
    self.filterLatin = ko.observable(false);
    self.filterAlternative = ko.observable(false);
    self.filterCommunity = ko.observable(false);
    self.filterInternational = ko.observable(false);
    self.filterChildren = ko.observable(false);
    self.filterTechnology = ko.observable(false);
    self.filterOffice = ko.observable(false);
    self.filterVenue = ko.observable(false);


    // These are used to sort first forwards and then backwards.
    self.sortedAlpha = false;
    self.sortedFounded = false;
    self.currentSort = ko.observable('');

    /**
     * This is the div that comes in from the left and displays information 
     * about a marker.
     */
    self.$divInfo = $('#display-div');


    /**
     * This will be the only google.maps.InfoWindow that is displayed.
     */
    self.infoWindow = {};


    /**
     * The credit div at the bottom of the app.
     */
    self.$creditDiv = $('#credit-div');
    self.creditOn = ko.observable(false);

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko));
