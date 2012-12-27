/*global env: true */
/**
 * @summary Automatically pretty print code in `<pre><code>` tags.
 * @overview
 * This plugin automatically pretty prints anything in `<pre><code>` tags,
 * in particular markdown code blocks.
 * **If you are using the markdown plugin, this should appear after it in
 * `conf.json`.**
 *
 * Note that code in an `@example` tag is already pretty printed by default -
 * you don't need this plugin for that. It is mainly for markdown code blocks.
 *
 * For example, the following is written with the indenting method of markdown
 * and will be rendered pretty printed rather than plain:
 *
 * ```none
 *     console.log("Hello world!");
 * ```
 *
 * which gives:
 *
 *     console.log("Hello world!");
 *
 * Alternatively, one can use the fencing syntax (*if* github-flavoured markdown
 * is specified as the parser):
 *
 * ```none
 * &#x60;&#x60;&#x60;python
 * print "Hello world!"
 * &#x60;&#x60;&#x60;
 * ```
 * or:
 *
 * ```none
 * &#x60;&#x60;&#x60;
 * console.log("Hello world!");
 * &#x60;&#x60;&#x60;
 * ```
 *
 * which gives:
 *
 * ```python
 * print "Hello world!"
 * ```
 *
 * and
 *
 * ```
 * console.log("Hello world!");
 * ```
 *
 * In this way one can force the language for syntax highlighting (although by
 * default, prettyprint will detect the language for you).
 *
 * To force plain printing instead of pretty-printing, use the fencing syntax
 * with language 'none':
 *
 * ```none
 * &#x60;&#x60;&#x60;none
 * This will not be pretty-printed
 * &#x60;&#x60;&#x60;
 * ```
 *
 * which yields:
 *
 * ```none
 * This will not be pretty-printed
 * ```
 *
 * @module plugins/prettyPrintCode
 * @author Amy Chan <mathematical.coffee@gmail.com>
 * @example
 * // an example to see how things are pretty-printed in the @example tag
 * console.log("Hello world!");
 */

// we process the same tags as the markdown plugin.
var conf = env.conf.markdown;
var defaultTags = [ "classdesc", "description", "params", "properties", "returns" ];
var tags;

var LangToCode = {
    javascript: 'js',
    python: 'py',
    ruby: 'rb',
    perl: 'pl',
    bash: 'bash',
    matlab: 'm',
};
function convertToPrettyPrint(html) {
    return html.replace(/<pre([^>]*?(\bclass\s*=\s*(["'])([^\3]+)\3)?[^>]*)(>\s*<code[^>]*?>)/gi, function (wholeMatch, preAttr, classString, quote, class_, rest) {
        // append to existing class, if any.
        if (class_) {
            if (class_.match(/\bprettyprint\b/)) {
                return wholeMatch;
            } else {
                preAttr = preAttr.replace(classString, 'class="prettyprint ' + class_ + '"');
            }
        } else {
            preAttr = 'class="prettyprint" ' + preAttr;
        }
        return '<pre ' + preAttr + rest;
    })
    .replace(/(<div class="highlight"><pre lang="([a-zA-Z\-]*)")>/gi, function (wholeMatch, first, lang) {
        if (lang === "none") {
            return wholeMatch;
        } else {
            return first + ' class="prettyprint' + (lang ? ' lang-' + (LangToCode[lang] || lang) : '') + '">';
        }
    });
}
/** [ALMOST SAME AS MARKDOWN PLUGIN]
 * Process the source in a doclet. The properties that should be
 * processed are configurable, but always include "classdesc", "description",
 * "params", "properties", and "returns".  Handled properties can be bare
 * strings, objects, or arrays of objects.
 */
function process(doclet) {
    tags.forEach(function(tag) {
        if (!doclet.hasOwnProperty(tag)) {
            return;
        }

        if (typeof doclet[tag] === "string") {
            doclet[tag] = convertToPrettyPrint(doclet[tag]);
        } else if (doclet[tag] instanceof Array) {
            doclet[tag].forEach(process);
        } else if (doclet[tag]) {
            process(doclet[tag]);
        }
    });
}

// set up the list of "tags" (properties) to process (same as markdown plugin)
if (conf && conf.tags) {
    tags = conf.tags.slice();

    defaultTags.forEach(function(tag) {
        if (tags.indexOf(tag) === -1) {
            tags.push(tag);
        }
    });
} else {
    tags = defaultTags;
}

exports.handlers = {
    newDoclet: function (e) {
        process(e.doclet);
    }
};

/** Test: Indented code to be pretty-printed.
 *
 *     console.log("Hello world!");
 */
var test_indented_code_block;
/** Test: Fenced code blocks are pretty-printed.
 * ```
 * console.log("Hello world!");
 * ```
 */
var test_fenced_code_block;
/** Test: Fenced code blocks with language specification are pretty-printed.
 * ```python
 * print "Hello world!"
 * ```
 */
var test_fenced_code_block_with_language;
/** Test: Fenced code block with language 'none' is not pretty-printed.
 * ```none
 * Hello, world!
 * ```
 */
var test_forced_no_pretty_print;
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
