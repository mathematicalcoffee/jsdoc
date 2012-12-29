describe("relativeLinks plugin", function() {
    var parser = new (require("jsdoc/src/parser")).Parser(),
        plugin = require('plugins/relativeLinks');

    require('jsdoc/plugins').installPlugins(['plugins/relativeLinks'], parser);

    var docSet = jasmine.getDocSetFromFile('plugins/test/fixtures/relativeLinks.js', parser),
        docSet2 = jasmine.getDocSetFromFile('plugins/relativeLinks.js', parser),
        MyClass = docSet.getByLongname('MyClass')[0],
        foo = docSet.getByLongname('MyClass#foo')[0],
        foo2 = docSet2.getByLongname('MyNamespace.foo')[0],
        bar = docSet.getByLongname('MyNamespace.bar')[0],
        module = docSet2.getByLongname('module:plugins/relativeLinks')[0],
        MyNamespace = docSet.getByLongname('MyNamespace')[0],
        MyEnumVAL1 = docSet.getByLongname('MyEnum.VAL1')[0],
        resolveLinks = docSet2.getByLongname('module:plugins/relativeLinks~resolveLinks')[0],
        handlers = docSet2.getByLongname('module:plugins/relativeLinks.handlers')[0],
        TestClass = docSet2.getByLongname('module:plugins/relativeLinks~TestClass')[0],
        MySubclass = docSet2.getByLongname('module:plugins/relativeLinks~MySubclass')[0];

    it("classdesc is affected", function () {
        expect(MyClass.classdesc).toEqual("See {@link MyClass#foo}, {@link MyClass~foo} and {@link MyClass.foo}.");
    });

    it("description is affected", function () {
        expect(MyClass.description).toEqual("A class.\nSee {@link MyClass#foo}, {@link MyClass~foo} and {@link MyClass.foo}.");
    });

    it("params is affected", function () {
        expect(foo.params[0].description).toEqual('See {@link MyClass~foo}');
    });

    it("properties is affected", function () {
        expect(foo2.properties[0].description).toEqual("see {@link MyNamespace.bar}");
    });

    it("returns is affected", function () {
        expect(foo.returns[0].description).toEqual('See {@link MyClass.foo}');
    });

    it("deprecated is affected", function () {
        expect(MyClass.deprecated).toEqual("test {@link MyClass.foo}");
    });

    it("@this is affected", function () {
        expect(bar['this']).toEqual("MyNamespace.foo");
    });

    it("@augments is affected", function () {
        expect(MySubclass.augments.indexOf('module:plugins/relativeLinks~TestClass')).not.toEqual(-1);
    });

    it("@fires is affected", function () {
        expect(foo2.fires.length).toEqual(1);
        expect(foo2.fires.indexOf('MyNamespace.event:my-event')).not.toEqual(-1);
    });

    it("@see is affected", function () {
        expect(resolveLinks.see.length).toEqual(2);
        expect(resolveLinks.see.indexOf("module:plugins/relativeLinks~convertLinkTags")).not.toEqual(-1);
        expect(resolveLinks.see.indexOf("{@link module:plugins/relativeLinks~convertEntireText}")).not.toEqual(-1);
    });

    it("works for members of enums", function () {
        expect(MyEnumVAL1.description).toEqual("value 1. see {@link MyEnum.VAL2}");
    });

    it("since is affected", function () {
        expect(MyClass.since).toEqual("version 1. Otherwise see {@link MyClass#foo}.");
    });

    it("summary is affected", function () {
        expect(module.summary).toEqual("Provides relative links in the link tag. Core function {@link module:plugins/relativeLinks~resolveLinks}.");
    });

    it("todo is affected", function () {
        expect(foo.todo[0]).toEqual("{@link MyClass#foo}");
    });

    it("namespace desc is affected", function () {
        expect(MyNamespace.description).toEqual("A namespace.\nSee {@link MyNamespace.foo}.");
    });

    // test within modules
    it("works for references within modules", function () {
        expect(resolveLinks.description).toEqual("Resolves all links in text. See {@link module:plugins/relativeLinks~kindToPrefix}");
        expect(handlers.description).toEqual("Handlers. See {@link module:plugins/relativeLinks.handlers.newDoclet}");
    });

    it("works for nested class methods within modules", function () {
        expect(TestClass.description).toEqual("Dummy class for testing. See {@link module:plugins/relativeLinks~TestClass#foo}, {@link module:plugins/relativeLinks~TestClass~foo} and {@link module:plugins/relativeLinks~TestClass.foo}.");
    });
});
