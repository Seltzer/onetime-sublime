document.addEventListener('DOMContentLoaded', function() {
	var
		todayHighlightingCb = document.getElementById('today-highlighting-cb'),
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		weekGridClickingCb = document.getElementById('week-grid-clicking-cb'),
		incompleteDayHighlightingCb = document.getElementById('incomplete-day-highlighting-cb'),
		includeFutureDaysCb = document.getElementById('include-future-days-cb');

	restoreOptions();

	// Yuck
	todayHighlightingCb.onclick = persistOptions;
	favsFilteringCb.onclick = persistOptions;
	weekGridClickingCb.onclick = persistOptions;
	incompleteDayHighlightingCb.onclick = persistOptions;
	includeFutureDaysCb.onclick = persistOptions;
	
	function restoreOptions() {
		chrome.storage.sync.get({
			enableTodayHighlighting: true,
			enableFavouritesFiltering: true,
			enableWeekGridClicking: true,
			enableIncompleteDayHighlighting: true,
			includeFutureDays: false
		}, function (config) {
			todayHighlightingCb.checked = config.enableTodayHighlighting;
			favsFilteringCb.checked = config.enableFavouritesFiltering;
			weekGridClickingCb.checked = config.enableWeekGridClicking;
			incompleteDayHighlightingCb.checked = config.enableIncompleteDayHighlighting;
			includeFutureDaysCb.checked = config.includeFutureDays;
		});
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableTodayHighlighting: todayHighlightingCb.checked,
			enableFavouritesFiltering: favsFilteringCb.checked,
			enableWeekGridClicking: weekGridClickingCb.checked,
			enableIncompleteDaysHighlighting: incompleteDayHighlightingCb.checked,
			includeFutureDays: includeFutureDaysCb.checked
		});
	}
});


