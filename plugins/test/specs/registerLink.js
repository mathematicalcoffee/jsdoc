/*jshint maxlen:150 */
/*global it, installPlugins, jasmine, require, describe, expect */

describe("registerLink plugin", function () {
    var parser = new (require("jsdoc/src/parser")).Parser();
    installPlugins(['plugins/registerLink'], parser);
    require('jsdoc/src/handlers').attachTo(parser);

    // we need to parse the file in order for the registered links to be added.
    jasmine.getDocSetFromFile('plugins/registerLink.js');
    var helper = require('jsdoc/util/templateHelper');

    // test that it works in the first place
    it("should have registered the links from the tags", function () {
        var output = helper.resolveLinks('{@link Doclet}');
        expect(output).toEqual('<a href="http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/1208b21f54.html">Doclet</a>');

        output = helper.resolveLinks('{@link Tag}');
        expect(output).toEqual('<a href="http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/2e92ec08d7.html">Tag</a>');
    });
});
