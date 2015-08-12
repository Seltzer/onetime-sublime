(function() {
	chrome.storage.sync.get(null, function (config) {
		applyDefaults(config);
			
		// Inject div whose purpose is to communicate extension config to below injected JS.
		config.optionsUrl = chrome.extension.getURL('options/options.html');

		var configDiv = document.createElement('div');
		configDiv.id = 'ots-config';
		configDiv.setAttribute('data-ots-config', JSON.stringify(config));
		document.body.appendChild(configDiv);

		// Inject Underscore JS, provided OneTime hasn't already done so.
		if (typeof(_) === 'undefined')
			inject('lib/underscore-min.js');

		// Inject OTS scripts
		inject(config.enableDebugMode ? 'core.js' : 'core.min.js');
		inject(config.enableDebugMode ? 'mod.js' : 'mod.min.js');
	});


	/**
	 * Mutates the specified config by applying default values for config keys which aren't set.
	 */
	function applyDefaults(config) {
		// TODO: These config defaults exist elsewhere (in options.js). Annoying.
		apply('enableFavouritesFiltering', true);
		apply('enableFindIncompleteButton', true);
		apply('enableIncompleteDayHighlighting', true);
		apply('includeFutureDays', false);
		apply('enableTableTextWrapping', false);
		apply('enableDebugMode', false); 

		function apply(prop, defaultValue) {
			// We're deliberately allowing type coercion between null/undefined here.
			if (config[prop] == null)
				config[prop] = defaultValue;
		}
	}
	

	function inject(jsPath) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = chrome.extension.getURL(jsPath);
		script.async = false;

		document.body.appendChild(script);
	}
}());
