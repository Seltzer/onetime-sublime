## Changelog

- **v3.0 (12/8/15)**
    * Added / modified / removed many features to accommodate the new major release of OneTime.
    
- **v2.9 (15/6/15)**
    * Improved incomplete day highlighting and 'today' highlighting. Partially complete days and over-saturated days are now highlighted differently to blank / complete days respectively. Week grid is now highlighted. Today is now highlighted using large font, rather than a green rectangle.
    
- **v2.8 (8/6/15)**
    * Fix calendar highlighting bug
    
- **v2.7 (7/6/15)**
    * Partially complete days are now highlighted differently to blank days
    
- **v2.6 (28/5/15)**
    * Fix analytics bug

- **v2.5 (14/4/15)**
    * Added What's New link to header
    * Made options page more user friendly
    * Made OTS header responsive to prevent it being pushed downwards at low resolutions
    * Fixed bug triggered by changing calendar view type
    * Reduced number of AJAX calls triggered by incomplete day highlighting
    * Improved behaviour of 'Find Incomplete Day' for new employees
    * Added analytics
        
- **v2.4 (8/4/15)**
    * 'Find Incomplete Day' now respects the 'Include Future Days?' setting.
    * Fixed 'Incomplete Day Highlighting' bug. Last month in calendar would sometimes never be marked as incomplete.
    * Fixed week grid highlighting bug which could be triggered by repeatedly hammering 'Find Incomplete Day' and causing a month transition.

- **v2.3 (2/4/15)**
    * Fixed calendar highlighting bugs
    * Minified JavaScript
    * Added debug mode to options
    * Cleaned up options defaulting code.
	
- **v2.2 (30/3/15)**  
    * Added 'Find Incomplete Day' button
    * Added option to week grid clicking to allow the month to change
    * Added table text wrapping functionality
    * Added to the OneTime Sublime header at the top of the page. It now links to options / docs / support.
    * Fixed bug which caused injected scripts to potentially be loaded out of order.
    * Fixed bug which caused multiple days to be highlighted as 'Today' when leaving OneTime open overnight.
    * Fixed bug where a day would remain red after filling it in under certain circumstances.
    * Fixed bug which would prevent me from changing default values of options in the future
    * Disable OneTime calendar month change animation. This makes everything much easier.
		
- **v1.0.4 (17/3/15)**  
    * Favourites Filtering bug where FF textbox disappears when pressing SHIFT + DEL / LEFT / RIGHT
	
- **v1.0.3 (16/3/15)**  
    * Initial release with week grid clicking, favourites filtering, incomplete day highlighting, and today highlighting.
