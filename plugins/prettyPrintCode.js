/**
 * @summary Automatically pretty print code in `<pre><code>` tags.
 * @overview
 * This plugin automatically pretty prints anything in `<pre><code>` tags,
 * in particular markdown code blocks.
 *
 * TODO: should be listed **AFTER** the markdown plugin.
 * @module plugins/prettyPrintCode
 * @author Amy Chan <mathematical.coffee@gmail.com>
 */

// we process the same tags as the markdown plugin.
var conf = env.conf.markdown;
var defaultTags = [ "classdesc", "description", "params", "properties", "returns" ];
var tags;

var LangToCode = {
    javascript: 'js',
    python: 'py',
    ruby: 'rb'
/*
  File extensions supported by default include
    "bsh", "c", "cc", "cpp", "cs", "csh", "cyc", "cv", "htm", "html",
    "java", "js", "m", "mxml", "perl", "pl", "pm", "py", "rb", "sh",
    "xhtml", "xml", "xsl".
*/
}
function convertToPrettyPrint(html) {
    return html.replace(/<pre([\s\S]*?)(>\s*<code[\s\S]*?>)/gi, function (preAttr, rest, wholeMatch) {
        // TODO: *append* to the existing class
        // if <pre> already has a 'class' attribute, do nothing
        if (preAttr.match(/ class\s*=["']/i)) {
            return wholeMatch;
        }
        return '<pre class="prettyPrint"' + preAttr + '><code' + codeAttr + '>';
    }).replace(/(<div class="highlight"><pre lang="([^"]+)")>/gi, function (first, lang, wholeMatch) {
        // TODO: remove the <div class="highlight"> and matching close div,
        // just replace with <pre class="prettyPrint" lang..><code>.
        return first + ' class="prettyPrint lang-' + (LangToCode[lang] || lang) + '">';
    });

    // TODO: ```javascript``` is <pre
    // TODO: ```javasctip --> js
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
            doclet[tag] = parse(doclet[tag]);
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
