(function($) {
    function enableWeekGridClicking() {
	var $cal = $('#cal'),
	    cal = $cal.data('tCalendar'),
	    $weekGrid = $('#weekgrid'),
	    weekGrid = $weekGrid.data('tGrid');
	    
	$weekGrid.delegate('table > tbody > tr > td:nth-child(1), td:nth-child(2) > label', 'click', function() {
	    var $tr = $(this).closest('tr'),
		dayIndex = $tr.index(),
		boundDateTime = weekGrid.data[dayIndex].weekDateTime;

	    cal.value(boundDateTime);
	});
    }
	

    $(function() {
	enableWeekGridClicking();
    });
}(jQuery));

