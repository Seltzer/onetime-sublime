(function($) {
    function enableWeekGridClicking(calendar, $weekGrid, weekGrid) {
	$weekGrid.delegate('table:eq(1) > tbody > tr > td:nth-child(1), td:nth-child(2) > label', 'click', function() {
	    var $tr = $(this).closest('tr'),
		dayIndex = $tr.index(),
		boundDateTime = weekGrid.data[dayIndex].weekDateTime;

	    cal.value(boundDateTime);
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
	

    $(function() {
	var $cal = $('#cal'),
	    cal = $cal.data('tCalendar'),
	    $weekGrid = $('#weekgrid'),
	    weekGrid = $weekGrid.data('tGrid');

	enableWeekGridClicking(cal, $weekGrid, weekGrid);

	enableTodayHighlighting($cal, cal);
    });
}(jQuery));

