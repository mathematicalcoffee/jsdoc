/* For the buildHierarchy function in templateHelper */

/** @module terrain */

/** @memberof! <global> */
const GLOBAL_VAR = 1;

/** @memberof! <global> 
 * @class */
function MyClass() {
    /** MyClass#x */
    this.x = 1;
    /** MyClass~x */
    var x = 2;
}

/** module:terrain~MyClass. Odd way to declare it I know.
 * @class */
function MyClass() {
}

/** @namespace */
var MyNamespace = {
    x: 2,

    /** @class */
    MyClass: function () {
        this.y = 3;
    },

    /** @namespace */
    MyNamespace: {
        /** @event
         * @name MyEvent
         * @memberof module:terrain~MyNamespace.MyNamespace */
    }
}
