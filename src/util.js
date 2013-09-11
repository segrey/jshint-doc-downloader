var fs = require('fs'),
  join = require('path').join,
  optionsHtmlFilePath = join(__dirname, '../data/jshint-docs-options.html'),
  jade = require('jade');

function saveOptionsHtmlFile(content) {
  writeFile(optionsHtmlFilePath, content);
}

function writeFile(filePath, content) {
  var writeStream = fs.createWriteStream(filePath, { flags: 'w' });
  writeStream.end(content);
}

function readFileContentSync(filePath) {
  return fs.readFileSync(filePath).toString();
}

function getOptionsHtmlFilePath() {
  return optionsHtmlFilePath;
}

exports.readJSHintDocHtmlFileContent = function () {
  return fs.readFileSync(optionsHtmlFilePath).toString();
};


exports.toXml = function (groups) {
  var jadePath = join(__dirname, 'groups.jade');
  var jadeContent = fs.readFileSync(jadePath).toString();
  var fn = jade.compile(jadeContent, {pretty: true});
  return fn({groups: groups});
};

function isValidIndexToReplaceWithTag(index, html, tag) {
  var startIndex, endIndex = 0;
  while (endIndex >= 0) {
    startIndex = html.indexOf('<' + tag + '>', endIndex);
    if (startIndex < 0 || index < startIndex) {
      break;
    }
    endIndex = html.indexOf('</' + tag + '>', startIndex);
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
exports.writeOptionsHtmlFile = saveOptionsHtmlFile;
exports.writeFile = writeFile;
exports.readFileContentSync = readFileContentSync;
exports.getOptionsHtmlFilePath = getOptionsHtmlFilePath;
