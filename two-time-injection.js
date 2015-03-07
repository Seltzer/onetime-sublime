(function($) {
    function enableWeekGridClicking(calendar, $weekGrid, weekGrid) {
	$weekGrid.delegate('table:eq(1) > tbody > tr', 'click', function() {
	    var $tr = $(this),//.closest('tr'),
		dayIndex = $tr.index(),
		boundDateTime = weekGrid.data[dayIndex].weekDateTime;

	    calendar.value(boundDateTime);
	});
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

    
    function enableTodayHighlighting($calendar, calendar) {
	var doIt = highlightToday.bind(this, $calendar, calendar);
	
	$calendar.bind('navigate change', doIt);
	$('#DatePicker').change(doIt);
	doIt();
    }


    function enableFavouritesFiltering($favTab) {
	var $li = $('<li class="favourites-filter"></li>')
	    .appendTo($favTab.find('ul.t-tabstrip-items'));

	$('<input type="search" placeholder="Type here to filter" />')
	    .appendTo($li)
	    // Using 'keyup' as 'keypress' ignores backspace. 'search' is fired when the user presses <ret> or clicks the X.
	    .bind('keyup change blur mousedown search', function(event) {
		var text = $(this).val().trim(),
		    $rows = $favTab.find('.t-grid-content table tbody tr');
		
		$rows.show();

		if (text)
		    $rows.filter(function() { return !contains($(this).text(), text); }).hide();
	    });

	function contains(text, substring) {
	    return text.toLowerCase().indexOf(substring.toLowerCase()) !== -1;
	};
    }
	

    $(function() {
	var $cal = $('#cal'),
	    cal = $cal.data('tCalendar'),
	    $weekGrid = $('#weekgrid'),
	    weekGrid = $weekGrid.data('tGrid'),
	    $favTab = $('#favTab');

	enableWeekGridClicking(cal, $weekGrid, weekGrid);
	enableTodayHighlighting($cal, cal);
	enableFavouritesFiltering($favTab);
    });
}(jQuery));

