/** A class.
 * See {@link #foo}, {@link ~foo} and {@link .foo}.
 * @classdesc
 * See {@link #foo}, {@link ~foo} and {@link .foo}.
 * @class
 * @since version 1. Otherwise see {@link #foo}.
 * @deprecated test {@link .foo}
 */
function MyClass() {
    /** The instance method foo.
     * @param {number} x - See {@link ~foo}
     * @returns {number} See {@link .foo}
     * @todo {@link #foo} */
    this.foo = function (x) {
    };

    /** inner method foo */
    var foo = function () {
    };
}

/** The static method foo. */
MyClass.foo = function () {
};

// test in a namespace
/** A namespace.
 * See {@link .foo}.
 * @see MyClass
 * @namespace */
var MyNamespace = {
    /** Foo.
     * @type {Object}
     * @property {number} x - see {@link .bar}
     * @fires .my-event
     */
    foo: {},

    /** function.
     * @this .foo */
    bar: function () {
    }

    /** Event
     * @event
     * @name my-event
     * @memberof MyNamespace
     */
};

// test an enum
/** An enum
 * @enum */
var MyEnum = {
    /** value 1. see {@link .VAL2} */
    VAL1: 1,
    /** value 2. */
    VAL2: 2
};
