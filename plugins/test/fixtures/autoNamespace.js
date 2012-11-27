/** @overview Try to override the namespace name. See {@link MyClass}.
 * @summary a test file. See {@link MyClass}.
 */
/** Namespace description, see {@link MyClass}
 * @autonamespace MyNamespace
 */

// an undocumented comment, test that the @autonamespace is not recycled here.
var asdf = 2;

/** A class.
 * @classdesc see {@link MyClass}
 * @fires event:MyEvent
 * @fires MyClass.ClassEvent
 * @todo document {@link event:MyEvent}
 * @deprecated See {@link MyObject}
 * @class */
function MyClass() {
}

/** An event belong to a class
 * @event
 * @name ClassEvent
 * @memberof MyClass */

/** An object.
 * @type {Object}
 * @this MyClass
 * @property {number} x - see {@link MyClass} */
var MyObject = {};

/** A subclass
 * @class
 * @see MyClass
 * @see {@link MyObject}
 * @see {@link http://fdsa.com}
 * @see Something else for details
 * @augments MyClass */
function MySubclass() {
    /** inner variable */
    var x = 2;
    /** instance variable */
    this.y = 3;
}

/** An event.
 * [{ @link namespace:MyNamespace}]{@link namespace:MyNamespace} should resolve to the namespace.
 * @since See {@link MyObject}
 * @event
 * @name MyEvent */

/** A nested namespace. See function {@link MySubNamespace.myFunction}.
 * @namespace */
var MySubNamespace = {

    /** A function */
    myFunction: function () {
    }
};

/** An enum. Values {@link MyEnum.ONE} and {@link MyEnum.TWO}.
 * @enum */
var MyEnum = {
    /** See {@link MyEnum} and {@link MyEnum.TWO} */
    ONE: 1,
    /** Two */
    TWO: 2
}

/** Corner case: a symbol with the same name as the namespace.
 * NOTE: in this case {@link MyNamespace} will resolve to the symbol */
function MyNamespace() {
}
