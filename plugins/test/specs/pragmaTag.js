describe("pragmaTag plugin", function() {
    var parser = new (require("jsdoc/src/parser")).Parser(),
        plugin = require('plugins/pragmaTag');

    require('jsdoc/plugins').installPlugins(['plugins/pragmaTag'], parser);

    var docSet = jasmine.getDocSetFromFile('plugins/test/fixtures/pragmaTag.js', parser),
        A = docSet.getByLongname('A')[0],
        B = docSet.getByLongname('B')[0],
        C = docSet.getByLongname('C')[0],
        D = docSet.getByLongname('D')[0],
        E = docSet.getByLongname('E')[0],
        F = docSet.getByLongname('F')[0];
//        var path = require("path"),
//            docSet = parser.parse([path.join(env.dirname, "plugins/test/fixtures/pragmaTag.js")]),

    it("Variables in pragma tags should get the right properties, including nesting", function () {
        // A, B, C, D, E

        // they all got @const
        expect(A.kind).toEqual('constant');
        expect(B.kind).toEqual('constant');
        expect(C.kind).toEqual('constant');
        expect(D.kind).toEqual('constant');
        expect(E.kind).toEqual('constant');

        // they all got @default
        expect(A.defaultvalue).toBeDefined();
        expect(B.defaultvalue).toBeDefined();
        expect(C.defaultvalue).toBeDefined();
        expect(D.defaultvalue).toBeDefined();
        expect(E.defaultvalue).toBeDefined();

        // A, B got type 'string', D, E got type 'number', C doesn't have it set
        expect(A.type.names[0]).toEqual('string');
        expect(B.type.names[0]).toEqual('string');
        expect(D.type.names[0]).toEqual('number');
        expect(E.type.names[0]).toEqual('number');

        expect(C.type).toBeUndefined();
    });

    it("Virtual doclets are affected.", function () {
        expect(F.kind).toEqual('constant');
        expect(F.defaultvalue).toBeDefined();
        expect(F.defaultvalue).toEqual('2');
        expect(F.type.names[0]).toEqual('number');
    });
});
