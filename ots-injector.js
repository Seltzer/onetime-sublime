(function() {
	// TODO: This is duplicated elsewhere. Annoying.
	var defaultOtsConfig = {
		enableTodayHighlighting: true,
		enableFavouritesFiltering: true,
		enableWeekGridClicking: true,
		allowMonthChange: false,
		enableIncompleteDayHighlighting: true,
		includeFutureDays: false,
		enableTableTextWrapping: false
	};
	
	chrome.storage.sync.get(defaultOtsConfig, function (config) {
		// Inject div whose purpose is to communicate extension config to below injected JS.
		config.optionsUrl = chrome.extension.getURL('options/options.html');

		var configDiv = document.createElement('div');
		configDiv.id = "ots-config";
		configDiv.setAttribute('data-ots-config', JSON.stringify(config));
		document.body.appendChild(configDiv);

		// Inject Underscore JS
		if (typeof(_) === 'undefined')
			inject('lib/underscore-min.js');

		// Inject OTS scripts
		inject('core.js');
		inject('mod.js');
	});


	function inject(jsPath) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = chrome.extension.getURL(jsPath);
		script.async = false;

		document.body.appendChild(script);
	}
}());
