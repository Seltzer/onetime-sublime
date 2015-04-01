# OneTime Sublime
Enhancements for an internal web app called OneTime, in the form of a Chrome extension.


## Current features
Note that the below features can be enabled / disabled and customised via the extension options.

- **Week grid clicking**  
Days in the week grid (below the calendar) are clickable! By default, days which would result in a month change aren't made clickable. This can be overridden via the options.

- **Real time filtering of Favourites**  
Entries in the Personal / Team tabs of the Favourites panel are refined as you type in the filter box. Useful for those of us who log time against many different tasks.

- **Calendar highlighting of today's date**  
The calendar entry for the current date is emboldened and given a green border. Note that this is distinct from the _currently selected day / week_, which OneTime already highlights in shades of blue.

- **Calendar highlighting of incomplete days**   
OneTime already highlights incomplete days in the Week Grid in red. Now they're highlighted in the calendar too, giving you a quick overview of days needing to be filled in. By default, future days aren't highlighted, but this can be overridden in the options.

- **'Find Incomplete Day' button**  
Clicking this selects the first incomplete incomplete day in the last few months. Subsequent clicks will cycle through the other incomplete days.

- **Text wrapping in tables**  
Text inside the timesheet grid table (at the bottom) and the tables in the Personal / Team tabs (Favourites Panel) does not wrap by default, and instead is truncated prematurely. Truncation looks nicer aesthetically but is annoying when you want to see hidden text, and is exacerbated on smaller screens. Text wrapping is disabled by default.


## Changelog
Located [here](https://github.com/Seltzer/onetime-sublime/blob/develop/CHANGELOG.md).


## Issues / Enhancements
Located [here](https://github.com/Seltzer/onetime-sublime/issues).