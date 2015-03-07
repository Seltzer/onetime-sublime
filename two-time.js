(function() {
    // Inject two-time-injection.js
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', chrome.extension.getURL('two-time-injection.js'));
    document.body.appendChild(script);
}());
