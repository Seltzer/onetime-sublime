(function($) {
	/**
	 * This exists for testing purposes.
	 */
	function getDateNow() {
//		return new Date(2014, 7, 1);
		return new Date();
	}
	

	/**
	 * Returns nested arrays, where the outer array corresponds to weeks and the inner to days starting with Monday
	 */
	function getWeeksInDisplayedCalendar($calendar, calendar) {
		var firstDayOfCurrentMonth = calendar.viewedMonth.toDate(),
			$mondays = $calendar.find('table tbody tr td:first-child');

		return _.map($mondays, function (monday) {
			var $monday = $(monday),
				$weekDays = $monday.add($monday.nextAll());

			return _.map($weekDays, function (wd) {
				var $wd = $(wd),
					day = parseInt($wd.text()),
					isPrevMonth = $wd.hasClass('t-other-month') && day > 15,
					isNextMonth = !isPrevMonth && $wd.hasClass('t-other-month') && day < 15;

				// Compute date corresponding to selected day
				var date = new Date(firstDayOfCurrentMonth);
				if (isPrevMonth)
					date.setMonth(date.getMonth() - 1);
				if (isNextMonth)
					date.setMonth(date.getMonth() + 1);

				date.setDate(day);
				
				// Return day
				return {
					$td: $wd,
					date: date
				};
			});
		});
	}


	function getDayInCalendar($calendar, calendar, date) {
		var weeksInDisplayedCalendar = getWeeksInDisplayedCalendar($calendar, calendar);

		return _.chain(weeksInDisplayedCalendar)
			.flatten()
			.find(function(day) { 
				return day.date.getFullYear() === date.getFullYear() && day.date.getMonth() === date.getMonth() 
					&& day.date.getDate() === date.getDate();
			})
			.value();
	}


	/**
	 * Gets months of timesheets between specified dates. Returns a promise.
	 * 
	 * @returns A promise, whose value is an object where the keys are JS dates (with year/month/day and zeroed time), 
	 * and the values are arrays of timesheets returned via the OneTime API
	 */
	function getMonthsOfTimesheets(from, to) {
		to = to || getDateNow();

		if (from > to)
			throw 'from must be <= to';

		// Compute monthStarts, an array of dates corresponding to the starts of months of timesheets we want to retrieve
		var firstMonth = new Date(from.getFullYear(), from.getMonth()),
			lastMonth = new Date(to.getFullYear(), to.getMonth());

		var monthStarts = [],
			date = new Date(firstMonth);

		do {
			monthStarts.push(date);
			date = new Date(date);
			date.setMonth(date.getMonth() + 1);
		} while (date <= to);
		
		// For each month to retrieve, call the OneTime API
		var deferredResults = _.map(monthStarts, getTimesheetData);

		// When all calls resolve...
		return $.when.apply($, deferredResults)
			.pipe(function () {
				var timesheets = _.chain(arguments)
					.map(function (result) { return result[0].data; })
					.flatten()
					// Group by a real JS date, not the stringly typed version we received from the API
					.groupBy(function(entry) {
						var dateComponents = entry.Date.split('/');
						return new Date(dateComponents[2], dateComponents[1] - 1, dateComponents[0]);
					})
					.value();

				return $.Deferred().resolve(timesheets);
			});


		// Helper for obtaining timesheet data
		function getTimesheetData(date) {
			var dateString = $.telerik.formatString('{0:MM/dd/yyyy}', date);

			var url = '/Home/_selectdate?date='	+ $.URLEncode(dateString) + '&UserName=' + showjobsOptions.userName
				+ '&viewType=' + 'View%20Month';

			return $.post(url, {});
		}
	}


	/**
	 * @see getMonthsOfTimesheets
	 */
	function getTimesheetsForDisplayedCalendar(calendar) {
		var firstDayOfDisplayedMonth = calendar.viewedMonth.toDate();

		// Ugh, JS date API is awful
		var firstDayOfPreviousMonth = new Date(firstDayOfDisplayedMonth);
		firstDayOfPreviousMonth.setMonth(firstDayOfPreviousMonth.getMonth() - 1);

		var firstDayOfNextMonth = new Date(firstDayOfDisplayedMonth);
		firstDayOfNextMonth.setMonth(firstDayOfNextMonth.getMonth() + 1);

		return getMonthsOfTimesheets(firstDayOfPreviousMonth, firstDayOfNextMonth);
	}


	function enableWeekGridClicking($calendar, calendar, $weekGrid, weekGrid) {
		makeWeekGridClickable();
		$weekGrid.bind('dataBound', makeWeekGridClickable);


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
						// Weekday clicking should trigger all the same behaviour as calendar clicking.
						// The safest way to ensure this happens is to simulate a calendar click.
						var dayInCalendar = getDayInCalendar($calendar, calendar, boundDateTime);
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
			var today = getDayInCalendar($calendar, calendar, getDateNow());
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
			// Using 'keyup' as 'keypress' ignores backspace. 'search' is fired when the user presses <ret> or clicks the X.
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


		// Define helper functions

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


	function highlightIncompleteDays($calendar, calendar) {
		var weeksInCalendar = getWeeksInDisplayedCalendar($calendar, calendar);

		// TODO: Compare to showjobOptions.stdHours
		// TODO: Compare to showjobOptions.

		// Fetch timesheets for displayed calendar
		getTimesheetsForDisplayedCalendar(calendar)
			.done(function(timesheets) {
				// Iterate over calendar weeks
				_.each(weeksInCalendar, function(week) {
					console.log('week starting on ' + week[0].date);

					var timesheetsForWeek = _.chain(week)
						.pluck('date')
						.map(function(date) {
							return timesheets[date] || [];
						})
						.value();

					var totalHours = _.chain(timesheetsForWeek)
						.flatten()
						.reduce(function(total, t) { return total + t.Duration; }, 0)
						.value();
						
					console.log(totalHours);
				});
			});
	}


	$(function() {
		// Obtain DOM elements and Telerik components on page
		var $cal = $('#cal'),
			cal = $cal.data('tCalendar'),
			$weekGrid = $('#weekgrid'),
			weekGrid = $weekGrid.data('tGrid'),
			$favTab = $('#favTab');

		var config = $('#two-time-config').data('two-time-config');

		if (config.enableWeekdayClicking)
			enableWeekGridClicking($cal, cal, $weekGrid, weekGrid);
		if (config.enableTodayHighlighting)
			enableTodayHighlighting($cal, cal, $weekGrid);
		if (config.enableFavouritesFiltering)
			enableFavouritesFiltering($favTab);
		if (config.highlightIncompleteDays)
			highlightIncompleteDays($cal, cal);
	});
}(jQuery));

