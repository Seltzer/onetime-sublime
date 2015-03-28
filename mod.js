(function($) {
	var weekGridDayRowSelector = 'table:eq(1) > tbody > tr';

	
	/**
	 * The weekday clicking feature is intended to emulate the OneTime calendar clicking functionality in that:
	 *   - Clicking on a day will never result in the month changing (unless enabled via options)
	 *   - Non-clickable days (those outside the displayed month) are displayed in grey.
	 *   - Clicking a weekday should trigger an update to various OneTime panes as if it were a calendar click
	 */
	function enableWeekGridClicking($calendar, calendar, $weekGrid, weekGrid, allowMonthChange) {
		$calendar.bind('navigate', updateWeekGridClickability);
		$weekGrid.bind('dataBound', updateWeekGridClickability);
		updateWeekGridClickability();


		$weekGrid.delegate(weekGridDayRowSelector, 'click', function() {
			var $tr = $(this),
				date = $tr.data('date');

			if ($tr.hasClass('clickable')) {
				// We might need to change calendar month
				if (allowMonthChange) {
					var offset = date.getMonth() - calendar.viewedMonth.toDate().getMonth();
					if (offset > 0)
						calendar.navigateToFuture();
					else if (offset < 0)
						calendar.navigateToPast();
				}

				// If we want to emulate calendar behaviour, the safest way (least likely to break when OneTime is updated)
				// is to simulate a calendar click.
				var dayInCalendar = ots.core.oneTime.getDayInDisplayedCalendar($calendar, calendar, date);

				// This shouldn't happen.
				if (!dayInCalendar) 
					return;

				dayInCalendar.$td.children('a').click();

				// But for reasons unknown the event triggered by the above simulated click has the incorrect srcElement, 
				// causing calendar highlighting to break. So we'll have to do it manually.
				if (typeof(HighlightCalendarWeek) !== 'undefined')
					HighlightCalendarWeek(dayInCalendar.$td);
			}
		});

		
		function updateWeekGridClickability() {
			var calendarMonth = calendar.viewedMonth.month();

			$weekGrid.find(weekGridDayRowSelector).each(function() {
				var $tr = $(this),
					boundDateTime = weekGrid.data[$tr.index()].weekDateTime;

				$tr.data('date', boundDateTime);
				
				var makeClickable = allowMonthChange || boundDateTime.getMonth() === calendarMonth;
				$tr.toggleClass('clickable', makeClickable);
				$tr.toggleClass('non-clickable', !makeClickable);
			});
		}
	}

	
	function enableTodayHighlighting($calendar, calendar, $weekGrid) {
		$calendar.bind('navigate change', highlightToday);

		$weekGrid.bind('dataBound', highlightToday);
		highlightToday();


		function highlightToday() {
			var today = ots.core.oneTime.getDayInDisplayedCalendar($calendar, calendar, ots.core.dates.getDateNow());
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
			// This event seems to fire with no item when you press <SHIFT> + <DEL> / <LEFT> / <RIGHT> in the favourites filter. 
			// It's unwanted.
			if (!event.item)
				return;

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


	function enableIncompleteDayHighlighting($calendar, calendar, $weekGrid, includeFutureDays) {
		$calendar.bind('navigate change', highlightIncompleteDays);
		$weekGrid.bind('dataBound', highlightIncompleteDays);
		highlightIncompleteDays();


		function highlightIncompleteDays() {
			// Fetch a representation of the weeks currently displayed in the calendar. We'll be working with these
			var weeksInCalendar = ots.core.oneTime.getWeeksInDisplayedCalendar($calendar, calendar);

			// We're going to fetch three months of timesheets, guaranteed to cover the displayed month
			var firstDayOfDisplayedMonth = calendar.viewedMonth.toDate(),
				firstDayOfPreviousMonth = ots.core.dates.addMonths(firstDayOfDisplayedMonth, -1),
				firstDayOfNextMonth = ots.core.dates.addMonths(firstDayOfDisplayedMonth, 1);

			// Fetch timesheets, correlate with week representation, process.
			ots.core.oneTime.getMonthsOfTimesheets(firstDayOfPreviousMonth, firstDayOfNextMonth)
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

				// Partition days based on completeness
				var tomorrow = ots.core.dates.zeroDate(ots.core.dates.addDays(new Date(), 1));

				var partitions = _.chain(augmentedDays)
					.partition(function(day) {
						var hoursClocked = day.timesheets.reduce(function(total, ts) { return total + ts.Duration; }, 0);

						return (includeFutureDays || day.date < tomorrow)
							&& ots.core.dates.isWeekDay(day.date) && hoursClocked < showjobsOptions.stdHours;
					})
					.map(function(partition) { return _.pluck(partition, '$calendarTd'); })
					.value();

				// Mark as complete/incomplete accordingly
				_.each(partitions[0], function($incompleteDayTd) { $incompleteDayTd.addClass('incomplete'); });
				_.each(partitions[1], function($completeDayTd) { $completeDayTd.removeClass('incomplete'); });
			}
		}
	}


	function fixCalendarClasses($calendar, $weekGrid) {
		$calendar.bind('change navigate', fix);
		$weekGrid.bind('dataBound', fix);
		fix();


		function fix() {
			$calendar.find('table tbody tr td > a.t-action-link').each(function() { $(this).parent().addClass('public-holiday'); });
		}
	}


	function addHeader(optionsUrl) {
		var $titleContainer = $('#titleContainer');

		// Remove 'Nathan Pitman -' portion. Slightly tricky, as it doesn't reside inside its own element.
		$titleContainer.find('#headingText').parent()
			.contents()
			.filter(function() {
				return this.nodeType === 3 && $(this).nextAll('#headingText').length;
			})
			.remove();

		// Add OTS header
		$('<span id="ots-header">' + 
			'Modded with OneTime Sublime v1.0.4 ' +
			'<span>' + 
				'( <a href="' + optionsUrl + '" target="_blank">options</a> / ' + 
				'<a href="https://github.com/Seltzer/onetime-sublime" target="_blank">docs</a> / ' + 
				'<a href="https://github.com/Seltzer/onetime-sublime/issues" target="_blank">support</a> )' + 
			'</span>' + 
		  '</span>')
		  .appendTo($titleContainer);
	}


	/**
	 * Write certain config state as data attributes to DOM. Our CSS relies on them.
	 */
	function writeConfigToDom(otsConfig) {
		var $html = $('html');
		
		$html.attr({
			'data-today-highlighting-enabled': otsConfig.enableTodayHighlighting,
			'data-incomplete-day-highlighting-enabled': otsConfig.enableIncompleteDayHighlighting
		});
	}


	$(function() {
		var config = $('#ots-config').data('ots-config');

		addHeader(config.optionsUrl);

		// Obtain DOM elements and Telerik components on page
		var $cal = $('#cal'),
			cal = $cal.data('tCalendar'),
			$weekGrid = $('#weekgrid'),
			weekGrid = $weekGrid.data('tGrid'),
			$favTab = $('#favTab');

		writeConfigToDom(config);

		// Disable calendar animation. It looks nicer and saves us from trying to detect when it has finished.
		cal.stopAnimation = true;

		if (config.enableFavouritesFiltering)
			enableFavouritesFiltering($favTab);
		if (config.enableIncompleteDayHighlighting || config.enableTodayHighlighting)
			fixCalendarClasses($cal, $weekGrid);
		if (config.enableIncompleteDayHighlighting)
			enableIncompleteDayHighlighting($cal, cal, $weekGrid, config.includeFutureDays);
		if (config.enableWeekGridClicking)
			enableWeekGridClicking($cal, cal, $weekGrid, weekGrid, config.allowMonthChange);
		if (config.enableTodayHighlighting)
			enableTodayHighlighting($cal, cal, $weekGrid);
	});

}(jQuery));

