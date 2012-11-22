// This plugin:
//
// 1.
// Adds the 'inheritparams' tag to copy parameter/returns documentation from
// one function to the current one.
//
// e.g.
// /** a function
//  * @param {number} x - x value
//  * @param {number} y - y value
//  * @returns {number} x + y
//  */
// function myFunction (x, y) {
//     return x + y;
// }
//
// /** another function
//  * @inheritparams myFunction
//  * @param {number} z - z value
//  * @returns {number} x + y + z
//  */
//  function myFunction2 (x, y, z) {
//      return x + y + z
//  }
//
// In the above the x and y documentation from myFunction gets carried over
// to myFunction2. The @returns would too (except that I overrode it).
//
// 2.
// Adds an 'inheritdoc' tag that is inheritparams AS WELL AS copying
// the description, summary, and classdesc (if not specified),
// and adding that function to the '@see'.
//
// e.g.
// /** a function
//  * @param {number} x - x value
//  * @param {number} y - y value
//  * @returns {number} x + y
//  */
// function myFunction (x, y) {
//     return x + y;
// }
//
// /**
//  * @inheritdoc myFunction
//  * @param {number} z - z value
//  */
//  function myFunction2 (x, y, z) {
//      return x + y + z
//  }
//
// In the above example the 'a function' description along with the x/y
// documentation is copied into myFunction2.
//
// It also adds the inherited-from function to the @see of the inherited
// function.
//
// 3.
// Adds an 'override' tag that indicates that a method in a subclass
// overrides/masks that of the superclass. It *only* works if the doclet is
// member of some class where you used @augments or @extends.
//
// This is the same as @inheritdoc but you just don't have to fill out the
// name of the parent function.
//
// (This might conflict with Closure Compiler's @inheritDoc command - should I
// rename mine to avoid confusion?)

var allDoclets = {};
// parent --> [inheritors]
var lookingForParent = {};

var lookingForSuperclass = {};

var deferred = [];

var scopeToPunc = { 'static': '.', 'inner': '~', 'instance': '#' };
function firstWordOf(string) {
    var m = /^(\S+)/.exec(string);
    if (m) { return m[1]; }
    else { return ''; }
}

var scalars_to_inherit = ['description', 'summary', 'classdesc'];

function inherit(from, to) {
    //console.log('making ' + to.name + ' inherit from ' + from.name);
    if (to.returns === undefined || !to.returns.length) {
        to.returns = from.returns;
    }

    if (from.params && from.params.length) {

        var paramNames = (to.meta && to.meta.code.paramnames || false);
        if (!to.params) {
            to.params = [];
        }
        // loop through all parameters detected in `to` and copy the
        // relevant documentation over (or add 'undocumented', or else it's
        // confusing when there are undocumented parameters and inherited
        // parameters).
        for (var j = 0; j < paramNames.length; ++j) {
            //console.log(to.name + ': ' + paramNames[j]);
            var pName = paramNames[j];
            var param = from.params.filter(function (p) {
                return p.name === pName;
            })[0];

            // see if we already have documentation for this parameter.
            var existingParam = to.params.filter(function (p) {
                return p.name === pName;
            })[0];

            if (existingParam) {
                // if it was generated ("undocumented") and we now have
                // something better
                if (existingParam.__generated && param) {
                    to.params[to.params.indexOf(existingParam)] = param;
                }
            } else {
                // it doesn't exist in `to` yet, we will create it.
                if (param) {
                    to.params.push(param);
                } else {
                    //console.log('adding undocumented parameter ' + pName
                    //        + ' to ' + to.name);
                    to.params.push({
                        name: pName,
                        description: "undocumented",
                        __generated: true
                    });
                }
            }
        }
    }

    if (to.inheritParamsOnly) {
        return;
    }
    for (var i = 0; i < scalars_to_inherit.length; ++i) {
        var prop = scalars_to_inherit[i];
        if ((to[prop] === undefined || !to[prop] || !to[prop].trim().length) &&
                from[prop] !== undefined) {
            to[prop] = from[prop];
        }
    }
}

function addInherit(doclet, ancestor) {
    if (!doclet.inheritdocs) {
        doclet.inheritdocs = [];
    }
    doclet.inheritdocs.push(ancestor);
}

