describe("prettyPrintCode plugin", function() {
    var parser = new (require("jsdoc/src/parser")).Parser(),
        plugin = require('plugins/prettyPrintCode');

    var old = env.conf.markdown ? env.conf.markdown.parser : undefined;
    env.conf.markdown = {parser: 'gfm'};

    require('jsdoc/plugins').installPlugins(['plugins/markdown'], parser);
    require('jsdoc/plugins').installPlugins(['plugins/prettyPrintCode'], parser);

    var docSet = jasmine.getDocSetFromFile('plugins/prettyPrintCode.js', parser);
    var doc;

    // restore old configuration
    if (old !== undefined) {
        env.conf.markdown.parser = old;
    } else {
        delete env.conf.markdown;
    }
    it("indented code block pretty-prints", function () {
        /** Test: Indented code to be pretty-printed.
         *
         *     console.log("Hello world!");
         */
        doc = docSet.getByLongname('module:plugins/prettyPrintCode~test_indented_code_block')[0];
        expect(doc).toBeDefined();
        expect(doc.description.indexOf('<pre class="prettyprint" ><code>console.log("Hello world!");\n</code></pre>')).not.toEqual(-1);
    });
    it("Fenced code blocks are pretty-printed", function () {
        /** Test: Fenced code blocks are pretty-printed.
         * ```
         * console.log("Hello world!");
         * ```
         */
        doc = docSet.getByLongname('module:plugins/prettyPrintCode~test_fenced_code_block')[0];
        expect(doc).toBeDefined();
        expect(doc.description.indexOf('<pre lang="" class="prettyprint">console.log("Hello world!");\n</pre>')).not.toEqual(-1);
    });
    it("Fenced code blocks with language specification are pretty-printed", function () {
        /** Test: Fenced code blocks with language specification are pretty-printed.
         * ```python
         * print "Hello world!"
         * ```
         */
        doc = docSet.getByLongname('module:plugins/prettyPrintCode~test_fenced_code_block_with_language')[0];
        expect(doc).toBeDefined();
        expect(doc.description.indexOf('<pre lang="python" class="prettyprint lang-py">print "Hello world!"\n</pre>')).not.toEqual(-1);
    });
    it("```none doesn't pretty-print.", function () {
        /** Test: Fenced code block with language 'none' is not pretty-printed.
         * ```none
         * Hello, world!
         * ```
         */
        doc = docSet.getByLongname('module:plugins/prettyPrintCode~test_forced_no_pretty_print')[0];
        expect(doc).toBeDefined();
        expect(doc.description.indexOf('<pre lang="none">Hello, world!\n</pre>')).not.toEqual(-1);
    });
});
