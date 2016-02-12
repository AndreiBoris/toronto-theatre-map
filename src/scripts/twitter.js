var ko = ko || {};
var twttr = twttr || {};

/**
 * Here we load all the Twitter related methods.
 * @param  {[type]} self    This is whatever version of TheatreMapViewModel was
 *                          passed to this module.
 */
var TheatreMapViewModel = (function(self) {
    'use strict';

    /**
     * We hide the error div momentarily so that it doesn't normally get seen
     * by users. It will only appear if a twitter feed did not load after a 
     * full second and a half following a request.
     */
    self.blinkTwitterError = function() {
        // If we don't clear the request then an older timeout request can 
        // interrupt the process and display the error when it shouldn't be 
        // displayed.
        if (self.errorTimeoutRequest) {
            clearTimeout(self.errorTimeoutRequest);
        }
        self.$twitterErrorDiv.hide();
        self.errorTimeoutRequest = setTimeout(function() {
            self.$twitterErrorDiv.show();
        }, 1500);
    };

    /**
     * Determine whether the loaded twitter user matches the selected one
     */
    self.newTwitterUser = ko.computed(function() {
        var result = self.activeTwitter() !== self.lastTwitterUser();
        if (result) {
            self.glowingTwitter = true;
        }
        console.log('We have a new twitter user? ' + result); // DEBUG
        console.log(self.glowingTwitter);
        return result;
    });

    /**
     * Toggled by user interaction on the view. Changes whether a short or long
     * feed should be requested.
     */
    self.toggleTwitterLength = function() {
        console.log('Toggling twitter length.');
        self.blinkTwitterError(); // Hide twitter error message momentarily.
        self.twitterLong(!self.twitterLong()); // Toggle feed type requested.
        // If the twitter list is long, we don't need to allow css scrolling
        if (self.twitterLong()) {
            self.$twitterListDiv.removeClass('scroll-div');
            self.$twitterAccountDiv.removeClass('scroll-div');
        } else {
            self.$twitterListDiv.addClass('scroll-div');
            self.$twitterAccountDiv.addClass('scroll-div');
        }
        // A change to requested feed type might require a reload.
        self.determineNeedToReload();
    };

    /**
     * Switch between list view and user view.
     * @return {[type]} [description]
     */
    self.switchTwitter = function() {
        self.blinkTwitterError();
        self.twitterListView(!self.twitterListView());
    };

    /**
     * This computed depends on whether the user is using the appropriate 
     * Twitter view and on what the selected twitter account is. If the view
     * is opened, the account is changed, or a different feed length is
     * requested, a new twitter feed for that account is added to the 
     * #twitter-account div.
     *
     * Both this and the twitterListFeed below occupy the same #twitter-div but
     * only one is visible at any given time.
     */
    self.newTwitterUserFeed = ko.computed(function() {
        if (self.twitterIsOpen() && !self.twitterListView() &&
            (self.needTwitterUserReload() || self.newTwitterUser())) {
            self.blinkTwitterError(); // Hide twitter error message momentarily.
            // Faster than running determineNeedToReload. We know the current 
            // loaded feed is the same as the requested one.
            self.needTwitterUserReload(false);
            // Make the computed newTwitterUser false.
            self.lastTwitterUser(self.activeTwitter());
            console.log('LOADING NEW TWITTER USER.'); // DEBUG
            console.log('Active twitter account is ' + self.activeTwitter()); // DEBUG
            // Clear div for generation of new twitter feed.
            document.getElementById('twitter-account').innerHTML = '';
            console.log('Inner height is ' + window.innerHeight);
            // Use twttr library to create new user timeline
            if (self.twitterLong()) { // Load a long, limitless feed.
                self.currentTwitterUserLong = true;
                twttr.widgets.createTimeline(
                    '694221648225001472', // widget ID made on my Twitter account
                    document.getElementById('twitter-account'), { // target div
                        screenName: self.activeTwitter(), // observable 
                        height: window.innerHeight - 105
                    }
                );
            } else { // Load only the 5 most recent tweets.
                self.currentTwitterUserLong = false;
                twttr.widgets.createTimeline(
                    '694221648225001472', // widget ID made on my Twitter account
                    document.getElementById('twitter-account'), { // target div
                        screenName: self.activeTwitter(), // observable
                        tweetLimit: 5 // Prevents excessive bandwidth use 
                    }
                );
            }
        }
    });

    /**
     * This computed will only perform its function if Twitter is open and set 
     * to display the Twitter list view. Those two conditions met, it will run 
     * if its the first time the list feed is being loaded, or if the requested
     * feed type is different from the loaded feed type.
     */
    self.newTwitterListFeed = ko.computed(function() {
        // If twitter is not open, we shouldn't waste cycles or bandwidth.
        if (self.twitterIsOpen() && self.twitterListView() &&
            (self.firstListLoad || self.needTwitterListReload())) {
            self.blinkTwitterError(); // Hide twitter error message momentarily.
            // Only first load doesn't account for difference between the 
            // loaded and requested feed types.
            self.firstListLoad = false;
            // Faster than running determineNeedToReload. We know the current 
            // loaded feed is the same as the requested one.
            self.needTwitterListReload(false);
            // Clear div for generation of new twitter feed.
            document.getElementById('twitter-list').innerHTML = '';
            console.log('LOADING NEW TWITTER LIST.'); // DEBUG
            console.log('Inner height is ' + window.innerHeight);
            // Use twttr library to create new list timeline
            if (self.twitterLong()) {
                self.currentTwitterListLong = true;
                twttr.widgets.createTimeline(
                    '694233158955323392', // widget ID made on my Twitter account
                    document.getElementById('twitter-list'), { // target div
                        listOwnerScreenName: 'BreathMachine', // List-holding account
                        listSlug: 'toronto-theatre', // Name of twitter list
                        height: window.innerHeight - 70
                    }
                );
            } else {
                self.currentTwitterListLong = false;
                twttr.widgets.createTimeline(
                    '694233158955323392', // widget ID made on my Twitter account
                    document.getElementById('twitter-list'), { // target div
                        listOwnerScreenName: 'BreathMachine', // List-holding account
                        listSlug: 'toronto-theatre', // Name of twitter list
                        tweetLimit: 10 // Prevents excessive bandwidth use.
                    }
                );
            }

        }
    });

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}));
