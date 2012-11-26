/** a function
 * @param {number} x - x value
 * @param {number} y - y value
 * @returns {number} a number
 */
function myFunction (x, y) {
    return x + y;
}

// should inherit the y and z values + description, with overridden return value.
/** @inheritdoc myFunction3
 * @returns {number} another number */
function myFunction2 (y, z) {
}

// Daisy chaining - myFunction4 should get the y param for myFunction2
// Double inheritparams - myFunction4 should get x 
// In this case order matters. The y description will be that of myFunction
//  as it appears first.
/** Daisy chaining/double inherit test.
 * @param {number} x - overridden
 * @inheritparams myFunction
 * @inheritparams myFunction2 */
function myFunction4 (x, y, z) {
}

// should inherit the 'x' and 'returns'. 'y' should be overridden, 'a' should
// show up as 'undocumented'
/** another function
 * @inheritparams myFunction
 * @param {number} y - overridden
 * @param {number} z - z value
 */
function myFunction3 (x, y, z, a) {
    return x + y + z
}

//// @override  test
//// Note the @override are in the "wrong" order in the file - I need to test
//// that they work.

/** A class
 * @class */
function MyClass() {
    /** A function that does stuff.
     * @param {string} foo - explanation.
     * @returns {string} return value. */
    this.doStuff = function (foo) {
    };
}

/** A subclass of MyClass.
 * @class
 * @extends MyClass */
function MySubclass() {
    // this should get *everything* from the parent as well as our additional
    // 'bar' documentation and overridden returns.
    /** @override
     * @param {string} bar - explanation
     * @returns {string} another explanation
     */
    this.doStuff = function (foo, bar) {
    };
}

// to demonstrate that if we @override something not yet defined (until
// later in the file) it still works.
/** Another subclass to demonstrate that @override works when they are out of
 * file order.
 * @class
 * @inheritparams MyClass2
 * @extends MyClass2 */
function MySubclass2(x) {
    /** This description should override the inherited one
     * @override */
    this.doStuff2 = function (baz) {
    };
}

/** A class
 * @param {number} x - initial
 * @class */
function MyClass2(x) {
    /** A function that does stuff too.
     * @param {number} baz - asdf
     */
    this.doStuff2 = function (baz) {
    };
}

