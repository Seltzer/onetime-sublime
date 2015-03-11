(function() {
	chrome.storage.sync.get(null, function (config) {
		// Inject div whose purpose is to communicate extension config to below injected JS.
		var configDiv = document.createElement('div');
		configDiv.id = "two-time-config";
		configDiv.setAttribute('data-two-time-config', JSON.stringify(config));
		document.body.appendChild(configDiv);

		// Inject two-time JS into the OneTime DOM and kick everything off
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', chrome.extension.getURL('two-time-injection.js'));
		document.body.appendChild(script);
	});
}());
