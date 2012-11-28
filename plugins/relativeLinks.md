# relativeLink plugin
This plugin allows the user to specify links in a relative manner,
e.g. `{@link #foo}`, and have it resolve to the nearest container
(namespace/class/module/enum), e.g. `{@link MyClass#foo}`.

**Status**: beta (works, but could do with more intelligent link resolving).  
**Location**: [myPlugins branch on my jsdoc3 fork](https://github.com/mathematicalcoffee/jsdoc/blob/myPlugins/plugins/relativeLink.js)  
**Author**: mathematical.coffee <mathematical.coffee@gmail.com>

## Description
This plugin provides the ability to specify relative links in the `{@link}` tag.

Note - this will only work if the doclet occurs within the scope of
the referencing member.

For example, `{@link #name}` from the documentation of a method inside a
class will appropriately link to that class's name property.
However, doing `{@link #name}` in a global scope means nothing.

## Important Caveat
The method of resolving links is **dumb**: if the link tag
occurs within a particular doclet, we look up what that doclet is a member of
(class, namespace, module) and simply add that to the link.

Where a symbol may have multiple scopes, we only resolve relative to
the closest one.

For example, `{@link .foo}` in a class description will resolve to
`{@link MyClass.foo}` (even if this does not exist!), not `MyNamespace.foo`
where `MyClass` is in `MyNamespace`.

Likewise, `{@link [punctuation]method}` will always resolve to the closest
parent, for example the class in the case of class method documentation
(regardless of whether the class itself belongs to a namespace/module), or
to the module in top-level functions in a module.

There is one expception to this: when `@augments` or `@this` occurs in a
*class* doclet, these will be resolved relative to the class' enclosing
namespace/module rather than the class.

For example, if `MyClass` is in a namespace and `MyClass` `@augments .MySuperclass`,
this will be resolved to `MyNamespace.MySuperclass` rather than
`MyClass.MySuperclass`.

## Usage

Use the `@link` tag in any of the following ways:

    {@link ~Symbol}
    {@link #Symbol}
    {@link .Symbol}

Or, in any field that expects a symbol, precede the symbol with the corresponding
punctuation ~ (inner member), # (instance member) or . (static member):

    @see #Symbol

When a link like this is encountered in a particular doclet, we look up that
doclet's `memberof` property and simply prepend that to the link.

We **don't** check for existence of the symbol, so the plugin is dumb like that.

## Example

First example: documentation in a class doclet or a doclet of something that
is a member of that class will resolve relative links to that class.

    /** A class.
     * See {@link #foo} (instance member), {@link ~foo} (inner member) and
     * {@link .foo} (static member).
     *
     * This sort of linking also works within @see tags and is resolved relative
     * to the class.
     * @see #foo
     * @class
     */
    function MyClass() {
        /** The instance method foo. */
        this.foo = function () {
        };
        /** inner method foo */
        var foo = function () {
        };
    }
    /** The static method foo. */
    MyClass.foo = function () {
    };

Second example: relative links in a namespace doclet or a doclet that belongs
to a namespace will be resolved to that namespace.

    /** A namespace.
     * See {@link .foo}, which is MyNamespace.foo
     * @namespace */
    var MyNamespace = {
        /** Foo. Also works in @fires and so on (resolved relative to MyNamespace)
         * @fires .my-event
         */
        foo: {},

        /** Event
         * @event
         * @name my-event
         * @memberof MyNamespace
         */
    };

Third example: works within modules:

    /** A module.
     * See function {@link ~MyClass} which is module:myModule~MyClass .
     * @module myModule */

    /** A class. Note that {@link ~foo} resolves relative to MyClass, i.e.
     *  to module:myModule~MyClass~foo, NOT to module:myModule~foo
     * @class */
    function MyClass () {
    }

    /** A variable. See note in {@link ~MyClass}' description */
    var foo = 3;

In the example above you can also see a drawback of the plugin (since it doesn't
resolve links intelligently): links are *always* resolved to the closest
container doclet, even if it doesn't exist.

In the above `{@link ~foo}` within the class doclet resolves to `MyClass`'
inner member `foo` rather than `myModule`'s inner member `foo` as intended,
even though `MyClass~foo` *this not exist*.

## Tags affected

The following properties are processed for relative links:

* classdesc
* description
* params
* properties
* returns
* deprecated
* this
* augments
* fires
* see
* since
* deprecated
* summary
* todo
