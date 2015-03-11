document.addEventListener('DOMContentLoaded', function() {
	var
		todayHighlightingCb = document.getElementById('today-highlighting-cb'),
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		weekdayClickingCb = document.getElementById('weekday-clicking-cb');

	restoreOptions();

	todayHighlightingCb.onclick = persistOptions;
	favsFilteringCb.onclick = persistOptions;
	weekdayClickingCb.onclick = persistOptions;
	

	function restoreOptions() {
		chrome.storage.sync.get({
			enableTodayHighlighting: true,
			enableFavouritesFiltering: true,
			enableWeekdayClicking: true
		}, function (config) {
			todayHighlightingCb.checked = config.enableTodayHighlighting;
			favsFilteringCb.checked = config.enableFavouritesFiltering;
			weekdayClickingCb.checked = config.enableWeekdayClicking;
		});
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableTodayHighlighting: todayHighlightingCb.checked,
			enableFavouritesFiltering: favsFilteringCb.checked,
			enableWeekdayClicking: weekdayClickingCb.checked
		});
	}
});


