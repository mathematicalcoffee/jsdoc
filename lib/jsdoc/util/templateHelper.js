/*global env: true */
/**
 * @module jsdoc/util/templateHelper
 */

var crypto = require('crypto');
var dictionary = require('jsdoc/tag/dictionary');
var name = require('jsdoc/name');
var hasOwnProp = Object.prototype.hasOwnProperty;

var files = {};

// each container gets its own html file
var containers = ['class', 'module', 'external', 'namespace', 'mixin'];

/** @external {jsdoc.tutorial.Tutorial} */
var tutorials;

/** Sets tutorials map.
    @param {jsdoc.tutorial.Tutorial} root - Root tutorial node.
 */
exports.setTutorials = function(root) {
    tutorials = root;
};

exports.globalName = 'global';
exports.fileExtension = '.html';
exports.scopeToPunc = { 'static': '.', 'inner': '~', 'instance': '#' };

function getNamespace(kind) {
    if (dictionary.isNamespace(kind)) {
        return kind + ':';
    }
    return '';
}

function makeFilenameUnique(filename, str) {
    var key = filename.toLowerCase();
    var nonUnique = true;

    // append enough underscores to make the filename unique
    while (nonUnique) {
        if ( files[key] && hasOwnProp.call(files, key) ) {
            filename += '_';
            key = filename.toLowerCase();
        } else {
            nonUnique = false;
        }
    }

    files[key] = str;
    return filename;
}

// compute it here just once
var nsprefix = /^(event|module|external):/;

/**
 * Convert a string to a unique filename, including an extension.
 *
 * Filenames are cached to ensure that they are used only once. For example, if the same string is
 * passed in twice, two different filenames will be returned.
 *
 * Also, filenames are not considered unique if they are capitalized differently but are otherwise
 * identical.
 * @param {string} str The string to convert.
 * @return {string} The filename to use for the string.
 */
var getUniqueFilename = exports.getUniqueFilename = function(str) {
    var result;

    // allow for namespace prefix
    var basename = str.replace(nsprefix, '$1-');
    
    if ( /[^$a-z0-9._\-]/i.test(basename) ) {
        result = crypto.createHash('sha1').update(str).digest('hex').substr(0, 10);
    } else {
        result = makeFilenameUnique(basename, str);
    }

    return result + exports.fileExtension;
};

// two-way lookup
var linkMap = {
    longnameToUrl: {},
    urlToLongname: {}
};

var tutorialLinkMap = {
    nameToUrl: {},
    urlToName: {}
};

var longnameToUrl = exports.longnameToUrl = linkMap.longnameToUrl;

var linkto = exports.linkto = function(longname, linktext) {
    var url = longnameToUrl[longname];
    return url ? '<a href="' + url + '">' + (linktext || longname) + '</a>' : (linktext || longname);
};

var htmlsafe = exports.htmlsafe = function(str) {
    return str.replace(/</g, '&lt;');
};

/**
 * Find items in a TaffyDB database that match the specified key-value pairs.
 * @param {TAFFY} data The TaffyDB database to search.
 * @param {object|function} spec Key-value pairs to match against (for example,
 * `{ longname: 'foo' }`), or a function that returns `true` if a value matches or `false` if it
 * does not match.
 * @return {array<object>} The matching items.
 */
var find = exports.find = function(data, spec) {
    return data(spec).get();
};

/**
 * Retrieve all of the following types of members from a set of doclets:
 *
 * + Classes
 * + Externals
 * + Globals
 * + Mixins
 * + Modules
 * + Namespaces
 * + Events
 * @param {TAFFY} data The TaffyDB database to search.
 * @return {object} An object with `classes`, `externals`, `globals`, `mixins`, `modules`,
 * `events`, and `namespaces` properties. Each property contains an array of objects.
 */
exports.getMembers = function(data) {
    return {
        classes: find( data, {kind: 'class'} ),
        externals: find( data, {kind: 'external'} ),
        events: find( data, {kind: 'event'} ),
        globals: find(data, {
            kind: ['member', 'function', 'constant', 'typedef'],
            memberof: { isUndefined: true }
        }),
        mixins: find( data, {kind: 'mixin'} ),
        modules: find( data, {kind: 'module'} ),
        namespaces: find( data, {kind: 'namespace'} )
    };
};

exports.getMembersAsHierarchy = function(data) {
    return {
        classes: exports.buildHierarchy( data, {kind: 'class'} ),
        externals: exports.buildHierarchy( data, {kind: 'external'} ),
        globals: exports.buildHierarchy(data, {
            kind: ['member', 'function', 'constant', 'typedef'],
            memberof: { isUndefined: true }
        }),
        mixins: exports.buildHierarchy( data, {kind: 'mixin'} ),
        modules: exports.buildHierarchy( data, {kind: 'module'} ),
        namespaces: exports.buildHierarchy( data, {kind: 'namespace'} )
    };
};

