/*jshint maxlen:150 */
/*global it, installPlugins, jasmine, require, describe, expect */

describe("autoNamespace plugin", function () {
    var parser = new (require("jsdoc/src/parser")).Parser(),
        plugin = require('plugins/autoNamespace');
    require('jsdoc/plugins').installPlugins(['plugins/autoNamespace'], parser);
    require('jsdoc/src/handlers').attachTo(parser);

    // note: we use parser.parse instead of jasmine.getDocSetFromFile because
    // we need the filename in beforeParse to be correct.

    function getByLongname(doclets, longname) {                                     
        return doclets.filter(function(doclet) {                            
            return (doclet.longname || doclet.name) === longname;           
        });                                                                 
    }

    // note: the only way to access the parser from within a plugin is to
    // use app.jsdoc.parser, but I am installing my plugin onto the parser
    // and not using the default app.jsdoc.parser.
    //
    // So I'll have to save my custom parser there and restore it after.
    var origParser = app.jsdoc.parser;
    app.jsdoc.parser = parser;

    var filePath;

    filePath = path.join(env.dirname, 'plugins/autoNamespace.js');
    var docSet = parser.parse([filePath]),
        autoNamespaceFile = getByLongname(docSet, 'plugins/autoNamespace.js')[0],
        AutoNamespace = getByLongname(docSet, 'AutoNamespace')[0],
        convertEntireText = getByLongname(docSet, 'AutoNamespace.convertEntireText')[0],
        convertLinkTags = getByLongname(docSet, 'AutoNamespace.convertLinkTags')[0],
        resolveLinks = getByLongname(docSet, 'AutoNamespace.resolveLinks')[0];

    filePath = path.join(env.dirname, 'plugins/test/fixtures/autoNamespace.js');
    var docSet2 = parser.parse([filePath]),
        autoNamespaceFixtureFile = getByLongname(docSet2, 'fixtures/autoNamespace.js')[0],
        MyClass = getByLongname(docSet2, 'MyNamespace.MyClass')[0],
        MySubclass = getByLongname(docSet2, 'MyNamespace.MySubclass')[0],
        MyObject = getByLongname(docSet2, 'MyNamespace.MyObject')[0],
        MyEvent = getByLongname(docSet2, 'MyNamespace.event:MyEvent')[0],
        MyNamespace = getByLongname(docSet2, 'MyNamespace')[0],
        MyEnum = getByLongname(docSet2, 'MyNamespace.MyEnum')[0],
        MyEnumONE = getByLongname(docSet2, 'MyNamespace.MyEnum.ONE')[0],
        MyNamespaceSymbol = getByLongname(docSet2, 'MyNamespace.MyNamespace')[0],
        MySubNamespace = getByLongname(docSet2, 'MyNamespace.MySubNamespace')[0];

    // test that it works in the first place
    it("file name is used for namespace", function () {
        expect(AutoNamespace).toBeDefined();
    });

    // override @namespace's @name
    it("Test @autonamespace works and is used instead of the file name", function () {
        expect(MyNamespace).toBeDefined();
        //expect(MyClass).toBeDefined();
    });

    // various tags should be affected:
    it("classdesc is affected", function () {
        expect(MyClass.classdesc).toEqual("see {@link MyNamespace.MyClass}");
    });

    it("description is affected", function () {
        expect(convertLinkTags.description).toEqual("Converts all link tags in `text` resolving them with {@link AutoNamespace.convertEntireText}.");
    });

    it("params is affected", function () {
        expect(convertLinkTags.params[1].description).toEqual('see {@link AutoNamespace.convertEntireText}.');
    });

    it("properties is affected", function () {
        expect(MyObject.properties[0].description).toEqual("see {@link MyNamespace.MyClass}");
    });

    it("returns is affected", function () {
        expect(convertLinkTags.returns[0].description).toEqual('`text` with all link tags resolved to the current namespace if possible, uses {@link AutoNamespace.convertEntireText}.');
    });

    it("deprecated is affected", function () {
        expect(MyClass.deprecated).toEqual("See {@link MyNamespace.MyObject}");
    });

    it("@this is affected", function () {
        expect(MyObject['this']).toEqual("MyNamespace.MyClass");
    });

    it("@augments is affected", function () {
        expect(MySubclass.augments[0]).toEqual('MyNamespace.MyClass');
    });

    it("@fires is affected", function () {
        expect(MyClass.fires.length).toEqual(2);
        expect(MyClass.fires.indexOf('MyNamespace.event:MyEvent')).not.toEqual(-1);
        expect(MyClass.fires.indexOf('MyNamespace.MyClass.event:ClassEvent')).not.toEqual(-1);
    });

    it("@see is affected", function () {
        expect(convertEntireText.see.length).toEqual(2);
        expect(convertEntireText.see.indexOf('AutoNamespace.namespaceName')).not.toEqual(-1);
        expect(convertEntireText.see.indexOf('{@link AutoNamespace.convertLinkTags} which resolves a string that may have link tags')).not.toEqual(-1);

        expect(MySubclass.see.length).toEqual(4);
        expect(MySubclass.see.indexOf('MyNamespace.MyClass')).not.toEqual(-1);
        expect(MySubclass.see.indexOf('{@link MyNamespace.MyObject}')).not.toEqual(-1);
        expect(MySubclass.see.indexOf('{@link http://fdsa.com}')).not.toEqual(-1);
        expect(MySubclass.see.indexOf('Something else for details')).not.toEqual(-1);
    });

    it("since is affected", function () {
        expect(MyEvent.since).toEqual("See {@link MyNamespace.MyObject}");
    });

    it("summary is affected", function () {
        expect(autoNamespaceFixtureFile.summary).toEqual("a test file. See {@link MyNamespace.MyClass}.");
    });

    it("todo is affected", function () {
        expect(MyClass.todo[0]).toEqual("document {@link MyNamespace.event:MyEvent}");
    });

    it("links to events are properly affected", function () {
        expect(MyClass.todo[0]).toEqual("document {@link MyNamespace.event:MyEvent}");
    });

    it("@overview is affected", function () {
        expect(autoNamespaceFixtureFile.description).toEqual("Try to override the namespace name. See {@link MyNamespace.MyClass}.");
    });

    it("links to the automatic namespace resolve", function () {
        expect(convertEntireText.todo[0]).toEqual('check {@link AutoNamespace} links to the namespace');
    });

    it("broken links are not touched", function () {
        expect(resolveLinks.see.indexOf('a purposely broken link {@link broken}')).not.toEqual(-1);
    });

    it("subnamespaces are not mangled", function () {
        expect(MySubNamespace).toBeDefined();
        expect(MySubNamespace.description).toEqual('A nested namespace. See function {@link MyNamespace.MySubNamespace.myFunction}.');
    });

    it("references to enums and enum values work", function () {
        expect(MyEnum).toBeDefined();
        expect(MyEnum.description).toEqual("An enum. Values {@link MyNamespace.MyEnum.ONE} and {@link MyNamespace.MyEnum.TWO}.");
        expect(MyEnumONE.description).toEqual("See {@link MyNamespace.MyEnum} and {@link MyNamespace.MyEnum.TWO}");
    });

    it("when a symbol has the same name as the namespace, links point to the symbol", function () {
        expect(MyNamespaceSymbol).toBeDefined();
        expect(MyNamespaceSymbol.description).toEqual(
            "Corner case: a symbol with the same name as the namespace.\n" +
            "NOTE: in this case {@link MyNamespace.MyNamespace} will resolve to the symbol"
        );
    });

    it("{@link namespace: ...} can be used to link to the automatic namespace", function () {
        expect(MyEvent.description).toEqual(
            "An event.\n" +
            "[{ @link namespace:MyNamespace}]{@link MyNamespace} should resolve to the namespace."
        );
    });

    it("@autonamespace doclet should act like a @namespace one", function () {
        expect(MyNamespace.description).toEqual('Namespace description, see {@link MyNamespace.MyClass}');
    });

    it("namespace doclet should borrow description/summary of fileoverview if not present", function () {
        expect(MyNamespace.summary).toEqual(autoNamespaceFixtureFile.summary);
        expect(MyNamespace.description).not.toEqual(autoNamespaceFixtureFile.description);

        expect(AutoNamespace.description).toEqual(autoNamespaceFile.description);
    });

    it("changes the scope of formerly-global objects to static, but doesn't affect say instance or inners", function () {
        expect(MyEnum.scope).toEqual('static');
        expect(MyClass.scope).toEqual('static');
        expect(MyObject.scope).toEqual('static');
        expect(MySubclass.scope).toEqual('static');
        expect(MySubNamespace.scope).toEqual('static');

        var x = getByLongname(docSet2, 'MyNamespace.MySubclass~x')[0],
            y = getByLongname(docSet2, 'MyNamespace.MySubclass#y')[0];
        expect(x.scope).toEqual('inner');
        expect(y.scope).toEqual('instance');
        // events don't seem to get a scope
    });

    it("namespaces are sanitized.", function () {
        expect(plugin.sanitizeNamespace('asdf')).toEqual('Asdf');
        expect(plugin.sanitizeNamespace('asd_f')).toEqual('Asd_f');
        expect(plugin.sanitizeNamespace('asdf.123')).toEqual('Asdf123');
        expect(plugin.sanitizeNamespace('a-2lk3_D893')).toEqual('A2lk3_D893');
    });

    // restore the parser
    app.jsdoc.parser = origParser;
});
