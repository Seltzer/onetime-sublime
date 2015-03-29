document.addEventListener('DOMContentLoaded', function() {
	var
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		weekGridClickingCb = document.getElementById('week-grid-clicking-cb'),
		allowMonthChangeCb = document.getElementById('allow-month-change-cb'),
		incompleteDayHighlightingCb = document.getElementById('incomplete-day-highlighting-cb'),
		includeFutureDaysCb = document.getElementById('include-future-days-cb'),
		todayHighlightingCb = document.getElementById('today-highlighting-cb'),
		textWrappingCb = document.getElementById('text-wrapping-cb');

	// Get config and initialise checkboxes accordingly
	restoreOptions();

	// Set up checkbox event handling
	var allCb = document.getElementsByTagName('input');
	
	for (var i = 0; i < allCb.length; i++) 
		allCb[i].onclick = function() {
			this.setAttribute('data-actual-value', this.checked);

			persistOptions();
		};


	
	function restoreOptions() {
		chrome.storage.sync.get({
			enableFavouritesFiltering: null,
			enableWeekGridClicking: null,
			allowMonthChange: null,
			enableIncompleteDayHighlighting: null,
			includeFutureDays: null,
			enableTodayHighlighting: null,
			enableTableTextWrapping: null
		}, function (config) {
			// TODO: The config defaulting below is duplicated elsewhere. Annoying.
			initCheckbox(favsFilteringCb, config.enableFavouritesFiltering, true);
			initCheckbox(weekGridClickingCb, config.enableWeekGridClicking, true);
			initCheckbox(allowMonthChangeCb, config.allowMonthChange, false);
			initCheckbox(incompleteDayHighlightingCb, config.enableIncompleteDayHighlighting, true);
			initCheckbox(includeFutureDaysCb, config.includeFutureDays, false);			
			initCheckbox(todayHighlightingCb, config.enableTodayHighlighting, true);
			initCheckbox(textWrappingCb, config.enableTableTextWrapping, false);
		});

		

		/**
		 * Initialise checkbox based on nullable bool config
		 */
		function initCheckbox(cb, value, defaultValue) {
			// We expect value to be true/false/null and nothing else. Just in case it isn't, we coerce it to be safe.
			cb.checked = value !== null ? !!value : defaultValue;
			cb.setAttribute('data-actual-value', value !== null ? !!value : null);
		}
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableFavouritesFiltering: getActualValue(favsFilteringCb),
			enableWeekGridClicking: getActualValue(weekGridClickingCb),
			allowMonthChange: getActualValue(allowMonthChangeCb),
			enableIncompleteDayHighlighting: getActualValue(incompleteDayHighlightingCb),
			includeFutureDays: getActualValue(includeFutureDaysCb),
			enableTodayHighlighting: getActualValue(todayHighlightingCb),
			enableTableTextWrapping: getActualValue(textWrappingCb)
		});

		
		function getActualValue(cb) {
			var valueAsString = cb.getAttribute('data-actual-value');

			// Ugh! We wouldn't have to do any of this string coercion if we had jQuery
			if (valueAsString === 'true')
				return true;
			else if (valueAsString === 'false')
				return false;
			else
				return null;
		}
	}
});