/**
 * Helper function that places `doclet` into a hierarchy tree at the appropriate
 * level of nesting, creating parent nodes if need be.
 *
 * Suppose we have a doclet A.B.foo and we wish to place it in a hierarchy.
 *
 * Then we have to construct the tree:
 * [{ doclet: A,
 *    children: [{
 *        doclet: B,
 *        children: [{
 *          doclet: foo // <-- place A.B.foo here
 *        }]
 *    }]
 * }]
 *
 * However the A or B nodes might not yet have been created.
 *
 * This function creates the intermediate nodes as necessary to place
 * foo nested in B nested in A.
 *
 * It does this by starting off with the tree ['A', '.B'] (the nodes that
 * have to be created for `foo` to be inserted).
 *
 * If A's node doesn't exist, we create it. Then we assign `doclet` to
 * path 'B.foo' in 'A.children' (hence the recursion).
 *
 * @param {TAFFY} taffy database with all the doclets (we search through these to
 * find the intermediate node doclets).
 * @param {Doclet} doclet - the doclet we wish to add
 * @param {node[]} tree - the current tree/subtree to put `doclet` in. This is
 * an array of nodes, where each node has members 'doclet' and 'children'.
 * 'doclet' holds the doclet for that node. 'children' is an array of the
 * same structure as `tree` (i.e. an array of nodes).
 * @param {string[]} memberof - array of parent nodes we have to resolve,
 * e.g. ['A', '.B']. We check if the node first element in this array is created
 * (and then shift() it off and recurse). The reason we need the punctuation
 * is in the case of there being (e.g.) 'A.B' as well as 'A~B' - we have to know
 * which one to add to.
 * @param {string} currentPath - longname of the node we're currently checking/making,
 * so 'A' then 'A.B' then 'A.B.foo' in the example above.
 */
function _assign(data, tree, doclet, memberof, currentPath) {
    if (!memberof.length) {
        // add the node if it hasn't been added already (e.g. it was an intermediate
        // node of a previously-added doclet).
        if (!tree.filter(function (node) {
            return node.doclet.longname === doclet.longname;
        }).length) {
            tree.push({doclet: doclet});
        }
    } else {
        currentPath += memberof.shift();
        var assignTo = tree.filter(function (node) {
            return node.doclet.longname === currentPath;
        })[0];
        if (!assignTo) {
            // intermediate node which doesn't exist, create it.
            assignTo = {
                doclet: find(data, {longname: currentPath})[0]
            };
            tree.push(assignTo);
        }
        if (!assignTo.children) {
            assignTo.children = [];
        }
        // recurse one step down the tree.
        _assign(data, assignTo.children, doclet, memberof, currentPath);
    }
}

/**
 * Sorts data into a hierarchy of doclets.
 * @param {TAFFY} data - the TaffyDB database to organise.
 * @param {Object} filter - if specified, the terminal nodes must all satisfy
 * this filter (so the returned tree contains just doclets matching this filter
 * and their parents).
 * @returns {node[]} a nested array of nodes, where each node is an object of the form:
 *                       { doclet: Doclet, children: node[] }
 *                   The 'children' member holds all nodes of doclets that are
 *                   members of thd 'doclet' member.
 */
