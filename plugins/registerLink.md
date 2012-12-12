## registerLink
This plugin allows one to register a symbol to a URL with a new tag @registerlink.

**Status**: ready, stable.  
**Location**: [myPlugins branch on my jsdoc3 fork](https://github.com/mathematicalcoffee/jsdoc/blob/myPlugins/plugins/registerLink.js)  
**Author**: mathematical.coffee <mathematical.coffee@gmail.com>

### Description
This plugin allows one to register a symbol to a URL with a new tag `@registerlink`.

For example:

    @registerlink Doclet http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/1208b21f54.html

means that `{@link Doclet}` will be resolved to a link with text 'Doclet' and
pointing to http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/1208b21f54.html.

This works anywhere you'd expect a link to work. For example:

    @param {Doclet} doclet - explanation

will also create a link for the Doclet type.

Although the `@registerlink` tags can appear in any doclet, it is best if they
appear in a doclet on their own or down the end of a doclet, as all text following
a `@registerlink` tag is gobbled up. For example:

    /**
    My description blah blah blah
    @registerlink Foo http://bar.com
    this part here will not be part of the description, but instead ignored!
    */

Note - this *doesn't* modify the comment/source before it gets parsed.
Rather, it registers the links with the template helper so you will not
see the links until they get published in the documentation.

If there are multiple `@registerlink`s for the same symbol, only the last
URL the parser encounters for it will be used.

To specify a set of `@registerlink` declarations all at once you can include
them in their own, **non-javascript** file like so:

    @registerlink Foo http://foo.com
    @registerlink Bar http://bar.com
    @registerlink baz http://baz.com

Then add the path to this file (or these files) to your conf.json like so:

    "registerLink": {
        "files": [ "relative/path/to/links/file",
                   "/absolute/path/to/another/links/file" ]
    }

If the path is relative, it is relative to the directory that the conf.json file
resides in.
