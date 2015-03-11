(function($) {
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


	/**
	 * This function is basically a hack to find the td element (if any) in the calendar which corresponds to today 
	 */
	function highlightToday($calendar, calendar) {
		var today = new Date(),
			todayDay = today.getDay() + 1;    // Because JS is hilarious

		// We expect 1-2 candidate days, based on day number comparison; one from the current month, and possibly one from the previous/next
		var $candidateDays = $calendar.find('table tbody td').filter(function() { return $(this).find('a.t-link').text() == todayDay; });

		// Now let's pay attention to month, bearing in mind that the calendar displays up to 3 months at once
		var $todayTd = $candidateDays.filter(function() { 
			var isThisMonth = !$(this).hasClass('t-other-month'),
				monthOffset = today.getMonth() - calendar.viewedMonth.month();

			return (monthOffset === 0 && isThisMonth)
				|| (monthOffset === 1 && todayDay < 15 && !isThisMonth)
				|| (monthOffset === -1 && todayDay > 15 && !isThisMonth);
		});
	
		$todayTd.addClass('today').addClass('today');
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
	});
}(jQuery));

