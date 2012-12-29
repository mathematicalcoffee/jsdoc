/*jshint maxlen:150 */
/*global it, installPlugins, jasmine, require, describe, expect */

describe("registerLink plugin", function () {
    var parser = new (require("jsdoc/src/parser")).Parser();
    var path = require('path');
    var helper = require('jsdoc/util/templateHelper');

    require('jsdoc/plugins').installPlugins(['plugins/registerLink'], parser);
    require('jsdoc/src/handlers').attachTo(parser);

    // add some configuration for tests
    var oldConf = env.conf.registerLink;
    env.conf.registerLink = {
        "files": ["plugins/test/fixtures/.registeredLinks",
                  path.join(env.dirname, "plugins/test/fixtures/.registeredLinks2")
                 ]
    };

    // we need to parse the file in order for the registered links to be added.
    jasmine.getDocSetFromFile('plugins/registerLink.js', parser);

    // test that it works in the first place
    it("should have registered the links from the tags", function () {
        var output = helper.resolveLinks('{@link Doclet}');
        expect(output).toEqual('<a href="http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/1208b21f54.html">Doclet</a>');

        output = helper.resolveLinks('{@link Tag}');
        expect(output).toEqual('<a href="http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/2e92ec08d7.html">Tag</a>');
    });

    // test that the conf works.
    it("we read files from env.conf.registerLink, relative link", function () {
        var output = helper.resolveLinks('{@link Bar}');
        expect(output).toEqual('<a href="http://bar.com">Bar</a>');
    });

    it("we read files from env.conf.registerLink, absolute link", function () {
        var output = helper.resolveLinks('{@link Foo}');
        expect(output).toEqual('<a href="http://foo.com">Foo</a>');
    });

    // restore.
    env.conf.registerLink = oldConf;
});
