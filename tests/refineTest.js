var downloader = require('../src/util');

exports.testPre = {
    simple: function(test) {
        var refined = downloader.refine('<pre>\n</pre>');
        test.equals(refined, '<pre>\n</pre>');
        test.done();
    },
    complex: function(test) {
        var refined = downloader.refine('\naba\t<pre>\n</pre>t\t');
        test.equals(refined, 'aba <pre>\n</pre>t');
        test.done();
    },
    preWithSpaces: function(test) {
        var refined = downloader.refine('<pre>a\n  b</pre>');
        test.equals(refined, '<pre>a\n  b</pre>');
        test.done();
    }
};
