document.addEventListener('DOMContentLoaded', function() {
	var
		todayHighlightingCb = document.getElementById('today-highlighting-cb'),
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		weekdayClickingCb = document.getElementById('weekday-clicking-cb'),
		highlightIncompleteDaysCb = document.getElementById('highlight-incomplete-days');

	restoreOptions();

	todayHighlightingCb.onclick = persistOptions;
	favsFilteringCb.onclick = persistOptions;
	weekdayClickingCb.onclick = persistOptions;
	highlightIncompleteDaysCb.onclick = persistOptions;
	
	function restoreOptions() {
		chrome.storage.sync.get({
			enableTodayHighlighting: true,
			enableFavouritesFiltering: true,
			enableWeekdayClicking: true,
			highlightIncompleteDays: true
		}, function (config) {
			todayHighlightingCb.checked = config.enableTodayHighlighting;
			favsFilteringCb.checked = config.enableFavouritesFiltering;
			weekdayClickingCb.checked = config.enableWeekdayClicking;
			highlightIncompleteDaysCb.checked = config.highlightIncompleteDays;
		});
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableTodayHighlighting: todayHighlightingCb.checked,
			enableFavouritesFiltering: favsFilteringCb.checked,
			enableWeekdayClicking: weekdayClickingCb.checked,
			highlightIncompleteDays: highlightIncompleteDaysCb.checked
		});
	}
});


