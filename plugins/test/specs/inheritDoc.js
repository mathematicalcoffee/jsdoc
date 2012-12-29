describe("inheritDoc plugin", function() {
    var parser = new (require("jsdoc/src/parser")).Parser(),
        plugin = require('plugins/inheritDoc');

    require('jsdoc/plugins').installPlugins(['plugins/inheritDoc'], parser);

    var docSet = jasmine.getDocSetFromFile('plugins/test/fixtures/inheritDoc.js', parser),
        myFunction = docSet.getByLongname('myFunction')[0],
        myFunction2 = docSet.getByLongname('myFunction2')[0],
        myFunction3 = docSet.getByLongname('myFunction3')[0],
        myFunction4 = docSet.getByLongname('myFunction4')[0],
        myClass2 = docSet.getByLongname('MyClass2')[0],
        mySubclass2 = docSet.getByLongname('MySubclass2')[0],
        doStuff = docSet.getByLongname('MyClass#doStuff')[0],
        doStuffSubclass = docSet.getByLongname('MySubclass#doStuff')[0],
        doStuff2 = docSet.getByLongname('MyClass2#doStuff2')[0],
        doStuff2Subclass2 = docSet.getByLongname('MySubclass2#doStuff2')[0];

    function getParamByName(func, name) {
        for (var i = 0; i < func.params.length; ++i) {
            if (func.params[i].name === name) {
                return func.params[i];
            }
        }
        return null;
    }

//    it("@inheritparams adds an inheritdocs array to the doclet", function () {
//        expect(typeof myFunction3.inheritdocs).toEqual('object');
//    });

//    it("@inheritparams adds the name of the inherited function in its inheritdocs array", function () {
//        expect(myFunction3.inheritdocs[0]).toEqual('myFunction');
//    });

    it("@inheritparams: inheritor's number of arguments should be right", function () {
        // myFunction3 should have 4 parameters.
        expect(myFunction3.params.length).toEqual(4);
    });
   
    it("@inheritparams: inheritor should inherit parameters", function () {
        // myFunction3 @inheritparams myFunction: x should be inherited
        var x = getParamByName(myFunction3, 'x');
        expect(x).not.toEqual(null);
        expect(x.description).toEqual(getParamByName(myFunction, 'x').description);
    });

    it("@inheritparams: inheritor should inherit returns value", function () {
        //console.log(myFunction3);
        // myFunction3 @inheritparams myFunction: returns should be inherited
        expect(myFunction3.returns).toBeDefined();
        expect(myFunction3.returns[0].description).toBeDefined();
        expect(myFunction3.returns[0].description).toEqual(myFunction.returns[0].description);
    });

    it("Parameters documented in the inheritor mask those inherited", function () {
        // myFunction @inheritparams myFunction3 - y should be overridden
        var y = getParamByName(myFunction3, 'y');
        expect(y).not.toEqual(null);
        expect(y.description).toEqual('overridden');
    });

    it("Function with some inherited and some undocumented parameters should show the undocumented ones as undocumented", function () {
        // myFunction @inheritparams myFunction3 - a should be 'undocumented'
        var a = getParamByName(myFunction3, 'a');
        expect(a).not.toEqual(null);
        expect(a.description).toEqual('undocumented');
    });

//    it("@inheritdoc creates a inheritdocs property to the doclet", function () {
//        expect(typeof myFunction2.inheritdocs).toEqual('object');
//    });
//
//    it("@inheritdocs adds the name of the inherited function in its inheritdocs array", function () {
//        expect(myFunction2.inheritdocs[0]).toEqual('myFunction3');
//    });

    it("@inheritdoc: inherit parameters/returns as @inheritparams", function () {
        // myFunction2 @inheritdoc's myFunction3 - returns is overridden, but
        // y, z and description are inherited.
        expect(myFunction2.params.length).toEqual(2);
        var y = getParamByName(myFunction2, 'y'),
            z = getParamByName(myFunction2, 'z');
            y3 = getParamByName(myFunction3, 'y');
            z3 = getParamByName(myFunction3, 'z');
        expect(y).not.toEqual(null);
        expect(z).not.toEqual(null);
        expect(y.description).toEqual(y3.description);
        expect(z.description).toEqual(z3.description);

        // returns
        expect(myFunction2.returns).toBeDefined();
        expect(myFunction2.returns[0].description).toBeDefined();
        expect(myFunction2.returns[0].description).toEqual('another number');
    });

    it("@inheritdoc: inherits description (if blank)", function () {
        expect(myFunction2.description).toBeDefined();
        expect(myFunction2.description).toEqual(myFunction3.description);
    });

    it("@inheritdoc: adds the inherited function to @see", function () {
        expect(myFunction2.see).toBeDefined();
        expect(typeof myFunction2.see).toEqual('object');
        expect(myFunction2.see.indexOf('myFunction3')).not.toEqual(-1);
    });

    it("we should not inherit parameters in the parent not in the child", function () {
        // myFunction2 should not have an 'x' or 'a' parameter
        var x = getParamByName(myFunction2, 'x');
        var a = getParamByName(myFunction2, 'a');
        expect(x).toEqual(null);
        expect(a).toEqual(null);
    });

    it("Multiple @inherits - previous ones override later ones", function () {
        // myFunction4 should get our local x, y from myFunction, z from myFunction2
        expect(myFunction4.params.length).toEqual(3);
        var x = getParamByName(myFunction4, 'x'),
            y = getParamByName(myFunction4, 'y'),
            z = getParamByName(myFunction4, 'z'),
            yo = getParamByName(myFunction, 'y'),
            z3 = getParamByName(myFunction2, 'z')
        //console.log(myFunction4);
        expect(x).not.toEqual(null);
        expect(y).not.toEqual(null);
        expect(z).not.toEqual(null);
        expect(x.description).toEqual('overridden'); // <-- FAILS
        expect(y.description).toEqual(yo.description);
        expect(z.description).toEqual(z3.description);
    });

    // OVERRIDE
//    xit("@override: guesses the correct symbol to inherit from", function () {
//        // MySubclass.doStuff @override from MyClass.doStuff
//        expect(typeof doStuffSubclass.inheritdocs).toEqual('object');
//        expect(doStuffSubclass.inheritdocs[0]).toEqual('MyClass#doStuff');
//    });

    it("@override: adds link to overridden function in @see", function () {
        expect(typeof doStuffSubclass.see).toEqual('object');
        expect(doStuffSubclass.see.indexOf('MyClass#doStuff')).not.toEqual(-1);
    });

    it("@override: inherits description/params/returns with possible overrides", function () {
        // # params
        expect(doStuffSubclass.params.length).toEqual(2);
        var foo = getParamByName(doStuffSubclass, 'foo'),
            bar = getParamByName(doStuffSubclass, 'bar'),
            fooO = getParamByName(doStuff, 'foo');
        expect(foo).not.toEqual(null);
        expect(bar).not.toEqual(null);
        expect(fooO).not.toEqual(null);
        
        expect(foo.description).toEqual(fooO.description);
        expect(bar.description).toEqual('explanation');

        // description
        expect(doStuffSubclass.description).toEqual(doStuff.description);

        // returns
        expect(doStuffSubclass.returns[0].description).toEqual('another explanation');
    });

    it("@inheritparams: a class can inheritparams another one.", function () {
        expect(myClass2.params.length).toEqual(1);
        expect(mySubclass2.params.length).toEqual(1);
        expect(myClass2.params[0].description).toEqual(mySubclass2.params[0].description);
        expect(myClass2.params[0].description).toEqual('initial');
    });

    it("@override: if the @override declaration occurs before the parent function definition it still works", function () {
        expect(doStuff2Subclass2.params.length).toEqual(1);
        var baz = getParamByName(doStuff2Subclass2, 'baz'),
            bazO = getParamByName(doStuff2, 'baz');

        expect(baz).not.toEqual(null);
        expect(bazO).not.toEqual(null);

        expect(baz.description).toEqual(bazO.description);
        expect(doStuff2Subclass2.description).toEqual('This description should override the inherited one');
        expect(doStuff2.description).toEqual('A function that does stuff too.');
    });

    // NOPE: DOESN'T WORK. Don't know how to implement intelligently (could
    // just try walking up the parent chain, but what if it's out of order?
    // I really need a "finishedAllDoclets" event).
    xit("@override: overriding a function only documented in a grandparent class works", function () {
        // MySubclass2#doStuff extends MyClass2#doStuff extends MySubclass#doStuff 

        // foo argument
        //console.log(doStuffSubclass2);
        expect(doStuffSubclass2.params.length).toEqual(1);
        var foo = getParamByName(doStuffSubclass, 'foo'),
            foo2 = getParamByName(doStuffSubclass2, 'foo');
        expect(foo2.description).toEqual(foo.description);

        // returns
        expect(doStuffSubclass2.returns[0].description).toEqual(doStuffSubclass.returns[0].description);

        // description
        expect(doStuffSubclass2.description).toEqual(doStuffSubclass.description);
    });

});
