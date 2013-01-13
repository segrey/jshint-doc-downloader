var jsdom = require('jsdom'),
    fs = require('fs'),
    jquery = fs.readFileSync("./lib/jquery-1.8.3.js").toString(),
    optionModel = require("./optionModel.js"),
    util = require("./util");

function isValidIndexToReplaceWithTag(index, html, tag) {
    var startIndex, endIndex = 0;
    while (endIndex >= 0) {
        startIndex = html.indexOf("<" + tag + ">", endIndex);
        if (startIndex < 0 || index < startIndex) {
            break;
        }
        endIndex = html.indexOf("</" + tag + ">", startIndex);
        if (endIndex >= 0 && index < endIndex) {
            return false;
        }
    }
    return true;
}

function isValidIndexToReplace(index, html) {
    if (isValidIndexToReplaceWithTag(index, html, 'pre')) {
        if (isValidIndexToReplaceWithTag(index, html, 'code')) {
            return true;
        }
    }
    return false;
}

function replaceOneCharWithSpace(html, replaceSymbols) {
    for (var i = 0; i < replaceSymbols.length; i++) {
        var replaceSymbolCode = replaceSymbols.charCodeAt(i);
        for (var j = 0; j < html.length; j++) {
            var htmlCharCode = html.charCodeAt(j);
            if (htmlCharCode === replaceSymbolCode) {
                if (isValidIndexToReplace(j, html)) {
                    return html.substring(0, j) + ' ' + html.substring(j + 1);
                }
            }
        }
    }
    return null;
}

function replaceSymbolsWithSpace(html, replaceSymbols) {
    var nextHtml = html;
    while (nextHtml !== null) {
        html = nextHtml;
        nextHtml = replaceOneCharWithSpace(html, replaceSymbols);
    }
    return html;
}

function replaceMultipleSpacesWithOne(html) {
    var text,
        text2 = html;
    do {
        text = text2;
        var doubleSpaceIndex = text.indexOf('  ');
        if (doubleSpaceIndex >= 0) {
            if (isValidIndexToReplace(doubleSpaceIndex, text)) {
                text2 = text.substring(0, doubleSpaceIndex) + text.substring(doubleSpaceIndex + 1);
            }
        }
    } while (text2 !== text);
    return text2;
}

function refine(html) {
    var withSpaces = replaceSymbolsWithSpace(html, '\n\r\t');
    var withOneSpace = replaceMultipleSpacesWithOne(withSpaces);
    return withOneSpace.trim();
}


exports.refine = refine;

function dumpToHtml(groups) {
    var outputStream = fs.createWriteStream("./data/dump.html");
    outputStream.write("<html>\n");
    outputStream.write("<body>\n");
    groups.forEach(function(group) {
        outputStream.write("<div title='" + group.title + "'>\n");
        outputStream.write("  <description>\n");
        outputStream.write("    <original>\n");
        outputStream.write(group.description + "\n");
        outputStream.write("    </original>\n");
        outputStream.write("    <modified>\n");
        outputStream.write(refine(group.description) + "\n");
        outputStream.write("    </modified>\n");
        var options = group.options;
        for (var optionName in options) {
            if (options.hasOwnProperty(optionName)) {
                outputStream.write("    <option name='" + optionName + "'>\n");
                outputStream.write(options[optionName] + '\n');
                outputStream.write("<!-- refined -->\n");
                outputStream.write(refine(options[optionName]) + '\n');
                outputStream.write('    </option>\n');
            }
        }
        outputStream.write("  </description>\n");
        outputStream.write("</div>\n");
    });
    outputStream.write("</body>");
    outputStream.write("</html>");
}

function replaceHtmlEntities(html) {
    return html.split('&nbsp;').join('&#x00A0;');
}

function buildOptionDocHtmlString(optionName, tdDoc) {
    var first = tdDoc.children().first().filter('p');
    if (first.length > 0) {
        if (tdDoc.children().length === 1) {
            return first.html();
        }
        first.children().unwrap();
    }
    return tdDoc.html();
}

function parse(body) {
    jsdom.env({
        html: body,
        src: [jquery],
        done: function (errors, window) {
            var $ = window.$;
            var groups = [];
            $('.options-docs:first > h2 + p').each(function() {
                var p = $(this);
                var h2 = p.prev();
                var group = optionModel.createGroup(h2.text(), p.html());
                p.next("table.zebra-striped").children("tbody").children("tr").each(function() {
                    var tdElement = $(this);
                    var optionName = tdElement.children("td.name").children("code").first().text();
                    var tdDoc = tdElement.children("td[class!=name]");
                    var optionDescription = buildOptionDocHtmlString(optionName, tdDoc);
                    group.addOption(optionName, optionDescription);
                });
                groups.push(group);
            });
//            dumpToHtml(groups);
            var xml = util.toXml(groups);
            var outputStream = fs.createWriteStream("./data/jshint-documentation.xml");
//            outputStream.write('<!-- Generated by https://github.com/segrey/jshint-doc-downloader -->\n');
            outputStream.end(xml);
            outputStream.destroy();
            console.log(xml);
        }
    });
}

parse(util.readJSHintDocHtmlFileContent());
