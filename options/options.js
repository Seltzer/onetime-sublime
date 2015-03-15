document.addEventListener('DOMContentLoaded', function() {
	var
		todayHighlightingCb = document.getElementById('today-highlighting-cb'),
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		weekGridClickingCb = document.getElementById('week-grid-clicking-cb'),
		incompleteDaysHighlightingCb = document.getElementById('incomplete-days-highlighting-cb');

	restoreOptions();

	todayHighlightingCb.onclick = persistOptions;
	favsFilteringCb.onclick = persistOptions;
	weekGridClickingCb.onclick = persistOptions;
	incompleteDaysHighlightingCb.onclick = persistOptions;
	
	function restoreOptions() {
		chrome.storage.sync.get({
			enableTodayHighlighting: true,
			enableFavouritesFiltering: true,
			enableWeekGridClicking: true,
			enableIncompleteDaysHighlighting: true
		}, function (config) {
			todayHighlightingCb.checked = config.enableTodayHighlighting;
			favsFilteringCb.checked = config.enableFavouritesFiltering;
			weekGridClickingCb.checked = config.enableWeekGridClicking;
			incompleteDaysHighlightingCb.checked = config.enableIncompleteDaysHighlighting;
		});
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableTodayHighlighting: todayHighlightingCb.checked,
			enableFavouritesFiltering: favsFilteringCb.checked,
			enableWeekGridClicking: weekGridClickingCb.checked,
			enableIncompleteDaysHighlighting: incompleteDaysHighlightingCb.checked
		});
	}
});


