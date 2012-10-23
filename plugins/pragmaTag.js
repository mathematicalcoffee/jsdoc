// pragma tags.
// Adds tags '@+' and '@-' that mean "every tag from now onwards should have
// these tags applied to it".
//
// It's a bit hacky beacuse 'jsdocCommentFound' event doesn't work so we use
// 'symbolFound' event, consequence of which:
//
// * virtual doclets (no associated code) will be ignored.
//
// Example: mark the following with @default and @const and as strings
// /** @+
//  * @default
//  * @const
//  * @type {string}
//  */
// /** a constant */
// const ABCD = 'fda';
// /** another constant */
// const FDK = 'ljasf';
// /** and another */
// const LKSJD = 'lajsdf';
// /** @- */

var addedComments = [];
var first = -1;
var last = -1;
var current = -1;
//var addedProperties = [];
//var jsdoc = {doclet: require('jsdoc/doclet'), name: require('jsdoc/name')};
//var appended_properties = ['description', 'summary', 'classdesc'];

// tag finding happens separately to the handlers so you'll have to determine
// line numbers.
exports.defineTags = function (dictionary) {
    dictionary.defineTag('+', {
        onTagged: function (doclet, tag) {
            console.log('found tag @+');
            // ????? want to discard this doclet.
            // doclet.undocumented = true;
/*
            var newDoclet = new jsdoc.doclet.Doclet(
                doclet.comment.replace(/@\+/, ''),
                doclet
            );
            // things we don't want to copy over.
            delete newDoclet.name;
            delete newDoclet.longname;
            delete newDoclet.comment;
            delete newDoclet.meta;
            delete newDoclet.summary;
            delete newDoclet.description;
            delete newDoclet.classdesc;

            addedProperties.push(newDoclet);
*/
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
            current++;
        }
    });
    dictionary.defineTag('-', {
        onTagged: function (doclet, tag) {
            console.log('found tag @-');
            // ????? want to discard this doclet.
            // doclet.undocumented = true;
            last = doclet.meta.lineno;

            addedComments[current].end = last;
            current--;
        }
    });
};

exports.handlers = {
//    beforeParse: function (e) {
//        text = e.source;
//        lines = text.split('\n'); // note - do our line numbers agree with theirs?
//
//        // BAH if they do this */ then I'm screwed!
//        // /**
//        /* because this is also valid.
//         *  /**
//         // */
//        comments = [];
//        var n = lines.length;
//        var i = 0;
//        var inComment = false;
//        current = -1;
//        while (i < n) {
//            var line = lines[i];
//
//            // only look for `*/`, that will always end a comment if we are
//            // in a multiline one.
//            if (inComment) {
//                if (line.match(\*\/)) {
//                    comments[current].text += line.match(/^(.*)\*\//)[1];
//                    inComment = false;
//                } else {
//                    comments[current].text += line;
//                }
//            } else {
//                // find '//' not preceded by a /*; it's a comment
//                // (catch these to not get tricked by /* that do not start
//                // a comment)
//                if (line.match(/^([^\/]|\/[^*])*\/\//)) {
//                } else {
//                    // find the start of a comment.
//                    var matches;
//                    /** one line JSDoc comment */
//                    if ((matches = line.match(/\/\*\*(.+)\*\//))) {
//                        comments.push({
//                            start: i,
//                            end: i,
//                            text: matches[1]
//                        });
//                        current++;
//                    /* one line comment */
//                    } else if (line.match(/\/\*.*\*\//)) {
//                    /**
//                     * multiline JSDoc comment.
//                     */
//                    } else if ((matches = line.match(/\/\*\*(.*)$/))) {
//                        inComment = true;
//                        comments.push({
//                            start: i,
//                            end: -1,
//                            text: matches[1]
//                        });
//                        current++;
//                    /* multiline
//                     * comment */
//                    } else if (line.match(/\/\*)) {
//                        inComment = true;
//                    }
//                }
//            }
//            i++;
//        }
//    },
//    fileComplete: function (e) {
//        console.log(addedComments);
//    },
    symbolFound: function (e) {
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
                return;
            }
            if (lineno >= comment.start && (comment.end < 0 || lineno <= comment.end)) {
                e.comment = e.comment.replace(/\s*\*\/\s*$/,
                        '\n' + comment.text + '\n*/'); 
            }
        }
        //console.log(e.comment);
        //console.log('-------------------------------------');
    }
};
