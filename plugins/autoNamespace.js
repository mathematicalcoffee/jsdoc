/*global console, require, app, exports */
/*jshint maxlen:160 */
/**
 * @overview
 * This file adds an automatic namespace to all objects, being the name of the
 * file OR the value of the @autonamespace tag (if provided).
 * The first letter is capitalized, and ALL non-letter/number/underscore
 * characters are removed (so 'doStuff-123_456.js' turns into namespace
 * 'DoStuff123_456').
 *
 * Links to objects within this file do not have to include the namespace name,
 * although links to *other* files do have to include that file's namespace.
 *
 * To use a different name for the automatic namespace than the file's name,
 * use tag `@autonamespace NewNamespaceName`.
 *
 * `@autonamespace X` is equivalent to `@namespace; @name X` (with a newline
 * in place of the ';') but is required if you wish to
 *
 * The @autonamespace tag should appear on its own, like a @namespace tag
 * would. Descriptions/summaries/etc will be carried over.
 *
 * If there is a doclet for the file and the autonamespace doclet has no
 * description/summary, we will copy the file's description/summary to the
 * namespace's doclet.
 *
 * Note that if you have a symbol in your file with the *same name* as the
 * automatic namespace, links to the symbol/automatic namespace are
 * *always* resolved to the existing symbol. If you wish to link the
 * namespace, use `{@link namespace:Namespacename}`.
 *
 * This plugin also attempts to change the scope of objects in the file to match
 * their namespace-nested state.
 *
 * Tags affected:
 * + classdesc
 * + description
 * + params
 * + properties
 * + returns
 * + deprecated
 * + this
 * + augments
 * + fires
 * + see
 * + since
 * + deprecated
 * + summary
 * + todo
 *
 * CAVEATS
 * * if you use the autonamespace plugin with a module, that's your fault!
 *
 * TODO
 * + a tag telling autonamespace to skip this file? @noautonamespace OR
 * + **@autonamespace** tag must be present in all files, and if it has
 *   a value that is the namespace name.
 * + namespace in a module?
 *
 * @author Amy Chan <mathematical.coffee@gmail.com>
 */
/** The automatic namespace we are currently using. */
var namespaceName;
var hasAutoNamespace = false;

// storage
var namespaceDoclet;
var fileDoclet;
//var namespaceDoclet;
//var fileOverview;
//var skipTypes = ['file', 'namespace'];
//var array_properties = ['see', 'extends', 'fires', 'inheritdocs'];
//var string_properties = ['comment', 'description', 'summary', 'classdesc'];

// we only resolve links to doclets within this file.
var docletsForThisFile = [];

var jsdoc = {doclet: require('jsdoc/doclet'), name: require('jsdoc/name')};
var path = require('path');

// these tags may have inline {@link} to be converted.
var textTags = ['comment', 'description', 'classdesc', 'params',
    'returns', 'properties', 'deprecated', 'summary', 'since', 'todo'];
// these tags always refer to a symbol and do not need {@link }
var symbolLinkTags = ['this', 'augments', 'fires'];
// These tags can have either {@link} or a straight symbol
var mixedTags = ['see'];
// these tags are handled explicitly
var otherTags = [];

/** all the tags we will search through. */
var propsToConvert = textTags.concat(symbolLinkTags.concat(mixedTags.concat(otherTags)));

// convenience
var nchars = 'namespace:'.length;

// ---------------------------- Helper functions ---------------------------- //
/** If this returns true, `doclet` should *never* be resolved to within the
 * automatic namespace */
function neverInAutoNamespace(doclet) {
    if (doclet.kind === 'module' || doclet.kind === 'file') {
        return true;
    }
    if (doclet.kind === 'namespace' && doclet.name === namespaceName) {
        return true;
    }
    return false;
}

/** Resolves a link to `symbol` by prepending the namespace {@link namespaceName}
 * to it, if it exists in `docletIndex`.
 * @param {string} symbol - symbol to look up and resolve.
 * @param {Object.<string, Doclet>} docletIndex - object that acts as a doclet
 * dictionary: indexed by longname (before the namespace was prepended) or
 * by the name if the longname doesn't exist, pointing to the corresponding
 * doclet.
 * @returns {string} if `symbol` was found in `docletIndex`, it returns
 * "{@link namespaceName}.symbol". Otherwise, it returns `symbol`.
 * @todo check {@link AutoNamespace} links to the namespace
 * @see namespaceName
 * @see {@link convertLinkTags} which resolves a string that may have link tags
 */
function convertEntireText(symbol, docletIndex) {
    symbol = symbol.trim();

    // explicit namespace link, do not resolve but just strip the namespace:
    if (symbol.substr(0, nchars) === 'namespace:') {
        symbol = symbol.substr(nchars);
        return symbol;
    }
    var doclet = docletIndex[symbol];
    if (doclet && !neverInAutoNamespace(doclet)) {
        return namespaceName + '.' + symbol;
    }
    return symbol;
}

