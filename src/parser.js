var jsdom = require('jsdom'),
  fs = require('fs'),
  join = require('path').join,
  jquery = fs.readFileSync(join(__dirname, '../lib/jquery-1.9.1.js')).toString(),
  optionModel = require('./optionModel'),
  util = require('./util'),
  groupDescriptions = {
    'Enforcing options': 'These options tell JSHint to be more strict towards your code. Use them if you want' +
      ' to allow only a safe subset of JavaScript—very useful when your codebase is shared' +
      ' with a big number of developers with different skill levels.',
    'Relaxing options': 'These options allow you to suppress certain types of warnings. Use them only if you' +
      ' are absolutely positive that you know what you are doing.'
  };


function buildOptionDocHtmlString($optionDocTd) {
  var firstChild = $optionDocTd.children().first();
  var wholeHtml = $optionDocTd.html().trim();
  if (firstChild.is('p')) {
    var firstParaInnerHtml = firstChild.html();
    var firstParaOuterHtml = '<p>' + firstParaInnerHtml + '</p>';
    if ($optionDocTd.children().length === 1) {
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

function buildGroups($) {
  var groups = [];
  $('table.options.table.table-bordered.table-striped').each(function () {
    var table = $(this);
    var $description = table.prev();
    if (!$description.is('p')) {
      throw Error('Paragraph was expected');
    }
    var $title = $description.prev();
    if (!$title.is('p')) {
      $title = $description;
      $description = null;
    }
    var title = $title.text();
    var description = $description != null ? $description.html() : groupDescriptions[title];
    if (!description) {
      throw Error("No description for " + title);
    }
    var group = optionModel.createGroup(title, description);
    table.children('tr').each(function () {
      var $tr = $(this);
      var $optionNameTd = $tr.children('td.name');
      if ($optionNameTd.length !== 1) {
        throw Error('Option name not found');
      }
      var optionName = $optionNameTd.attr('id');
      if (optionName.trim().length > 0) {
        var $optionDocTd = $tr.children('td[class!=name]');
        if ($optionDocTd.length !== 1) {
          throw Error('Option doc not found');
        }
        var optionDescription = buildOptionDocHtmlString($optionDocTd);
        group.addOption(optionName, optionDescription);
      }
    });
    groups.push(group);
  });
  return groups;
}
function parse(body) {
  jsdom.env({
    html: body,
    src: [jquery],
    done: function (errors, window) {
      var groups = buildGroups(window.$);
      var xml = util.toXml(groups);
      var outputStream = fs.createWriteStream(join(__dirname, '../data/jshint-documentation.xml'));
      outputStream.end(xml);
      outputStream.destroy();
      console.log(xml);
    }
  });
}

(function () {
  var optionsHtmlFilePath = util.getOptionsHtmlFilePath();
  console.log("Reading " + optionsHtmlFilePath + "...");
  parse(util.readJSHintDocHtmlFileContent());
}());
