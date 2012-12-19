# prettyPrintCode plugin
This plugin automatically pretty prints anything in `<pre><code>` tags,
including markdown code blocks.

Prettify automatically guesses the language to print in; if you wish to override
this you may specify it using the following markdown syntax:

    ```{language name}
    {code}
    ```

Note that by default `@example` blocks are already pretty printed without the
use of this plugin; the main use for this plugin is for prettifying code bocks
written in the markdown syntax.

**Status**: in development.
**Location**: [myPlugins branch on my jsdoc3 fork](https://github.com/mathematicalcoffee/jsdoc/blob/myPlugins/plugins/prettyPrintCode.js)  
**Author**: mathematical.coffee <mathematical.coffee@gmail.com>

## Usage
No particular usage needed; anything surrounded in `<pre><code>` tags will be
pretty-printed.

## Example

First example: documentation in a class doclet or a doclet of something that
is a member of that class will resolve relative links to that class.

    /** A function.
     *
     * Markdown converts the following to a code block but without this plugin it
     * won't be pretty-printed. With the plugin it will.
     *
     *     console.log("Hello world!");
     *
     * By default the prettify code can guess the language, but if you want to override
     * it you can usin the alternate markdown syntax:
     *
     * ```python
     * print "Hello world!"
     * ```
     * @example
     * // this is pretty printed by the base JSDoc; this plugin has no effect on that.
     * console.log("Hello world!");
     */
    function Hello() {
    }
