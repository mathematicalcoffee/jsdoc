# pragmaTag
This plugin allows doclets to be automatically added to each doclet occuring between a start and end point.

**Status**: ready, stable.  
**Location**: [myPlugins branch on my jsdoc3 fork](https://github.com/mathematicalcoffee/jsdoc/blob/myPlugins/plugins/pragmaTag.js)  
**Author**: mathematical.coffee <mathematical.coffee@gmail.com>

## Description
This adds tags `@+` and `@-` such that every doclet between a `@+` and its
corresponding `@-` has particular tags added to them.

The tags added to all the doclets are specified in the `@+` tag (see the
example, it's easier to understand that way).

The `@+` and `@-` tags can be nested. There must be the same number of `@-`
as `@+`.

## Example
In this example, we add `@default`, `@const` and `@type {number}` to every
constant between the `@+` and `@-`, saving a bit of typing and making the
sample quicker to read.

    // example: use of pragma tags for lots of constants
    // Let's document the following code:
    const MY_CONSTANT = 1;
    const MY_CONSTANT2 = 2;
    const MY_CONSTANT3 = 3;
    const MY_CONSTANT4 = 4;

    // ------ without pragma tags ------ // ------ with pragma tags ------ //
    /** Some documentation               // /** @+
     * @const                            //  * @const
     * @default                          //  * @default
     * @type {number} */                 //  * @type {number} */
    const MY_CONSTANT = 1;               //
                                         // /** Some documentation */
    /** Some documentation               // const MY_CONSTANT = 1;
     * @const                            //
     * @default                          // /** Some documentation */
     * @type {number} */                 // const MY_CONSTANT2 = 2;
    const MY_CONSTANT2 = 2;              //
                                         // /** Some documentation */
    /** Some documentation               // const MY_CONSTANT3 = 3;
     * @const                            //
     * @default                          // /** Some documentation */
     * @type {number} */                 // const MY_CONSTANT4 = 4;
    const MY_CONSTANT3 = 3;              //
                                         // /** @- */
    /** Some documentation               //
     * @const                            //
     * @default                          //
     * @type {number} */                 //
    const MY_CONSTANT4 = 4;              //
