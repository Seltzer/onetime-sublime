document.addEventListener('DOMContentLoaded', function() {
	var
		todayHighlightingCb = document.getElementById('today-highlighting-cb'),
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		weekGridClickingCb = document.getElementById('week-grid-clicking-cb'),
		incompleteDayHighlightingCb = document.getElementById('incomplete-day-highlighting-cb'),
		includeFutureDaysCb = document.getElementById('include-future-days-cb'),
		allowMonthChangeCb = document.getElementById('allow-month-change-cb'),
		textWrappingCb = document.getElementById('text-wrapping-cb'),
		allCb = [todayHighlightingCb, favsFilteringCb, weekGridClickingCb, incompleteDayHighlightingCb, 
				includeFutureDaysCb, allowMonthChangeCb, textWrappingCb];

	restoreOptions();

	for (var i = 0; i < allCb.length; i++)
		allCb[i].onclick = persistOptions;

	
	function restoreOptions() {
		chrome.storage.sync.get({
			// TODO: This is duplicated elsewhere. Annoying.
			enableTodayHighlighting: true,
			enableFavouritesFiltering: true,
			enableWeekGridClicking: true,
			enableIncompleteDayHighlighting: true,
			includeFutureDays: false,
			allowMonthChange: false,
			enableTableTextWrapping: false
		}, function (config) {
			todayHighlightingCb.checked = config.enableTodayHighlighting;
			favsFilteringCb.checked = config.enableFavouritesFiltering;
			weekGridClickingCb.checked = config.enableWeekGridClicking;
			incompleteDayHighlightingCb.checked = config.enableIncompleteDayHighlighting;
			includeFutureDaysCb.checked = config.includeFutureDays;
			allowMonthChangeCb.checked = config.allowMonthChange;
			textWrappingCb.checked = config.enableTableTextWrapping;
		});
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableTodayHighlighting: todayHighlightingCb.checked,
			enableFavouritesFiltering: favsFilteringCb.checked,
			enableWeekGridClicking: weekGridClickingCb.checked,
			enableIncompleteDaysHighlighting: incompleteDayHighlightingCb.checked,
			includeFutureDays: includeFutureDaysCb.checked,
			allowMonthChange: allowMonthChangeCb.checked,
			enableTableTextWrapping: textWrappingCb.checked
		});
	}
});


