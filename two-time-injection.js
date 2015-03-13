(function($) {
	/**
	 * Returns nested arrays, where the outer array corresponds to weeks and the inner to days starting with Monday
	 */
	function getWeeksInDisplayedCalendar($calendar, calendar) {
		var firstDayOfCurrentMonth = calendar.viewedMonth.toDate(),
			$mondays = $calendar.find('table tbody tr td:first-child');

		return $.map($mondays, function (monday) {
			var $monday = $(monday),
				$weekDays = $monday.add($monday.nextAll());

			return $.map($weekDays, function (wd) {
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


	function enableWeekGridClicking(calendar, $weekGrid, weekGrid) {
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

				if (isThisMonth)
					$tr.click(function() { calendar.value(boundDateTime); });
			});
		}
	}


	function highlightToday($calendar, calendar) {
		var todayDate = new Date(),
			weeksInDisplayedCalendar = getWeeksInDisplayedCalendar($calendar, calendar),
			// Flatten weeksInDisplayedCalendar to get days
			days = Array.prototype.concat.apply([], weeksInDisplayedCalendar);

		for (var i = 0; i < days.length; i++) {
			var day = days[i],
				date = day.date;

			if (date.getYear() === todayDate.getYear() && date.getMonth() === todayDate.getMonth() 
					&& date.getDate() === todayDate.getDate()) {
				day.$td.addClass('today');				
			}
		}
	}

	
	function enableTodayHighlighting($calendar, calendar, $weekGrid) {
		var doIt = highlightToday.bind(this, $calendar, calendar);
	
		$calendar.bind('navigate change', doIt);
		$weekGrid.bind('dataBound', doIt);
		doIt();
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


	$(function() {
		// Obtain DOM elements and Telerik components on page
		var $cal = $('#cal'),
			cal = $cal.data('tCalendar'),
			$weekGrid = $('#weekgrid'),
			weekGrid = $weekGrid.data('tGrid'),
			$favTab = $('#favTab');

		var config = $('#two-time-config').data('two-time-config');

		if (config.enableWeekdayClicking)
			enableWeekGridClicking(cal, $weekGrid, weekGrid);
		if (config.enableTodayHighlighting)
			enableTodayHighlighting($cal, cal, $weekGrid);
		if (config.enableFavouritesFiltering)
			enableFavouritesFiltering($favTab);

		// highlightIncompleteDays($cal, cal);
	});
}(jQuery));