/** Converts all link tags in `text` resolving them with {@link convertEntireText}.
 * @see {@link convertEntireText}
 * @param {string} text - text to convert, possibly with link tags in it.
 * @param {Object.<string, Doclet>} docletIndex - see {@link convertEntireText}.
 * @returns {string} `text` with all link tags resolved to the current namespace if possible, uses {@link convertEntireText}.
 */
function convertLinkTags(text, docletIndex) {
    return text.replace(/\{@link *([^}]+?)([| ][^}]+)?\}/g, function (wholeMatch, symbol, rest) {
        // rest is the anchor text (if present)
        return '{@link ' + convertEntireText(symbol, docletIndex) + (rest || '') + '}';
    });
}

/** Resolves all link tags/symbol references in `text`.
 * `tag` is used to determine whether `text` is expected to contain link
 * tags, be an entire symbol on its own, or be one of these (but which is
 * not known).
 * @param {string} text - see {@link convertLinkTags}
 * @param {string} tag - the tag the text came from (e.g. 'see')
 * @param {Object.<string, Doclet>} docletIndex - see {@link convertEntireText}.
 * @returns {string} `text` with all link tags resolved to the automatic
 * namespace
 */
function resolveLinkTags(text, tag, docletIndex) {
    if (textTags.indexOf(tag) > -1) {
        // replace {@link [#.~]... } with resolved link.
        return convertLinkTags(text, docletIndex);
    } else if (symbolLinkTags.indexOf(tag) > -1) {
        // no {@link } but `text` is meant to entirely resolve to a symbol.
        return convertEntireText(text, docletIndex);
    } else if (mixedTags.indexOf(tag) > -1) {
        // it could either be {@link .. } or a whole word.
        // just look it up and see if it's in the dictionary.
        var fixed = convertEntireText(text, docletIndex);
        return (fixed !== text ? fixed : convertLinkTags(text, docletIndex));
    } else {
        console.log('resolveLinkTags: unrecognised tag ' + tag);
    }
    return text;
}

/** Similar to the markdown plugin's process function.
 *
 * Recursively processes a doclet, resolving all the links we find.
 * @see propsToConvert
 * @see a purposely broken link {@link broken}
 */
function resolveLinks(doclet, docletIndex) {
    propsToConvert.forEach(function (tag) {
        if (!doclet.hasOwnProperty(tag)) {
            return;
        }

        if (typeof doclet[tag] === "string") {
            doclet[tag] = resolveLinkTags(doclet[tag], tag, docletIndex);
        } else if (doclet[tag] instanceof Array) {
            // If it's an array of strings we assume that each element should
            // be resolved (e.g. @see or @augments).
            // Otherwise we recurse into it with resolveLinks.
            if (doclet[tag].filter(function (x) {
                return typeof x !== 'string';
            }).length) {
                doclet[tag].forEach(function (x) {
                    resolveLinks(x, docletIndex);
                });
            } else {
                doclet[tag].forEach(function (x, i) {
                    doclet[tag][i] = resolveLinkTags(doclet[tag][i], tag, docletIndex);
                });
            }
        } else if (doclet[tag]) {
            resolveLinks(doclet[tag], docletIndex);
        }
    });
}

/** Makes each doclet a member of the automatic namespace, and produces
 * a dictionary of them.
 * @param {Doclet[]} doclets - array of doclets to add the namespace to.
 * @returns {Object.<string, Doclet>} object mapping doclet longname to
 * doclet, to be used to resolve links.
 * @see resolveAllLinks
 * @todo skip some?
 */
function addAutoNamespace(doclets) {
    var index = {};
    doclets.forEach(function (d) {
        index[d.longname || d.name] = d;
        if (neverInAutoNamespace(d)) {
            // this doclet should not be made a member of the automatic namespace
            return;
        }
        var origName = d.longname;
        // do a dumb prepend of namespaceName. to the doclet's longname.
        if (!d.longname) {
            d.longname = namespaceName;
        } else {
            d.longname = namespaceName + '.' + d.longname;
        }

        // add it to memberof.
        if (!d.memberof) {
            d.memberof = namespaceName;
        } else {
            d.memberof = namespaceName + '.' + d.memberof;
        }

        // change its scope *if* it exists and is `global` (?)
        if (d.scope === 'global') {
            d.scope = 'static';
        }

        //console.log('converting ' + origName + ' to ' + d.longname);
    });
    return index;
}

/** resolves all links for doclets in `doclets` using `index` as the dictionary
 * of known symbols */
