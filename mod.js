(function($) {
	
	function enableWeekGridClicking($calendar, calendar, $weekGrid, weekGrid) {
		$calendar.bind('navigate', makeWeekGridClickable);
		$weekGrid.bind('dataBound', makeWeekGridClickable);
		makeWeekGridClickable();


		function makeWeekGridClickable() {
			var calendarMonth = calendar.viewedMonth.month();

			$weekGrid.find('table:eq(1) > tbody > tr').each(function() {
				var $tr = $(this),
					dayIndex = $tr.index(),
					boundDateTime = weekGrid.data[dayIndex].weekDateTime,
					isThisMonth = boundDateTime.getMonth() === calendarMonth;

				$tr.toggleClass('clickable', isThisMonth);
				$tr.toggleClass('non-clickable', !isThisMonth);

				if (isThisMonth) {
					$tr.click(function() { 
						// Weekday clicking should trigger all the same behaviour as calendar clicking. The safest way
						// (least likely to break when OneTime is updated) is to simulate a calendar click.
						var dayInCalendar = twoTime.core.getDayInDisplayedCalendar($calendar, calendar, boundDateTime);
						dayInCalendar.$td.children('a').click();

						// But for reasons unknown the event triggered by the above simulated click has the incorrect srcElement, 
						// causing calendar highlighting to break. So we'll have to do it manually.
						if (typeof(HighlightCalendarWeek) !== 'undefined')
							HighlightCalendarWeek(dayInCalendar.$td);
					});
				}
			});
		}
	}

	
	function enableTodayHighlighting($calendar, calendar, $weekGrid) {
		$calendar.bind('navigate change', highlightToday);
		$weekGrid.bind('dataBound', highlightToday);
		highlightToday();


		function highlightToday() {
			var today = twoTime.core.getDayInDisplayedCalendar($calendar, calendar, twoTime.core.getDateNow());
			if (today)
				today.$td.addClass('today');								
		}
	}


	function enableFavouritesFiltering($favTab) {
		var $li = $('<li class="favourites-filter"></li>')
			.appendTo($favTab.find('ul.t-tabstrip-items'));

		// Create search box and attach change handler
		var $searchBox = $('<input type="search" placeholder="Type here to filter" />')
			.appendTo($li)
			// Using 'keyup' as 'keypress' ignores backspace. 'search' is fired when the user presses <RET> or clicks the X.
			// Deliberately avoiding events like blur and change which will fire when tab is changed (as this causes flicker)
			.bind('keyup mouseout mousedown search', runFilter);

		// When a tab is selected...
		$favTab.bind('select', function(event) {
			var	tabText = $(event.item).text();

			// Ensure that FF is only displayed for the appropriate tabs			
			$li.toggle(contains(tabText, 'personal') || contains(tabText, 'team'));
			
			// Blank out search box and re-run filter which will make all rows visible
			$searchBox.val('');
			runFilter();
		});


		// --- Helper functions --- 

		function rowsOfCurrentTab() {
			return $favTab.find('.t-content.t-state-active .t-grid-content table tbody tr');
		}
		
		function runFilter() {
			var text = $searchBox.val().trim();

			rowsOfCurrentTab().each(function() {
				var $row = $(this);
				$row.toggle(!text || contains($row.text(), text));
			});
		};

		function contains(text, substring) {
			return text.toLowerCase().indexOf(substring.toLowerCase()) !== -1;
		};
	}


	function enableIncompleteDayHighlighting($calendar, calendar, $weekGrid) {
		$calendar.bind('navigate change', highlightIncompleteDays);
		$weekGrid.bind('dataBound', highlightIncompleteDays);
		highlightIncompleteDays();


		function highlightIncompleteDays() {
			// Fetch a representation of the weeks currently displayed in the calendar. We'll be working with these
			var weeksInCalendar = twoTime.core.getWeeksInDisplayedCalendar($calendar, calendar);

			// We're going to fetch three months of timesheets, guaranteed to cover the displayed month
			var firstDayOfDisplayedMonth = calendar.viewedMonth.toDate(),
				firstDayOfPreviousMonth = twoTime.core.addMonths(firstDayOfDisplayedMonth, -1),
				firstDayOfNextMonth = twoTime.core.addMonths(firstDayOfDisplayedMonth, 1);

			// Fetch, correlate, process.
			twoTime.core.getMonthsOfTimesheets(firstDayOfPreviousMonth, firstDayOfNextMonth)
				.done(function(timesheets) {
					_.each(weeksInCalendar, function(week) {
						processWeek(timesheets, week);
					});
				});


			function processWeek(timesheets, week) {
				// Attach timesheet info to days from above
				var augmentedDays = _.map(week, function(day) {
					return {
						date: day.date,
						$calendarTd: day.$td,
						timesheets: timesheets[day.date] || []
					};
				});

				// Compute total hours for week - this has a bearing on whether we mark individual days as incomplete
				var totalHours = _.chain(augmentedDays)
					.pluck('timesheets')
					.flatten()
					.reduce(function(total, ts) { return total + ts.Duration; }, 0)
					.value();

				// If user has clocked more than the standard weekly quota, to be consistent with OneTime,
				// we shan't mark any days as incomplete.
				if (totalHours >= showjobsOptions.stdHoursPerWeek)
					return;

				// Take weekdays which fall under daily quota and mark them as incomplete.
				_.chain(augmentedDays)
					.filter(function(day) {
						var hoursClocked = day.timesheets.reduce(function(total, ts) { return total + ts.Duration; }, 0);

						return twoTime.core.isWeekDay(day.date)	&& hoursClocked < showjobsOptions.stdHours;
					})
					.pluck('$calendarTd')
					.each(function($td) {
						$td.addClass('incomplete');
					});
			}
		}
	}


	$(function() {
		// Add soapbox
		$('<span id="two-time-soapbox">' + 
			'Modded with <a target="_blank" href="https://github.com/Seltzer/two-time">TwoTime v1.0.0</a>' + 
		  '</span>')
		  .appendTo($('#titleContainer'));

		// Obtain DOM elements and Telerik components on page
		var $cal = $('#cal'),
			cal = $cal.data('tCalendar'),
			$weekGrid = $('#weekgrid'),
			weekGrid = $weekGrid.data('tGrid'),
			$favTab = $('#favTab');

		var config = $('#two-time-config').data('two-time-config');

		if (config.enableFavouritesFiltering)
			enableFavouritesFiltering($favTab);
		if (config.highlightIncompleteDays)
			enableIncompleteDayHighlighting($cal, cal, $weekGrid);
		if (config.enableWeekdayClicking)
			enableWeekGridClicking($cal, cal, $weekGrid, weekGrid);
		if (config.enableTodayHighlighting)
			enableTodayHighlighting($cal, cal, $weekGrid);
	});

}(jQuery));