exports.defineTags = function (dictionary) {
    dictionary.defineTag('inheritparams', {
        mustHaveValue: true,
        onTagged: function (doclet, tag) {
            addInherit(doclet, firstWordOf(tag.value));
            doclet.inheritParamsOnly = true;
        }
    });
    dictionary.defineTag('inheritdoc', {
        mustHaveValue: true,
        onTagged: function (doclet, tag) {
            var ancestor = firstWordOf(tag.value);
            addInherit(doclet, ancestor);
            doclet.inheritParamsOnly = false;
            if (!doclet.see) {
                doclet.see = [];
            }
            doclet.see.push(ancestor);
        }
    });
    dictionary.defineTag('override', {
        mustNotHaveValue: true,
        onTagged: function (doclet, tag) {
            console.log('@override found'); // doclet.meta.lineno
            // we have to look up doclet's class's .augments tag but they
            // are not made at this point, so we'll do it later.
            deferred.push(doclet);
        }
    });
};

// need to add to postProcess really...
// also, don't use this anywhere other than a method ?
// what about things like @see ... do they inherit?
exports.handlers = {
    fileComplete: function 
    newDoclet: function (e) {
        if (e.doclet.undocumented) {
            return;
        }
        var d = e.doclet;
        var i = deferred.indexOf(d);
        if (i > -1) {
            var parentD = allDoclets[d.memberof];
            deferred.splice(i, 1);
            // Look up the parent doclet and grab its augments??
            if (parentD) {
                if (!d.see) {
                    d.see = [];
                }

                for (i = 0; i < parentD.augments.length; ++i) {
                    var inheritMember = parentD.augments[i] +
                        (scopeToPunc[d.scope] || '#') +
                        d.name;

                    d.see.push(inheritMember);
                    addInherit(d, inheritMember);
                }
                d.inheritParamsOnly = false;
            } else {
                // TODO
                if (!lookingForSuperclass[d.memberof]) {
                    lookingForSuperclass[d.memberof] = [];
                }
                lookingForSuperclass[d.memberof].push(d.longname);
            }
        }

        if (lookingForSuperclass[d.longname]) {
            var children = lookingForSuperclass[d.longname];
            for (i = 0; i < children.length; ++i) {
                var inheritMember = parentD.augments[j] +
                    (scopeToPunc[children[i].scope] || '#') +
                    children[i].name;
                children[i].see.push(inheritMember);
                // TODO: attempt to inherit.
                // 1. if inheritMember hasn't come out yet we'll add to a waiting list.
                // 2. if it has, do the inherit.
                addInherit(children[i], inheritMember);
                processInherits(children[i]);
                // TODO: what if things are waiting on US!
            }
            delete lookingForSuperclass[d.longname];
        }
        //console.log('new doclet: ' + d.longname);
        allDoclets[d.longname] = d;

        processInherits(d);

        // see if anyone is waiting for you.
        var inheritors = lookingForParent[d.longname];
        if (inheritors) {
            for (i = 0; i < inheritors.length; ++i) {
                inherit(d, allDoclets[inheritors[i]]);
            }
            delete lookingForParent[d.longname];
        }

    }
};

/** Makes d inherit from all the things in its list where the symbols
 * are known already; otherwise, we add to the waiting list lookingForParent
 * until the parent symbol becomes known.
 *
 * BAH: what if foo inherits bar which inherits baz.
 *
 * we find bar first --> waits on baz.
 * we find foo --> inherits from bar but that's EMPTY?!
 *
 * then we find baz --> this resolves bar.
 *
 * But foo is left dangling.
 */
function processInherits(d) {
    if (d.inheritdocs) {
        for (var i = 0; i < d.inheritdocs.length; ++i) {
            var inheritFrom = d.inheritdocs[i];
            if (allDoclets[inheritFrom]) {
                inherit(allDoclets[inheritFrom], d);
            } else {
                if (!lookingForParent[inheritFrom]) {
                    lookingForParent[inheritFrom] = [];
                }
                lookingForParent[inheritFrom].push(d.longname);
            }
        }
    }
}

/** Sees if any other doclets are waiting on this one's definition and resolves them.
 */
function resolveDependencies(d) {
}
