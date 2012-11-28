# inheritDoc
This plugin provides convenience tags for borrowing parameter and returns
documentation from other symbols: `@inheritparams`, `@inheritdoc` and `@override`.

**NOTE**: This might conflict with Closure Compiler's `@inheritdoc` and
`@override` commands - should I rename mine to avoid confusion?

**Status**: beta (I am satisfied with `@inheritparams` and `@inheritdoc`,
`@override` needs improvement)  
**Location**: [myPlugins branch on my jsdoc3 fork](https://github.com/mathematicalcoffee/jsdoc/blob/myPlugins/plugins/inheritDoc.js)  
**Author**: mathematical.coffee <mathematical.coffee@gmail.com>

## Description
This plugin provides convenience tags for borrowing parameter and returns
documentation from other symbols: `@inheritparams`, `@inheritdoc` and `@override`.

### @inheritparams
The `@inheritparams` tag to copies parameter and returns documentation from
one function to the current one.

* the "child" (inheriting) function only inherits parameter documentation if
  both the child and parent functions have that parameter;
* if the child function explicitly documents a parameter or @returns, this
  will be used instead of the parent function's documentation;
* you are still responsible for documenting parameters of the child function
  that do not exist in the parent function.

#### Usage

    @inheritparams [symbol to inherit from]

#### Example

    /** a function
     * @param {number} x - x value
     * @param {number} y - y value
     * @returns {number} x + y
     */
    function myFunction (x, y) {
        return x + y;
    }

    /** another function
     * @inheritparams myFunction
     * @param {number} z - z value
     * @returns {number} x + y + z
     */
     function myFunction2 (x, y, z) {
         return x + y + z
     }

In the above, the `x` and `y` documentation from `myFunction` gets carried over
to `myFunction2`. The `@returns` documentation doesn't, because I specified it
myself in `myFunction2` so this overrides the inherited documentation.

### @inheritdoc
The `@inheritdoc` tag is the same as `@inheritparams`, but it *additionally*:

* copies the parent function's description;
* copies the parent function's summary;
* copies the parent function's classdesc;
* adds the parent function to the child function's '@see'.

As with `@inheritparams`, if any of the description, summary and classdesc are
already defined in the child doclet, then they will not be inherited from
the parent doclet.

#### Usage

    @inheritdoc [symbol to inherit from]

#### Example

    /** a function
     * @param {number} x - x value
     * @param {number} y - y value
     * @returns {number} x + y
     */
    function myFunction (x, y) {
        return x + y;
    }

    /**
     * @inheritdoc myFunction
     * @param {number} z - z value
     */
    function myFunction2 (x, y, z) {
        return x + y + z
    }

In the above, the 'x', 'y' and '@returns' documentation will be taken from
`myFunction` into `myFunction2` as with `@inheritparams`.

However, `myFunction2` will *also* get `myFunction`'s description ("a function")
and `myFunction` will appear in `myFunction2`'s "see:" section.

### @override
The `@override` tag is the same as the `@inheritdoc` tag, except that you don't
need to specify a symbol to inherit from.

Use it when documenting a class' method that shadows its superclass' method,
and the plugin will attempt to determine the name of that method itself rather
than you having to do it.

It *only* works if the doclet is a member of some class where you used
`@augments` or `@extends`.

Note that in MySubClass#method's documentation, writing `@override` is
equivalent to writing `@inheritdoc MyClass#method`, except it tries to work
out the `MyClass#method` for you.

#### Example

    /** A class
     * @class */
    function MyClass() {
        /** A function
         * @param {number} bar - parameter */
        this.foo = function (bar) {};
    }

    /** A subclass
     * @extends MyClass
     * @class */
    function MyClass2() {
        /** @override
         * @param {number} baz - parameter */
        this.foo = function (bar, baz) {};
    }

In the example above, `MyClass2#foo`'s documentation is taken from
`MyClass#foo` and `MyClass#foo` is also aded to `MyClass2#foo`'s "see:"
section.

Note that `@override` is equivalent to `@inheritdoc MyClass#foo` but doesn't
require the user to write the `MyClass#foo` bit.

#### Caveats
The `@override` tag will *only* work if the superclass method is explicitly
documented. For example:

    /** A class
     * @class */
    function MyClass() {
        /** A function
         * @param {number} bar - parameter */
        this.foo = function (bar) {};
    }

    /** A subclass
     * @extends MyClass
     * @class */
    function MyClass2() {
    }

    /** Another subclass
     * @extends MyClass2
     * @class */
    function MyClass3() {
        /** @override */
        this.foo = function (bar) {};
    }

In the above, `MyClass3#foo` will *not* have its documentation
populated from `MyClass` because `MyClass2#foo` is not explicitly documented
(although it exists as it gets it from `MyClass`).

This is because the inheriting of doclets from parent classes only happens
*after* all the plugins have run (right before the documentation output is
generated), and hence the plugins never get to see the full doclet set (that
includes all the inherited symbols).

It may be possible to fix this but I am not sure what will happen if all the
superclasses are specified in varying file orders (say the grandparent class
is encountered before the child one which is encountered before the parent one).
