var jsdom = require('jsdom'),
    fs = require('fs'),
    join = require('path').join,
    jquery = fs.readFileSync(join(__dirname, '../lib/jquery-1.9.1.js')).toString(),
    optionModel = require('./optionModel'),
    util = require('./util'),
    groupDescriptions = {
        'Enforcing options' : 'These options tell JSHint to be more strict towards your code. Use them if you want' +
            ' to allow only a safe subset of JavaScript—very useful when your codebase is shared' +
            ' with a big number of developers with different skill levels.',
        'Relaxing options' : 'These options allow you to suppress certain types of warnings. Use them only if you' +
            ' are absolutely positive that you know what you are doing.'
    };


function buildOptionDocHtmlString(tdDoc) {
    var first = tdDoc.children().first().filter('p');
    var wholeHtml = tdDoc.html().trim();
    if (first.length > 0) {
        var firstParaInnerHtml = first.html();
        var firstParaOuterHtml = '<p>' + firstParaInnerHtml + '</p>';
        if (tdDoc.children().length === 1) {
            return firstParaInnerHtml;
        }
        var fixedHtml = wholeHtml.replace(firstParaOuterHtml, firstParaInnerHtml);
        if (fixedHtml === wholeHtml) {
            throw Error('No actual replacement!');
        }
        return fixedHtml;
    }
    return wholeHtml;
}

function parse(body) {
    jsdom.env({
        html: body,
        src: [jquery],
        done: function (errors, window) {
            var $ = window.$;
            var groups = [];
            $('.options.table.table-bordered.table-striped').each(function() {
                var table = $(this);
                var p = table.prev();
                var h4 = null;
                if (p.is('p')) {
                    h4 = p.prev();
                }
                else {
                    h4 = p;
                    p = null;
                }
                if (h4 == null || !h4.is('h4')) {
                    return;
                }
                var group = optionModel.createGroup(h4.text(), p != null ? p.html() : groupDescriptions[h4.text()]);
                if (group.title === 'Directives') {
                    return;
                }
                table.children('tr').each(function() {
                    var tdElement = $(this);
                    var optionNameTdElement = tdElement.children('td.name').first();
                    if (optionNameTdElement.length > 0) {
                        var optionName = optionNameTdElement.attr('id');
                        if (optionName.trim().length > 0) {
                            var tdDoc = tdElement.children('td[class!=name]');
                            var optionDescription = buildOptionDocHtmlString(tdDoc);
                            group.addOption(optionName, optionDescription);
                        }
                    }
                });
                groups.push(group);
            });
            var xml = util.toXml(groups);
            var outputStream = fs.createWriteStream(join(__dirname, '../data/jshint-documentation.xml'));
            outputStream.end(xml);
            outputStream.destroy();
            console.log(xml);
        }
    });
}

(function() {
  var optionsHtmlFilePath = util.getOptionsHtmlFilePath();
  console.log("Reading " + optionsHtmlFilePath + "...");
  parse(util.readJSHintDocHtmlFileContent());
}());
