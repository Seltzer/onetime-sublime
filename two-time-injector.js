(function() {
	chrome.storage.sync.get(null, function (config) {
		// Inject div whose purpose is to communicate extension config to below injected JS.
		var configDiv = document.createElement('div');
		configDiv.id = "two-time-config";
		configDiv.setAttribute('data-two-time-config', JSON.stringify(config));
		document.body.appendChild(configDiv);

		// Inject Underscore JS
		if (typeof(_) === 'undefined')
			inject('lib/underscore-min.js');

		// Inject TwoTime scripts
		inject('core.js');
		inject('mod.js');
	});


	function inject(jsPath) {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', chrome.extension.getURL(jsPath));
		document.body.appendChild(script);
	}
}());
