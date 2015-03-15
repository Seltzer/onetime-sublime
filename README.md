# OneTime Sublime
Enhancements for an internal web app called OneTime, in the form of a Chrome extension.


## Current features
- **Week grid clicking**  
Days in the week grid (below the calendar) are clickable! <sup>*</sup>


- **Real time filtering of Favourites**  
Entries in the Personal / Team tabs of the Favourites panel are refined as you type in the filter box. Useful for those of us who log time against many different tasks.


- **Calendar highlighting of incomplete days**   
OneTime already highlights incomplete days in the Week Grid in red. Now they're highlighted in the calendar too, giving you a quick overview of days needing to be filled in.


- **Calendar highlighting of today's date**  
The calendar entry for the current date is emboldened and given a green border. Note that this is distinct from the _currently selected day / week_, which OneTime already highlights in shades of blue.


Note that the above features can be switched on and off via Settings -> Extensions -> OneTime Sublime options (or chrome://extensions)

<sub>(*) To remain consistent with the OneTime calendar and to respect their design choice, weekdays are greyed out and become non-clickable when they correspond to previous/next months.</sub>


## TODO
- Fix responsive bugs in vanilla OneTime (squashed calendar column, timesheet section etc.)
- Fix today highlighting hack... it leads to a slight delay when navigating between months.
- Calendar navigation could be prettier
- Feature: Jump to first incomplete day
- Feature: I feel that users should be rewarded when completing timesheets. With Chuck Norris jokes.
- Feature: Increase row heights in Favourites
- Feature: Modalise

