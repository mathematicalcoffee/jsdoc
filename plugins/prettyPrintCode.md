# prettyPrintCode plugin

**Status**: stable.
**Location**: [myPlugins branch on my jsdoc3 fork](https://github.com/mathematicalcoffee/jsdoc/blob/myPlugins/plugins/prettyPrintCode.js)  
**Author**: mathematical.coffee <mathematical.coffee@gmail.com>

This plugin automatically pretty prints anything in `<pre><code>` tags,
including markdown code blocks.
**If you are using the markdown plugin, this should appear *after* it in `conf.json`.

Note that by default `@example` blocks are already pretty printed without the
use of this plugin; the main use for this plugin is for prettifying code bocks
written in the markdown syntax.

## Syntax
Any code block produced by markdown will be pretty-printed.

For example, the following is written with the indenting method of markdown
and will be rendered pretty printed rather than plain:

```none
    console.log("Hello world!");
```

which gives:

```javascript
console.log("Hello world!");
```
Alternatively, one can use the fencing syntax (*if* github-flavoured markdown is specified as the parser):

    ```python
    print "Hello world!"
    ```
or:

    ```
    console.log("Hello world!");
    ```

which gives:

```python
print "Hello world!"
```

and

```javascript
console.log("Hello world!");
```

In this way one can force the language for syntax highlighting (although by default, prettyprint will detect the language for you).

To force plain printing instead of pretty-printing, use the fencing syntax
with language 'none':

    ```none
    This will not be pretty-printed
    ```

which yields:

```none
This will not be pretty-printed
```

## Using the plugin

Ensure the markdown and prettyPrintCode plugins are enabled in `conf.json`:

    "plugins": [
        "plugins/markdown",
        "plugins/prettyPrintCode"
    ]

If you wish to use the code-fencing syntax (three backticks start and end a code block),
also enable github-flavoured markdown:

    "markdown": {
        "parser": "gfm"
    }


## Examples
The following:

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

is rendered as:

![prettyPrintCode example](https://raw.github.com/mathematicalcoffee/jsdoc/plugin-prettyprint-code/plugins/prettyPrintCode_example.png)  