function resolveAllLinks(doclets, index) {
    doclets.forEach(function (d) {
        resolveLinks(d, index);
    });
}

// ----------------------------------------------------------------------
// helper functions to add a doclet to the parser
// same as rhino_modules/jsdoc/src/handlers~filter
function filter(doclet) {
    if (/#$/.test(doclet.longname)) {
        return true;
    }
    if (doclet.meta.code && doclet.meta.code.name === '____') {
        return true;
    }
    return false;
}

// same as rhino_modules/jsdoc/src/handlers~addDoclet
function addDoclet(newDoclet) {
    var e = {doclet: newDoclet};
    // note : if the user is using a custom parser in a script then it might
    // not be app.jsdoc.parser!
    app.jsdoc.parser.emit('newDoclet', e);
    if (!e.defaultPrevented) {
        if (!filter(newDoclet)) {
            app.jsdoc.parser.addResult(newDoclet);
        }
    }
}

/** Sanitize `text` to be a namespace:
 *
 * 1. capitalize first letter
 * 2. remove all non letters/numbers/underscore
 */
function sanitizeNamespace(text) {
    return (text[0].toUpperCase() + text.substr(1)).replace(/[^\w]/g, '');
}

function addNamespaceDoclet(comment, meta) {
    meta = meta || {};
    meta.comment = comment;
    var newDoclet = new jsdoc.doclet.Doclet(comment, meta);
    addDoclet(newDoclet);
    return newDoclet;
}

exports.defineTags = function (dictionary) {
    // define a tag @autonamespace with the new name
    dictionary.defineTag('autonamespace', {
        mustHaveValue: true,
        onTagged: function (doclet, tag) {
            if (hasAutoNamespace) {
               if (tag.value !== namespaceName) {
                    require('jsdoc/util/error').handle(new Error(
                        "AutoNamespace plugin: multiple @autonamespace detected in file " + doclet.meta.filename
                        )
                    );
               }
            } else {
                namespaceName = sanitizeNamespace(tag.value);
                hasAutoNamespace = true;
                // add the doclet.
                var comment = doclet.comment.replace('@autonamespace', '@namespace');
                namespaceDoclet = addNamespaceDoclet(comment, {
                    filename: doclet.meta.filename,
                    lineno: doclet.meta.lineno
                });
                // TODO: now ignore this doclet - make sure if there's an
                // undocumented thing after us we don't get used for it.
            }
        }
    });
};
// -------------------------------------------------------------------------- //
exports.handlers = {
    beforeParse: function (e) {
        // no detected @autonamespace tag (although they could trick us by
        // including it in a string)
        if (!/(?:^|[^'"])\/\*(?:\*|\!\*)(?![\*\/])(?:(?:[^\*]|\*(?!\/))+^)?[\*\s]*@autonamespace/m.test(e.source)) {
            var tmp = path.basename(e.filename).split('.')[0];
            // first letter capital
            tmp = sanitizeNamespace(tmp);
            // add the namespace name up the top of the file (if the user additionally
            // specified it, it will be overridden so that's ok).
            e.source = '/** @autonamespace ' + tmp + '*/\n' + e.source;
        }
    },

    /** add the doclet to our list of doclets in this file */
    newDoclet: function (e) {
        //console.log('newDoclet: ' + e.doclet.name + '(' + e.doclet.undocumented + ')');

        var d = e.doclet;
        if (d.kind === 'file') {
            fileDoclet = e.doclet;
        }

        if (d.undocumented) {
            return;
        }
        docletsForThisFile.push(d);
    },

    /** once we are finished collecting all the doclets for the file, go
     * and resolve the links to symbols in this file if possible.
     *
     * Since this is a per-file plugin (we add the namespace on a per-file
     * basis), once the file is *complete* we go back and resolve all the links
     * to ensure they are to this file.
     */
    fileComplete: function (e) {

        // first we have to add the fake namespaces (we don't do it in
        // newDoclet in case @autonamespace is added later).
        var index = addAutoNamespace(docletsForThisFile);
        resolveAllLinks(docletsForThisFile, index);

        // copy over the @summary and @description of the file to the
        // namespace doclet (if it didn't exist).
        //console.log('fileDoclet: ' + '\n' + fileDoclet.description);
        if (namespaceDoclet && fileDoclet &&
                !namespaceDoclet.description && fileDoclet.description) {
            namespaceDoclet.description = fileDoclet.description;
        }
        if (namespaceDoclet && fileDoclet &&
                !namespaceDoclet.summary && fileDoclet.summary) {
            namespaceDoclet.summary = fileDoclet.summary;
        }

        // reset
        docletsForThisFile = [];
        namespaceDoclet = null;
        fileDoclet = null;
        hasAutoNamespace = false;
    }
};

// for testing
exports.sanitizeNamespace = sanitizeNamespace;

