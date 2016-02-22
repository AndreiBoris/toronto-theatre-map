var ko = ko || {};

/**
 * The module loads methods for making the rightside tabs glow.
 * @param  {object} self        TheatreMapViewModel object without this module.
 * @param  {object} ko          Knockout object to provide framework methods.
 * @return {object}             TheatreMapViewModel with these added methods.
 */
var TheatreMapViewModel = (function(self, ko) {
    'use strict';

    // Respective right-div tab should be glowing
    self.glowingTwitter = false;
    self.glowingList = false;
    self.glowingFilter = false;

    // Respective glowing right-div tab should be fading
    self.glowingTwitterFading = false;
    self.glowingListFading = false;
    self.glowingFilterFading = false;

    // Current opacity of the glowing part of the respective tab
    self.glowingTwitterOpacity = 0;
    self.glowingListOpacity = 0;
    self.glowingFilterOpacity = 0;

    /**
     * Animation for the  glow that indicates there is new content in the any of
     * the right side divs.
     */
    self.glowAnimation = function() {
        // Stop the Twitter glow if Twitter is open.
        if (self.twitterIsOpen() && self.glowingTwitter) {
            self.glowingTwitter = false;
            self.stopGlow(); // Reset corresponding variables.
        }
        // Reset list glow variables if list is open.
        if (self.listIsOpen() && self.glowingList) {
            self.stopGlow(); // Reset corresponding variables.
        }
        // Reset filter glow variables if filter is open.
        if (self.filterIsOpen() && self.glowingFilter) {
            self.stopGlow(); // Reset corresponding variables.
        }
        if (self.glowingTwitter) { // Glow when some change occured.
            self.animateGlowTab('Twitter');
        }
        // Glow when some change occured or there is filter text
        if (self.glowingList && !self.listIsOpen()) { 
            self.animateGlowTab('List');
        }
        // Glow when any filter is on and the filter tab isn't already open. 
        // Since the filter tab doesn't stop glowing by opening the tab, we have 
        // to do a slightly different testing condition.
        if (self.glowingFilter && !self.filterIsOpen()) {
            self.animateGlowTab('Filter');
        }
        // Keep animating.
        window.requestAnimationFrame(self.glowAnimation);
    };

    /**
     * This is used to make the right side tabs glow. Since all the 
     * corresponding variables are named in a consistent way, we can do this to
     * keep things dry.
     * @param  {string} type is a string starting with a capital letter that 
     *                       denotes the type of tab that we are animating
     */
    self.animateGlowTab = function(type) {
        if (self['glowing' + type + 'Fading']) { // Decrease opacity.
            self['glowing' + type + 'Opacity'] -= 0.01; // Track opacity in variable.
            // Set opacity.
            self['$tabHL' + type].css('opacity', self['glowing' + type + 'Opacity']);
            if (self['glowing' + type + 'Opacity'] <= 0) { // Reached endpoint.
                self['glowing' + type + 'Fading'] = false; // Switch to increasing opacity.
            }
        } else { // The tab is brighting. Increase opacity.
            self['glowing' + type + 'Opacity'] += 0.01; // Track opacity in variable.
            // Set opacity.
            self['$tabHL' + type].css('opacity', self['glowing' + type + 'Opacity']);
            // Go beyond 1.0 to pause at brightest point.
            if (self['glowing' + type + 'Opacity'] >= 1.3) {
                self['glowing' + type + 'Fading'] = true; // Switch to decreasing opacity.
            }
        }
    };

    /**
     * Reset the glow animation variables for all tabs that are no longer 
     * glowing.
     */
    self.stopGlow = function() {
        if (!self.glowingTwitter) { // Reset Twitter tab.
            self.glowingTwitterFading = false; // Glow begins like this.
            self.$tabHLTwitter.css('opacity', 0); // Set to transparent.
            self.glowingTwitterOpacity = 0; // Transparency tracking variable.
        }
        if (!self.glowingList) { // Reset list tab
            self.glowingTwitterFading = false; // Glow begins like this.
            self.$tabHLList.css('opacity', 0); // Set to transparent.
            self.glowingTwitterOpacity = 0; // Transparency tracking variable.
        }
        if (self.filterIsOpen()) { // Reset filter tab.
            self.glowingTwitterFading = false; // Glow begins like this.
            self.$tabHLFilter.css('opacity', 0); // Set to transparent.
            self.glowingTwitterOpacity = 0; // Transparency tracking variable.
        }
    };

    /**
     * Add the above methods to TheatreMapViewModel
     */
    return self;

}(TheatreMapViewModel || {}, ko));
