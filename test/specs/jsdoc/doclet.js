/*global describe: true, env: true, expect: true, it: true, jasmine: true */
describe("jsdoc/doclet", function() {
    var jsdoc = {
        doclet: require('jsdoc/doclet'),
        tag: require('jsdoc/tag'),
        dictionary: require('jsdoc/tag/dictionary'),
        name: require('jsdoc/name')
    };

    it('should exist', function() {
        expect(jsdoc.doclet).toBeDefined();
        expect(typeof jsdoc.doclet).toBe('object');
    });

    it('should export a Doclet function', function() {
        expect(jsdoc.doclet.Doclet).toBeDefined();
        expect(typeof jsdoc.doclet.Doclet).toBe('function');
    });

    describe('Doclet', function() {
        // we don't need to test the functioning of individual tags here; that is
        // done in jsdoc/test/tags.
        var eventDoclet = new jsdoc.doclet.Doclet('/** @event foobar  */', {}),
            doclet = new jsdoc.doclet.Doclet('/** @const {number} FOO\n * @default 1 */', {}),
            meta = {
                range: [0, 100],
                id: 'ljkaskldf',
                lineno: 1,
                filename: 'asdf/fdsa.js',
                code: {
                    name: 'foo',
                    type: 'DUNNO',
                    node: 'something',
                    funcscope: 'something else',
                    value: 1,
                    paramnames: ['asdf', 'bar']
                }
            };

        it('should have a postProcess function', function() {
            expect(doclet.postProcess).toBeDefined();
            expect(typeof doclet.postProcess).toBe('function');
        });

        it('should have a addTag function', function() {
            expect(doclet.addTag).toBeDefined();
            expect(typeof doclet.addTag).toBe('function');
        });

        it('should have a setMemberof function', function() {
            expect(doclet.setMemberof).toBeDefined();
            expect(typeof doclet.setMemberof).toBe('function');
        });

        it('should have a setLongname function', function() {
            expect(doclet.setLongname).toBeDefined();
            expect(typeof doclet.setLongname).toBe('function');
        });

        it('should have a borrow function', function() {
            expect(doclet.borrow).toBeDefined();
            expect(typeof doclet.borrow).toBe('function');
        });

        it('should have a mix function', function() {
            expect(doclet.mix).toBeDefined();
            expect(typeof doclet.mix).toBe('function');
        });

        it('should have a augment function', function() {
            expect(doclet.augment).toBeDefined();
            expect(typeof doclet.augment).toBe('function');
        });

        it('should have a setMeta function', function() {
            expect(doclet.setMeta).toBeDefined();
            expect(typeof doclet.setMeta).toBe('function');
        });

        it("should have a string 'comment' property", function() {
            expect(doclet.comment).toBeDefined();
            expect(typeof doclet.comment).toBe('string');
        });

        describe('constructor', function() {
            var lazy = jsdoc.doclet.Doclet.prototype;
            var src = '/**blah blah blah\n * @name fdsa\n * @type {number}\n * @readonly */',
                meta2 = {id: 'fdsa'};

            it('should set this.comment to the source parameter', function() {
                var cleanDoclet = new jsdoc.doclet.Doclet(src, meta2);
                expect(cleanDoclet.comment).toBe(src);
            });

            it('should call this.setMeta to the meta parameter', function() {
                // why do I have to re-spy in each call?
                spyOn(lazy, 'setMeta').andCallThrough();
                new jsdoc.doclet.Doclet(src, meta2);
                expect(lazy.setMeta).toHaveBeenCalled();
                expect(lazy.setMeta.mostRecentCall.args[0]).toBe(meta2);
            });

            it('should call this.addTag on all tags found', function() {
                spyOn(lazy, 'addTag').andCallThrough();
                new jsdoc.doclet.Doclet(src, meta2);

                expect(lazy.addTag).toHaveBeenCalled();

                // it adds @description for you
                expect(lazy.addTag.calls[0].args[0]).toBe('description');
                expect(lazy.addTag.calls[0].args[1]).toBe(' blah blah blah\n');

                expect(lazy.addTag.calls[1].args[0]).toBe('name');
                expect(lazy.addTag.calls[1].args[1]).toBe(' fdsa\n');

                expect(lazy.addTag.calls[2].args[0]).toBe('type');
                expect(lazy.addTag.calls[2].args[1]).toBe(' {number}\n');

                expect(lazy.addTag.calls[3].args[0]).toBe('readonly');
                expect(lazy.addTag.calls[3].args[1]).toBeUndefined();
            });

            it('should call postProcess', function() {
                spyOn(lazy, 'postProcess').andCallThrough();
                var doc = new jsdoc.doclet.Doclet(src, meta2);

                expect(lazy.postProcess).toHaveBeenCalled();
                expect(lazy.postProcess.mostRecentCall.object).toBe(doc);
            });
        });

        describe('postProcess', function() {
            var cleanDoclet,
                lazy = jsdoc.doclet.Doclet.prototype,
                pp = lazy.postProcess;

            beforeEach(function () {
                // ensure it isn't called so that we can call it and examine the results
                lazy.postProcess = function () {};
                // regenerate the doclet each time.
                cleanDoclet = new jsdoc.doclet.Doclet('/** @constant FOOBAR */', {
                    code: {
                        type: 'function',
                        paramnames: ['foo']
                    }
                });
            });

            afterEach(function () {
                lazy.postProcess = pp;
            });

            xit('should call jsdoc.name.resolve if this.preserveName is false', function() {
                spyOn(jsdoc.name, 'resolve').andCallThrough();
                cleanDoclet.preserveName = false;
                pp.call(cleanDoclet);

                expect(jsdoc.name.resolve).toHaveBeenCalled();
                expect(jsdoc.name.resolve.mostRecentCall.args[0]).toBe(cleanDoclet);
                // no need to test jsdoc.name.resolve itself, that is done in name.js testing.
            });

            it('should not call jsdoc.name.resolve if this.preserveName is true', function() {
                spyOn(jsdoc.name, 'resolve').andCallThrough();
                cleanDoclet.preserveName = true;
                pp.call(cleanDoclet);

                expect(jsdoc.name.resolve).not.toHaveBeenCalled();
            });

            it("should set the doclet's longname if the name is set but not the longname", function() {
                var tmp = jsdoc.name.resolve;
                jsdoc.name.resolve = function () {};

                expect(cleanDoclet.longname).toBeFalsy();

                spyOn(lazy, 'setLongname').andCallThrough();
                pp.call(cleanDoclet);

                expect(lazy.setLongname).toHaveBeenCalled();
                expect(lazy.setLongname.mostRecentCall.args[0]).toBe('FOOBAR');
                expect(cleanDoclet.longname).toEqual('FOOBAR');

                jsdoc.name.resolve = tmp;
            });

            it("should delete this.memberof if it's an empty string", function() {
                expect(cleanDoclet.memberof).toBeFalsy();

                pp.call(cleanDoclet);

                expect(cleanDoclet.memberof).not.toBeDefined();
            });

            it("should set the doclet's kind from its code type if supplied in the metadata and not otherwise specified", function() {
                delete cleanDoclet.kind;
                pp.call(cleanDoclet);
                expect(cleanDoclet.kind).toBe('function');

                // if types is not function it'll be set to member
                cleanDoclet.setMeta({code: {type: 'aljkdf'}});
                delete cleanDoclet.kind;
                pp.call(cleanDoclet);
                expect(cleanDoclet.kind).toBe('member');
            });

            it("should append the variation to the longname if it has one and is not already there", function() {
                cleanDoclet.variation = '2';
                expect(cleanDoclet.longname).toBeFalsy();
                pp.call(cleanDoclet);
                expect(cleanDoclet.longname).toEqual('FOOBAR(2)');
            });

            it("should add in missing params from the code metadata if present", function() {
                // (only for functions where you use the @param tag)
                cleanDoclet.params = [ {} ];
                pp.call(cleanDoclet);
                expect(cleanDoclet.params[0].name).toEqual('foo');
            });
        });

        describe('addTag', function() {
            it("should create a tag and append to this.tags if the tag is unrecognised", function() {
                var tag = new jsdoc.tag.Tag('nonExistentTag', undefined, doclet.meta);
                doclet.addTag('nonExistentTag');

                expect(doclet.tags).toBeDefined();
                expect(doclet.tags instanceof Array).toBe(true);
                expect(doclet.tags.length).toBe(1);
                expect(doclet.tags[0]).toEqual(tag);
            });

            it("should call tag.onTagged if it is defined", function() {
                var def = jsdoc.dictionary.lookUp('abstract');
                expect(def.onTagged).toBeDefined();

                spyOn(def, 'onTagged');

                doclet.addTag('abstract');
                expect(def.onTagged).toHaveBeenCalled();
            });

            // bah - applyTag is private.
            // We can test its results though.
            describe('applyTag', function() {
                it("should set this.name to the tag's value if the tag is @name", function() {
                    var oldName = doclet.name;
                    doclet.addTag('name', '<global>.newname#foobar');
                    expect(doclet.name).toBe('<global>.newname#foobar');
                    doclet.name = oldName;
                });

                it("should set this.kind to the tag's value if the tag's title is 'kind'", function() {
                    var oldKind = doclet.kind;
                    doclet.addTag('kind', 'fdsa');
                    expect(doclet.kind).toBe('fdsa');
                    doclet.kind = oldKind;
                });

                it("should set this.description to the tag's value if the tag's title is 'description'", function() {
                    var desc = 'my big description of the constant that does this and that.';
                    doclet.addTag('description', desc);
                    expect(doclet.description).toBe(desc);
                });

                it("should set this.scope to the tag's value if the tag's title is 'scope'", function() {
                    var oldScope = doclet.scope;
                    doclet.addTag('scope', 'inner');
                    expect(doclet.scope).toBe('inner');
                    doclet.scope = oldScope;
                });
            });
        });

        describe('setMemberof', function() {
            it("should set this.memberof to a string", function() {
                doclet.setMemberof('<global>foobar');
                expect(doclet.memberof).toBeDefined();
                expect(typeof doclet.memberof).toBe('string');
            });

            it("should strip a preceding <global> off the memberof string if present", function() {
                doclet.setMemberof('<global>');
                expect(doclet.memberof).toBe('');

                // BUG: sid.replace(/^<global>.?/, '') --> need to escape the dot.
                //doclet.setMemberof('<global>foobar#asdf');
                //expect(doclet.memberof).toBe('foobar#asdf');

                doclet.setMemberof('<global>.baz#asdf');
                expect(doclet.memberof).toBe('baz#asdf');
            });

            it("should replace '.prototype' with '#'", function() {
                doclet.setMemberof('<global>.module:World~Country.prototype');
                expect(doclet.memberof).toBe('module:World~Country#');
            });
        });

        describe('setLongname', function() {
            it("should set this.longname to a string", function() {
                doclet.setLongname('Foo#bar');
                expect(doclet.longname).toBeDefined();
                expect(typeof doclet.longname).toBe('string');
            });

            it("should strip a preceding <global> off the longname string", function() {
                doclet.setLongname('<global>');
                expect(doclet.longname).toBe('');

                doclet.setLongname('<global>.log');
                expect(doclet.longname).toBe('log');

                doclet.setLongname('<global>log');
                expect(doclet.longname).toBe('log');
            });

            it("should apply the appropriate namespace to the longname if the doclet's kind is a namespace", function() {
                // @event is a namespace.
                expect(eventDoclet.kind).toBe('event');

                eventDoclet.setLongname('<global>\.module:World~FooBar#foobar');

                expect(eventDoclet.longname).toBe('module:World~FooBar#event:foobar');
            });
        });

        describe('borrow', function() {
            var from = 'Other.foobar',
                as = 'Me#baz',
                borrow1 = {from: from, as: as},
                borrow2 = {from: from};
            it("should ensure the this.borrowed array exists", function() {
                var len = doclet.borrowed && doclet.borrowed.length || 0;
                expect(len).toBe(0);

                doclet.borrow(from, as);

                expect(doclet.borrowed).toBeDefined();
                expect(doclet.borrowed instanceof Array).toBe(true);
                expect(doclet.borrowed.length).toBe(len + 1);
            });

            it("should append to the borrowed array if called multiple times", function() {
                var len = doclet.borrowed.length;

                doclet.borrow(from);

                expect(doclet.borrowed.length).toBe(len + 1);
            });

            it("should put an object of the form {from: string, as: string} into this.borrowed if a target is provided", function() {
                expect(doclet.borrowed[0]).toEqual(borrow1);
            });

            it("should put an object of the form {from: string} into this.borrowed if a target is not provided", function() {
                expect(doclet.borrowed[1]).toEqual(borrow2);
            });
        });

        describe('mix', function() {
            it("should create a 'mixes' property, an array, and put the mixin into it", function() {
                var len = doclet.mixes && doclet.mixes.length || 0;
                expect(len).toBe(0);

                doclet.mix('foobar');
                expect(doclet.mixes).toBeDefined();
                expect(doclet.mixes instanceof Array).toBe(true);
                expect(doclet.mixes.length).toBe(len + 1);
                expect(doclet.mixes).toContain('foobar');
            });

            it("should append to the mixes array when called multiple times", function() {
                var len = doclet.mixes.length;
                doclet.mix('baz');
                expect(doclet.mixes.length).toBe(len + 1);
                expect(doclet.mixes).toContain('foobar');
                expect(doclet.mixes).toContain('baz');
            });
        });

        describe('augment', function() {
            it("should create an augments property with the augmented class in it", function() {
                var len = doclet.augments && doclet.augments.length || 0;
                expect(len).toBe(0);

                doclet.augment('foobar');
                expect(doclet.augments).toBeDefined();
                expect(doclet.augments instanceof Array).toBe(true);
                expect(doclet.augments.length).toBe(len + 1);
                expect(doclet.augments).toContain('foobar');
            });
            
            it("should append to the augments array when called multiple times", function() {
                var len = doclet.augments.length;
                doclet.augment('baz');
                expect(doclet.augments.length).toBe(len + 1);
                expect(doclet.augments).toContain('foobar');
                expect(doclet.augments).toContain('baz');
            });
        });

        describe('setMeta', function() {
            it("should ensure this.meta is an object", function() {
                doclet.setMeta(meta);
                expect(doclet.meta).toBeDefined();
                expect(typeof doclet.meta).toBe('object');
            });

            it('should ensure this.meta.code is an object', function() {
                expect(doclet.meta.code).toBeDefined();
                expect(typeof doclet.meta.code).toBe('object');
            });

            it('should copy the range property if it exists', function() {
                expect(doclet.meta.range).toBeDefined();
                expect(doclet.meta.range).toEqual(meta.range);
            });

            it('should set this.meta.filename, lineno and path if the lineno is provided', function() {
                expect(doclet.meta.filename).toBeDefined();
                expect(doclet.meta.filename).toBe('fdsa.js');

                expect(doclet.meta.lineno).toBeDefined();
                expect(doclet.meta.lineno).toBe(meta.lineno);

                expect(doclet.meta.path).toBeDefined();
                expect(doclet.meta.path).toBe('asdf');
            });

            it('should copy meta.id to this.meta.code.id if exists', function() {
                expect(doclet.meta.code.id).toBeDefined();
                expect(doclet.meta.code.id).toBe(meta.id);
            });

            it('should copy `name`, `type`, `node`, `funcscope`, `value` and `paramnames` properties from meta.code to this.meta.code if they exist', function() {
                var props_to_copy = ['name', 'type', 'node', 'funcscope', 'value', 'paramnames'];
                for (var i = 0; i < props_to_copy.length; ++i) {
                    var prop = props_to_copy[i];
                    expect(doclet.meta.code[prop]).toBeDefined();
                    expect(doclet.meta.code[prop]).toEqual(meta.code[prop]);
                }
            });
        });
    });

    var docSet = jasmine.getDocSetFromFile('test/fixtures/doclet.js'),
        test1 = docSet.getByLongname('test1')[0],
        test2 = docSet.getByLongname('test2')[0];

    var expectStrong = "**Strong** is strong";
    var expectList = "* List item 1";

    it('does not mangle Markdown in a description that uses leading asterisks', function() {
        expect(test2.description.indexOf(expectStrong)).toBeGreaterThan(-1);
        expect(test2.description.indexOf(expectList)).toBeGreaterThan(-1);
    });
});
