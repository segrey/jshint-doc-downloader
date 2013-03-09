
var util = require('./util'),
    request = require('request');

function downloadHtmlPage(callback) {
    var url = 'http://jshint.com/docs/';
    request({ uri: url }, function (error, response, body) {
        if (error && response.statusCode !== 200) {
            callback('Error when contacting ' + url, null);
        }
        else {
            callback(null, body);
        }
    });
}

downloadHtmlPage(function(error, body) {
    if (body !== null) {
        util.saveJsHintDocHtmlFile(body);
    }
});
