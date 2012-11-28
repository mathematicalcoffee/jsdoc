/**
 * @overview
 * Add pragma tags to JSDoc.
 *
 * This adds tags '@+' and '@-' that mean "every tag from now onwards should have
 * these tags applied to it".
 *
 * NOTE: In the example below, end comments (asterisk forward slash) have had
 * a space added in between because I thought I'd document this module in JSDOC3
 * but it can't handle end comments inside the legitimate comment!
 *
 * @example
 * // In this example, we add @default, @const and @type {string} to every
 * // constant between the @+ and @-, saving a bit of typing and improving
 * // readability.
 *
 * /** @+
 *  * @default
 *  * @const
 *  * @type {string}
 *  * /
 * /** a constant * /
 * const ABCD = 'fda';
 * /** another constant * /
 * const FDK = 'ljasf';
 * /** and another * /
 * const LKSJD = 'lajsdf';
 * /** @- * /
 *
 * @module plugins/pragmaTag
 * @author Amy Chan <mathematical.coffee@gmail.com>
 */

var error = require('jsdoc/util/error');
var doclet = require('jsdoc/doclet');

var addedComments = [];
var first = -1;
var last = -1;
var incompletedStack = [];

var currentlyInEffect = [];

// tag finding happens separately to the handlers so you'll have to determine
// line numbers.
exports.defineTags = function (dictionary) {
    /* NOTE:
     * There is an issue where if you have the @+ or @- tag and then
     * an undocumented symbol after, the the @+ or @- block is *re-used*
     * for the undocumented symbol, screwing our comment stack up.
     *
     * To avoid this we add /** @undocumented * / after every @+ and @-
     * block to avoid the @+ and @- blocks from being used twice.
     *
     * We do this with the beforeParse event.
     */
    dictionary.defineTag('+', {
        onTagged: function (doclet, tag) {
            //console.log('found tag @+, line ' + doclet.meta.lineno);
            if (first < 0) {
                first = doclet.meta.lineno;
            }

            // replace `/**` up to the first proper `@`.
            var commentText = doclet.comment.replace(/^\s*\/\*\*[^@]*@\+/, '').trim();
            // replace last `* /`
            commentText = commentText.replace(/\s*\*\/\s*$/, '').trim();
            addedComments.push({
                start: doclet.meta.lineno,
                text: commentText,
                end: -1
            });
            incompletedStack.push(addedComments.length - 1);
            doclet.addTag('undocumented');
            currentlyInEffect.push(commentText);
        }
    });

    dictionary.defineTag('-', {
        onTagged: function (doclet, tag) {
            //console.log('found tag @-, line ' + doclet.meta.lineno);
            last = doclet.meta.lineno;
            var i = incompletedStack.pop();

            if (!addedComments[i]) {
                var msg = "ERROR in file " + doclet.meta.filename +
                          ": @- tag found on line " + last +
                          " with no matching @+";
                error.handle(new Error(msg));
            }
            addedComments[i].end = last;
            doclet.addTag('undocumented');
            currentlyInEffect.pop();
        }
    });
};

exports.handlers = {
    // protect each @+ and @- with a trailing /** @undocumented */
    // this one works brilliantly!
    beforeParse: function (e) {
        e.source = e.source.replace(/(\/\*\*[^\*\/]*?[\*\s]*@-(\*(?!\/)|[^*])*\*\/)/g,
                "$1\n/** @undocumented */");
        e.source = e.source.replace(/(\/\*\*[^\*\/]*?[\*\s]*@\+(\*(?!\/)|[^*])*\*\/)/g,
                "$1\n/** @undocumented */");
    },

    // note: jsdocCommentFound is the ideal event to use and we modify
    // e.comment which is ideally used to make a new doclet.
    //
    // HOWEVER, the modified e.comment is *only* used for a new doclet
    // if the doclet is virtual!
    // So between jsdocCommentFound (where modifying e.comment only works for
    // virtual doclets) and symbolFound (which only fires for non-virtual
    // doclets) we cover all doclets.
    // See # 228
    // Also note that jsdocCommentFound is called during the same run of the
    // code that the onTagged functions are, whereas symbolFound is called
    // after all of that (?)
    jsdocCommentFound: function (e) {
        // what about the @undocumented !!!
        if (!currentlyInEffect.length) {
            return;
        }
        if (/@[+\-]/.test(e.comment)) {
            return;
        }

        for (var i = 0; i < currentlyInEffect.length; ++i) {
            e.comment = e.comment.replace(/\s*\*\/\s*$/,
                    '\n' + currentlyInEffect[i] + '\n*/');
        }
    },

    symbolFound: function (e) {
        if (incompletedStack.length) {
            var msg = "ERROR in file " + e.filename + ": " +
                     "@+ tag(s) found with no matching @- tag(s)";
            error.handle(new Error(msg));
        }
        if (!e.comment) {
            return;
        }
        // filename, comment, id, lineno, astnode, code
        var lineno = e.lineno;
        // definitely out of scope of all doclets
        if (lineno < first || lineno > last) {
            return;
        }

        // possibly in scope of a doclet.
        for (var i = 0; i < addedComments.length; ++i) {
            var comment = addedComments[i];
            // this block of code is before the start of the pragma tag and
            // they're all ordered by start line, so it'll be before the start
            // of all subsequent pragma tags.
            if (lineno < comment.start) {
                break;
            }
            if (lineno >= comment.start && (comment.end < 0 || lineno <= comment.end)) {
                e.comment = e.comment.replace(/\s*\*\/\s*$/,
                        '\n' + comment.text + '\n*/');
            }
        }
    }
};