exports.buildHierarchy = function (data, filter) {
    var tree = [];
    data(filter).each(function (d) {
        var bits = name.shorten(d.longname).memberof.split(/(?=[#.~])/).filter(
            function (n) { return n; });
        _assign(data, tree, d, bits, '');
    });
    return tree;
};

/**
 * Retrieve the member attributes for a doclet (for example, `virtual`, `static`, and
 * `readonly`).
 * @param {object} d The doclet whose attributes will be retrieved.
 * @return {array<string>} The member attributes for the doclet.
 */
exports.getAttribs = function(d) {
    var attribs = [];
    
    if (d.virtual) {
        attribs.push('virtual');
    }
    
    if (d.access && d.access !== 'public') {
        attribs.push(d.access);
    }
    
    if (d.scope && d.scope !== 'instance' && d.scope !== 'global') {
        if (d.kind == 'function' || d.kind == 'member' || d.kind == 'constant') {
            attribs.push(d.scope);
        }
    }
    
    if (d.readonly === true) {
        if (d.kind == 'member') {
            attribs.push('readonly');
        }
    }
    
    if (d.kind === 'constant') {
        attribs.push('constant');
    }

    return attribs;
};

/**
 * Retrieve links to allowed types for the member.
 * @param {object} d The doclet whose types will be retrieved.
 * @return {array<string>} HTML links to allowed types for the member.
 */
exports.getSignatureTypes = function(d) {
    var types = [];
    
    if (d.type && d.type.names) {
        types = d.type.names;
    }
    
    if (types && types.length) {
        types = types.map(function(t) {
            return linkto(t, htmlsafe(t));
        });
    }

    return types;
};

/**
 * Retrieve names of the parameters that the member accepts. If a value is provided for `optClass`,
 * the names of optional parameters will be wrapped in a `<span>` tag with that class.
 * @param {object} d The doclet whose parameter names will be retrieved.
 * @param {string} [optClass] The class to assign to the `<span>` tag that is wrapped around the
 * names of optional parameters. If a value is not provided, optional parameter names will not be
 * wrapped with a `<span>` tag. Must be a legal value for a CSS class name.
 * @return {array<string>} An array of parameter names, with or without `<span>` tags wrapping the
 * names of optional parameters.
 */
exports.getSignatureParams = function(d, optClass) {
    var pnames = [];

    if (d.params) {
        d.params.forEach(function(p) {
            if (p.name && p.name.indexOf('.') === -1) {
                if (p.optional && optClass) {
                    pnames.push('<span class="' + optClass + '">' + p.name + '</span>');
                }
                else {
                    pnames.push(p.name);
                }
            }
        });
    }

    return pnames;
};

/**
 * Retrieve links to types that the member can return.
 * @param {object} d The doclet whose types will be retrieved.
 * @return {array<string>} HTML links to types that the member can return.
 */
exports.getSignatureReturns = function(d) {
    var returnTypes = [];
    
    if (d.returns) {
        d.returns.forEach(function(r) {
            if (r.type && r.type.names) {
                if (!returnTypes.length) {
                    returnTypes = r.type.names;
                }
            }
        });
    }
    
    if (returnTypes && returnTypes.length) {
        returnTypes = returnTypes.map(function(r) {
            return linkto(r);
        });
    }

    return returnTypes;
};

/**
 * Retrieve links to a member's ancestors.
 * @param {TAFFY} data The TaffyDB database to search.
 * @param {object} doclet The doclet whose ancestors will be retrieved.
 * @return {array<string>} HTML links to a member's ancestors.
 */
exports.getAncestorLinks = function(data, doclet) {
    var ancestors = [],
        doc = doclet.memberof;

    while (doc) {
        doc = find( data, {longname: doc}, false );
        if (doc) { doc = doc[0]; }
        if (!doc) { break; }
        ancestors.unshift( linkto(doc.longname, (exports.scopeToPunc[doc.scope] || '') + doc.name) );
        doc = doc.memberof;
    }
    if (ancestors.length) {
        ancestors[ancestors.length - 1] += (exports.scopeToPunc[doclet.scope] || '');
    }
    return ancestors;
};

/**
 * Remove members that will not be included in the output, including:
 *
 * + Undocumented members.
 * + Members tagged `@ignore`.
 * + Members of anonymous classes.
 * + Members tagged `@private`, unless the `private` option is enabled.
 * @param {TAFFY} data The TaffyDB database to prune.
 * @return {TAFFY} The pruned database.
 */
exports.prune = function(data) {
    data({undocumented: true}).remove();
    data({ignore: true}).remove();
    if (!env.opts.private) { data({access: 'private'}).remove(); }
    data({memberof: '<anonymous>'}).remove();

    return data;
};

var registerLink = exports.registerLink = function(longname, url) {
    linkMap.longnameToUrl[longname] = url;
    linkMap.urlToLongname[url] = longname;
};

function toLink(longname, content, monospace) {
    if (!longname) {
        // if this happens, there's something wrong with the caller itself; the user can't fix this
        throw new Error('Missing required parameter: url');
    }
    var monospaceLinks = env.conf.templates.monospaceLinks;
    var cleverLinks = env.conf.templates.cleverLinks;
  
    // Split into URL and content.
    // Has link text been specified {@link link|content}, e.g.
    // {@link http://github.com|Github} or {@link MyNamespace.method|Method}
    // Note: only do if `content` has not been supplied, i.e. in the case of
    // [content]{@link ...} we use `content`.
    //
    // If pipe is not present we use the first space.
    var split = longname.indexOf('|');
    if (split === -1) {
       split = longname.indexOf(' ');
    }
    if (split !== -1 && !content) {
        content = longname.substr(split + 1);
        longname = longname.substr(0, split);
    }

    var url;
    var isURL = false;
    // Has link been specified manually?
    if (/^(http|ftp)s?:/.test(longname)) {
        isURL = true;
        url = longname;
    }
    else {
        // the actual longname is stored in `url` if there was a delimiter.
        url = linkMap.longnameToUrl[longname];
    }

    content = content || longname;
    
    if (!url) {
        return content;
    }
    else {
        if (monospace === undefined) {
            // cleverLinks takes precedence. if cleverLinks is true
            // we ignore monospaceLinks.
            // If it's a symbol we use monospace font.
            // Otherwise if cleverLinks is `false` we use monospaceLinks.
            if (cleverLinks) {
                monospace = !isURL;
            } else {
                monospace = monospaceLinks;
            }
        }
        if (monospace) {
            content = '<code>' + content + '</code>';
        }
        return '<a href="'+url+'">'+content+'</a>';
    }
}

var tutorialToUrl = exports.tutorialToUrl = function(tutorial) {
    var node = tutorials.getByName(tutorial);
    // no such tutorial
    if (!node) {
        require('jsdoc/util/error').handle( new Error('No such tutorial: '+tutorial) );
        return;
    }

    var url;
    // define the URL if necessary
    if (!tutorialLinkMap.nameToUrl[node.name]) {
        url = 'tutorial-' + getUniqueFilename(node.name);
        tutorialLinkMap.nameToUrl[node.name] = url;
        tutorialLinkMap.urlToName[url] = node.name;
    }

    return tutorialLinkMap.nameToUrl[node.name];
};

/**
 * Retrieve a link to a tutorial, or the name of the tutorial if the tutorial is missing. If the
 * `missingOpts` parameter is supplied, the names of missing tutorials will be prefixed by the
 * specified text and wrapped in the specified HTML tag and CSS class.
 * @param {string} tutorial The name of the tutorial.
 * @param {string} content The link text to use.
 * @param {object} [missingOpts] Options for displaying the name of a missing tutorial.
 * @param {string} missingOpts.classname The CSS class to wrap around the tutorial name.
 * @param {string} missingOpts.prefix The prefix to add to the tutorial name.
 * @param {string} missingOpts.tag The tag to wrap around the tutorial name.
 * @return {string} An HTML link to the tutorial, or the name of the tutorial with the specified
 * options.
 */
var toTutorial = exports.toTutorial = function(tutorial, content, missingOpts) {
    if (!tutorial) {
        require('jsdoc/util/error').handle( new Error('Missing required parameter: tutorial') );
        return;
    }

    var node = tutorials.getByName(tutorial);
    // no such tutorial
    if (!node) {
        missingOpts = missingOpts || {};
        var tag = missingOpts.tag;
        var classname = missingOpts.classname;
        
        var link = tutorial;
        if (missingOpts.prefix) {
            link = missingOpts.prefix + link;
        }
        if (tag) {
            link = '<' + tag + (classname ? (' class="' + classname + '">') : '>') + link;
            link += '</' + tag + '>';
        }
        return link;
    }

    content = content || node.title;

    return '<a href="' + tutorialToUrl(tutorial) + '">' + content + '</a>';
};

/** Find symbol {@link ...} and {@tutorial ...} strings in text and turn into html links */
exports.resolveLinks = function(str) {
    str = str.replace(/(?:\[(.+?)\])?\{@link(plain|code)? +(.+?)\}/gi,
        function(match, content, monospace, longname) {
            if (monospace === 'plain') {
                monospace = false;
            } else if (monospace === 'code') {
                monospace = true;
            } else {
                monospace = undefined;
            }
            return toLink(longname, content, monospace);
        }
    );

    str = str.replace(/(?:\[(.+?)\])?\{@tutorial +(.+?)\}/gi,
        function(match, content, tutorial) {
            return toTutorial(tutorial, content);
        }
    );

    return str;
};

/**
 * Get a longname's filename if one has been registered; otherwise, generate a unique filename, then
 * register the filename.
 * @private
 */
function getFilename(longname) {
    var url;

    if ( longnameToUrl[longname] && hasOwnProp.call(longnameToUrl, longname) ) {
        url = longnameToUrl[longname];
    } else {
        url = getUniqueFilename(longname);
        registerLink(longname, url);
    }

    return url;
}

/** Turn a doclet into a URL. */
exports.createLink = function(doclet) {
    var url = '';
    var longname;
    var filename;
    
    if (containers.indexOf(doclet.kind) < 0) {
        longname = doclet.longname;
        filename = getFilename(doclet.memberof || exports.globalName);
        
        url = filename + '#' + getNamespace(doclet.kind) + doclet.name;
    }
    else {
        longname = doclet.longname;
        url = getFilename(longname);
    }
    
    return url;
};
