var fs = require('fs'),
    join = require('path').join,
    pathToJSHintDocHtml = join(__dirname, '../data/jshint-docs.html'),
    jade = require('jade');

exports.saveJsHintDocHtmlFile = function(content) {
    var writeStream = fs.createWriteStream(
        pathToJSHintDocHtml,
        { flags: 'w' }
    );
    writeStream.end(content);
};

exports.readJSHintDocHtmlFileContent = function() {
    return fs.readFileSync(pathToJSHintDocHtml).toString();
};

exports.toXml = function(groups) {
    var jadePath = join(__dirname, 'groups.jade');
    var jadeContent = fs.readFileSync(jadePath).toString();
    var fn = jade.compile(jadeContent, {pretty: true});
    return fn({groups:groups});
};
