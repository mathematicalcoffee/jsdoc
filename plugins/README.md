My Plugins
----

This branch (myPlugins) of my (mathematical.coffee) fork of JSDoc3 contains
a number of plugin I have written for JSDoc3 (in addition to the original
ones).

All plugins in here only make it in once they have tests added, so they are
meant to work on a basic level; however, **I do not guarantee that each plugin
fully works**.

The plugins here are mainly inspired by me needing that functionality and hence
are developed to a point where they work for me and no further, so keep that
in mind before using them. I am happy to accept fixes or enhancements for them.

Each plugin comes with a readme file, `pluginName.md`, for you to learn
how to use it, view an example, and perhaps find out known limitations/issues.

Summary of plugins
-----

* [autoNamespace](#autonamespace) - automatically treats each file as if it had its own namespace.
* [registerLink](#registerlink) - allows you to add a symbol (e.g. a type) with an external URL
* [relativeLink](#relativelink) - provides relative links `{@link #foo}`.
* [inheritDoc](#inheritdoc) - borrow parameter/returns and other documentation from other doclets into this one.
* [pragmaTag](#pragmatag) - add tags to all doclets between `@+` and `@-`.
* [prettyPrintCode](#prettyPrintCode) - automatically pretty-print markdown code snippets.

## autoNamespace
Allows the user to have an automatic namespace assigned to each file.
For example everything in `foo.js` will appear under namespace Foo even though
it's documented as if it were global.

Tag `@autonamespace [namespacename]` acts like `@namespace; @name [namespacename]`
and overrides the default automatic namespace name (the file name).

See [autoNamespace.md](../../../blob/myPlugins/plugins/autoNamespace.md).

## inheritDoc
Provides tag `@inheritparams [other symbol]` which recycles the parameter and `@returns`
documentation from `[other symbol]` to the current one (for common parameters),
unless they are explictly documented in the current doclet.

Tag `@inheritdoc [other symbol]` works as `@inheritparams` but also copies the
description/summary/classdesc (if not explicitly documented in the inheriting
doclet), and adds a link to `[other symbol]` in the current doclet's `@see`.

Tag `@override` is th same as `@inheritdoc [other symbol]` but doesn't require
specification of the other symbol; use it when documenting a method that
shadows a superclass one and `[other symbol]` will be automatically guessed
(as `ParentClass#method`) for you.

See [inheritDoc.md](../../../blob/myPlugins/plugins/inheritDoc.md).

## pragmaTag
Use tag `@+` with a number of additional tags, and each of these will be added
to all subsequent doclets until the matching `@-` is found.

For example, `/**@+; @const */` (newline at the ';')
will cause `@const` to be added to each subsequent doclet until a `/** @- */`
is found.

See [pragmaTag.md](../../../blob/myPlugins/plugins/pragmaTag.md).

## prettyPrintCode
This automatically pretty-prints any code blocks as specified using Markdown syntax.
Both the indented code block and fenced code block (surrounded by three backticks) will be pretty-printed.

See [prettyPrintCode.md](../../../blob/myPlugins/plugins/prettyPrintCode.md).

## registerLink
Use tag '@registerLink symbol URL' so that whenever `symbol` is used
(be it in say `{@link symbol}` or `@type {symbol}`), it is a link to URL.

Useful if you have a type that's not part of your project and documented on some
other website, and you use (say) `@param {symbol} ...` often and want it to
resolve to the other website.

See [registerLink.md](../../../blob/myPlugins/plugins/registerLink.md).

## relativeLink
Basic support for relative links; `{@link #foo}`, `{@link ~foo}` and
`{@link .foo}` will be interpreted as belonging to the direct parent object
of the current doclet.

For example `{@link #foo}` from within a class doclet or doclet belonging to
a class will link to `{@link MyClass#foo}`.

See [relativeLink.md](../../../blob/myPlugins/plugins/relativeLinks.md).

Repository structure
-----
This branch should **only be merged into**, not developed on.

Each plugin has its own branch `[plugin-name]-plugin` (possibly
`[plugin-name]-plugin-dev`) where it is developed. All changes to a plugin
should be made on its dedicated branch.

Periodically each *stable* plugin's branch is merged *into* this branch.

**Only stable versions of plugins** should be merged into this branch; they
should all have tests and jsdoc should pass the tests.
