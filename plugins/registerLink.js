/*global console, require, exports, env */
/*jshint maxlen:160 */
/**
 * @overview
 * This plugin allows one to register a symbol to a URL with
 * a new tag @registerlink.
 *
 * Although they can appear in any doclet, it is best if they appear in a
 * doclet on their own or down the end of a doclet.
 * If it appears in the middle of a description for example, it *will* cause
 * the remainder of the description to be discarded.
 *
 * The example down the end of this doclet means that whenever I do
 * {@link Doclet}, it will be a link with text 'Doclet' linking to
 * http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/1208b21f54.html.
 *
 * Likewise, if used in a @param or @type doclet it will link appropriately,
 * so @param {Doclet} doclet will render Doclet as a link.
 *
 * Note - this *doesn't* modify the comment/source before it gets parsed.
 * Rather, it registers the links with the template helper so you will not
 * see the links until they get published in the documentation.
 *
 * If there are multiple @registerlinks for the same symbol, only the last
 * URL the parser encounters for it will be used.
 *
 * To specify a set of @registerlink declarations all at once, you can create
 * a (non-javascript!) file with them in, without any jsdoc decorators. The
 * file will just have lines of '@registerlink symbol URL' in it.
 *
 * Then, edit your conf.json to have a registerLink property and put the files
 * in its "files" property as an array. The paths are **relative to the location
 * of conf.json, or absolute**.
 *
 * "registerLink": {
 *    "files": [ "path/to/my/list/of/links" ]
 * }
 *
 * If you have multiple of these lists of links in various files add them there.
 *
 * **REMINDER**: do not make them javascript files, and the content of the file
 * has NO comment decorators.
 *
 * @registerlink Doclet http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/1208b21f54.html
 * @registerlink Tag http://usejsdoc.org/Jake/API/jsdoc/rhino_modules-jsdoc/2e92ec08d7.html
 *
 * Text here will not be included in the above @overview because of the @registerlink
 * cutting it off. It will be considered part of the @registerlink tag.
 *
 * @author Amy Chan <mathematical.coffee@gmail.com>
 */

var fs = require('fs');
var path = require('path');
var helper = require('jsdoc/util/templateHelper');

var doneReadingExternalFiles = false;

/** Parses '@registerlink symbol URL', similar to parseBorrows
 * @param {Doclet} doclet - doclet
 * @param {Tag} tag - tag. */
function parseRegisterLink(doclet, tag) {
    var m = /^(\S+)\s+(\S+)$/m.exec(tag.text);
    if (m && m[1] && m[2]) {
        return { symbol: m[1], url: m[2] };
    }
    return null;
}

exports.defineTags = function (dictionary) {
    // define a tag @registerlink
    dictionary.defineTag('registerlink', {
        mustHaveValue: true,
        onTagged: function (doclet, tag) {
            var info = parseRegisterLink(doclet, tag);
            if (info) {
                //console.log('registering symbol ' + info.symbol + ' to ' + info.url);
                helper.registerLink(info.symbol, info.url);
            }
        }
    });
};

exports.handlers = {
    beforeParse: function (e) {
        if (doneReadingExternalFiles) {
            return;
        }

        var files = env.conf.registerLink && env.conf.registerLink.files;
        if (files) {
            var declarations = '';

            if (!(files instanceof Array)) { files = [files]; }
            var confPath = path.resolve(env.opts.configure);
            var f = new java.io.File(confPath);
            if (!f.isDirectory()) {
                confPath = path.dirname(confPath);
            }

            for (var i = 0; i < files.length; ++i) {
                var fullPath = (files[i].charAt(0) === '/' ?
                                    files[i] :
                                    path.join(confPath, files[i]));
                declarations += '\n' + fs.readFileSync(fullPath, 'utf8');
            }

            e.source = '/**\n' + declarations + '\n*/\n' + e.source;
            doneReadingExternalFiles = true;
        }
    }
};
