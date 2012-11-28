## autoNamespace Plugin
This plugin allows the user to have an automatic namespace assigned to each
documented file.

**Status**: beta (current functionality appears to work in non-complex cases,
additional functionality may be added)  
**Location**: [myPlugins branch on my jsdoc3 fork](https://github.com/mathematicalcoffee/jsdoc/blob/myPlugins/plugins/autoNamespace.js)  
**Author**: mathematical.coffee <mathematical.coffee@gmail.com>

### Description
The plugin does two things:

* adds an automatic namespace to each documented file;
* resolves links within-file to that namespace.

#### Automatic Namespace
This plugin adds an automatic namespace to each documented file. Each
documented object within that file we be treated as if it were explicitly
documented as a `@memberof` this namespace.

The name of the namespace is by default the file name.
The first letter is capitalized, and ALL non-letter/number/underscore
characters are removed (so 'doStuff-123_456.js' turns into namespace
'DoStuff123_456').

To use a different name for the automatic namespace than the file's name,
use the new tag `@autonamespace NewNamespaceName`, with this doclet otherwise
acting as a `@namespace` tag (think of `@autonamespace [Name]` as being
equal to `@namespace; @name [Name]`:

    /** A namespace description, just as you would the @namespace tag.
     * @autonamespace MyNamespace
     */

If the tag is omitted, the file's name will be used instead.

#### Links
Links to objects within each file do not have to include the namespace name,
although links to *other* files do have to include that file's namespace.

For example, if in `foo.js` there is a function `myFunction`, to refer
to it from *within* `foo.js` `{@link myFunction}` will do (i.e. use links
as if each symbol were global instead of within a namespace).

However to refer to that function from within `bar.js`, you must use
`{@link Foo.myFunction}`.

#### Extras
If there is a doclet for the file and the autonamespace doclet has no
description/summary, we will copy the file's description/summary to the
namespace's doclet.

This plugin also attempts to change the scope of objects in the file to match
their namespace-nested state.

#### Tags affected:
+ classdesc
+ description
+ params
+ properties
+ returns
+ deprecated
+ this
+ augments
+ fires
+ see
+ since
+ deprecated
+ summary
+ todo

### Caveats

+ If you have a symbol in your file with the *same name* as the
automatic namespace, links to the symbol/automatic namespace are
*always* resolved to the existing symbol. If you wish to link the
namespace and not the symbol, use `{@link namespace:NamespaceName}`.
+ I am unsure how this works within a module (a namespace within a module?
  a module within a namespace?).
+ If you have a doclet that is documented as `@memberof SomeOtherClass`,
  `SomeOtherClass` is assumed to be a member of the automatic namespace. If
  in fact `SomeOtherClass` is in another namespace...too bad (fixes welcome!)

### TODO
+ turn on *explicit* mode for this plugin? That is, only files with
  `@autonamespace` in them will be given an automatic namespace, and if
  the tag has a value that will be the name of the namespace? (rather than
  doing this for *every* file found); OR
+ a tag telling autonamespace to *skip* this file? `@noautonamespace`
+ namespace in a module?

### Example

    /** @overview A file overview. If the @autonamespace tag is not specified
     * or if it is specified but has no description, this description will be
     * automagically used as the automatic namespace's description.
     * @summary File summary. ditto with this being used as the automatic namespace's
     * summary if that is not specified.
     */

    /** Namespace description.
     * Here we demonstrate how to override the name of the automatic namespace.
     * It will be MyNamespace.
     *
     * Since the namespace @summary has not been specified, the file's @summary will
     * be used for it.
     * @autonamespace MyNamespace
     */

    /** Corner case: a symbol with the same name as the namespace.
     * In this case {@link MyNamespace} will resolve to this function, and
     * to link to the namespace we must use {@link namespace:MyNamespace}.
     * If this function didn't exist then the 'namespace:' wouldn't be necessary. */
    function MyNamespace() {
    }

    /** A class.
     * Note that all linking can occur as if this was all in the global scope
     * (the @see, @augments, @fires, and even @link tags).
     *
     * For example {@link myFunction} will link to the function defined below
     * (the plugin will convert it to MyNamespace.myFunction).
     * @fires event:MyEvent
     * @class */
    function MyClass() {
    }

    /** a function */
    function myFunction () {
    }

    /** An event.
     * @event
     * @name MyEvent */
