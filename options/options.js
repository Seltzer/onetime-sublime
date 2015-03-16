document.addEventListener('DOMContentLoaded', function() {
	var
		todayHighlightingCb = document.getElementById('today-highlighting-cb'),
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		weekGridClickingCb = document.getElementById('week-grid-clicking-cb'),
		incompleteDayHighlightingCb = document.getElementById('incomplete-day-highlighting-cb');

	restoreOptions();

	todayHighlightingCb.onclick = persistOptions;
	favsFilteringCb.onclick = persistOptions;
	weekGridClickingCb.onclick = persistOptions;
	incompleteDayHighlightingCb.onclick = persistOptions;
	
	function restoreOptions() {
		chrome.storage.sync.get({
			enableTodayHighlighting: true,
			enableFavouritesFiltering: true,
			enableWeekGridClicking: true,
			enableIncompleteDayHighlighting: true
		}, function (config) {
			todayHighlightingCb.checked = config.enableTodayHighlighting;
			favsFilteringCb.checked = config.enableFavouritesFiltering;
			weekGridClickingCb.checked = config.enableWeekGridClicking;
			incompleteDayHighlightingCb.checked = config.enableIncompleteDayHighlighting;
		});
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableTodayHighlighting: todayHighlightingCb.checked,
			enableFavouritesFiltering: favsFilteringCb.checked,
			enableWeekGridClicking: weekGridClickingCb.checked,
			enableIncompleteDaysHighlighting: incompleteDayHighlightingCb.checked
		});
	}
});


