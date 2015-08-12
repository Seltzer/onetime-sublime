document.addEventListener('DOMContentLoaded', function() {
	var
		favsFilteringCb = document.getElementById('favs-filtering-cb'),
		findIncompleteCb = document.getElementById('find-incomplete-cb'),
		incompleteDayHighlightingCb = document.getElementById('incomplete-day-highlighting-cb'),
		includeFutureDaysCb = document.getElementById('include-future-days-cb'),
		textWrappingCb = document.getElementById('text-wrapping-cb'),
		debugModeCb = document.getElementById('debug-mode-cb'),
		refreshPrompt = document.getElementById('refresh-prompt');

	// Get config and initialise checkboxes accordingly
	restoreOptions();

	// Set up checkbox event handling
	var allCb = document.getElementsByTagName('input');
	
	for (var i = 0; i < allCb.length; i++) 
		allCb[i].onclick = function() {
			this.setAttribute('data-actual-value', this.checked);

			persistOptions();

			refreshPrompt.className = "";
		};


	
	function restoreOptions() {
		chrome.storage.sync.get(null, function (config) {
			// TODO: The config defaulting below is duplicated elsewhere. Annoying.
			initCheckbox(favsFilteringCb, config.enableFavouritesFiltering, true);
			initCheckbox(findIncompleteCb, config.enableFindIncompleteButton, true);
			initCheckbox(incompleteDayHighlightingCb, config.enableIncompleteDayHighlighting, true);
			initCheckbox(includeFutureDaysCb, config.includeFutureDays, false);			
			initCheckbox(textWrappingCb, config.enableTableTextWrapping, false);
			initCheckbox(debugModeCb, config.enableDebugMode, false);
		});

		

		/**
		 * Initialise checkbox based on nullable bool config
		 */
		function initCheckbox(cb, value, defaultValue) {
			// We expect value to be true/false if it has ever been explicitly set by the user, and 
			// null/undefined otherwise. Just in case it isn't, we coerce it to bool to be safe.
			cb.checked = value != null ? !!value : defaultValue;
			cb.setAttribute('data-actual-value', value != null ? !!value : null);
		}
	}


	function persistOptions() {
		chrome.storage.sync.set({
			enableFavouritesFiltering: getActualValue(favsFilteringCb),
			enableFindIncompleteButton: getActualValue(findIncompleteCb),
			enableIncompleteDayHighlighting: getActualValue(incompleteDayHighlightingCb),
			includeFutureDays: getActualValue(includeFutureDaysCb),
			enableTableTextWrapping: getActualValue(textWrappingCb),
			enableDebugMode: getActualValue(debugModeCb)
			
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


