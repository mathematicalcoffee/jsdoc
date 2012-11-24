/*jshint latedef: false */
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

var completedDoclets = {};
var waitingFor = {};

//var lookingForSuperclass = {};
//var scopeToPunc = { 'static': '.', 'inner': '~', 'instance': '#' };

var deferred = [];

function firstWordOf(string) {
    var m = /^(\S+)/.exec(string);
    if (m) { return m[1]; }
    else { return ''; }
}

var scalars_to_inherit = ['description', 'summary', 'classdesc'];

function inherit(from, to) {
    console.log('making ' + to.name + ' inherit from ' + from.name);
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


// TEST: markComplete's down the bottom and the inheriting is all out
// of order.
// TODO: we don't get into an infinite loop! (test)

/** Marks `doclet` as requiring documentation from `ancestor`.
 * @param {string} ancestor - longname of class to inherit documentation from.
 * @inheritparams processInherits */
function addInherit(doclet, ancestor) {
    if (!doclet.inheritdocs) {
        doclet.inheritdocs = [];
    }
    doclet.inheritdocs.push(ancestor);
    console.log('addInherit: ' + (doclet.meta.code ? doclet.meta.code.name : 'UNDEFINED') + "'s inheritdocs: " + doclet.inheritdocs);
}

/** Determines whether this doclet is waiting for documentation from any
 * other classes or whether it's complete.
 * @inheritparams addInherit
 * @returns {boolean} whether the doclet has any remaining unresolved
 * dependencies.
 */
function isComplete(doclet) {
    return !(doclet.inheritdocs && doclet.inheritdocs.length);
}

// TODO: multiple inheritparams?
// TODO: the '__generated' counting towards complete (remove this 'feature'?)
// (add another plugin 'undocumentedParameters').
/** Called whenever a doclet is completed (from {@link markComplete}).
 * `doclet` is the completed doclet.
 *
 * This sees if any other doclets are waiting for documentation from `doclet`
 * and processes them.
 * @see markComplete
 * @see processInherits
 * @inheritparams addInherit */
function onCompleteDoclet(doclet) {
    //console.log('processin doclets waiting on ' + doclet.longname);
    // `doclet` has just been added to completedDoclets.
    var waiting = waitingFor[doclet.longname];
    if (!waiting) {
        return;
    }

    for (var i = 0; i < waiting.length; ++i) {
        console.log('doclet ' + waiting[i].longname + ' was waiting on ' + doclet.longname);
        processInherits(waiting[i]);
    }
    delete waitingFor[doclet.longname];
}

/** Marks a doclet as being complete.
 *
 * Behind the scenes this stores the doclet in completedDoclets and then
 * calls onCompleteDoclet on it to process any doclets waiting for this one.
 * @see isComplete
 * @param {Doclet} doclet - a doclet.
 */
function markComplete(doclet) {
    console.log('markComplete: ' + doclet.longname);
    completedDoclets[doclet.longname] = doclet;
    onCompleteDoclet(doclet);
}

/** Processes all outstanding inherits for `doclet`, resolving as many
 * as possible.
 *
 * If `doclet` requires documentation from a symbol that has not yet been
 * found, we store it in {@link waitingFor}.
 *
 * @inheritparams markComplete */
function processInherits(doclet) {
    var i = doclet.inheritdocs.length;
    console.log('processInherits for ' + doclet.longname + ': ' + doclet.inheritdocs);
    // note: later declarations will override earlier ones.
    while (i--) {
        var inheritFrom = doclet.inheritdocs[i];
        if (completedDoclets[inheritFrom]) {
            inherit(completedDoclets[inheritFrom], doclet);
            doclet.inheritdocs.splice(i, 1); // since we're going backwards this is ok
        } else {
            if (!waitingFor[inheritFrom]) {
                waitingFor[inheritFrom] = [];
            }
            waitingFor[inheritFrom].push(doclet);
        }
    }
    if (!doclet.inheritdocs.length) {
        delete doclet.inheritdocs;
        markComplete(doclet);
    }
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
            //console.log(doclet);
            //app.jsdoc.parser
//            if (doclet.meta.code) {
//                console.log(app.jsdoc.parser.resolvePropertyParent(doclet.meta.code));
//                try {
//                console.log(app.jsdoc.parser.astnodeToMemberof(doclet.meta.code));
//                } catch (e) {
//                }
//                console.log(app.jsdoc.parser.resolveThis(doclet.meta.code));
//            }
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
    newDoclet: function (e) {
        if (e.doclet.undocumented) {
            return;
        }

        var doclet = e.doclet;
        //console.log(doclet);

        if (isComplete(doclet)) {
            console.log('doclet: ' + doclet.longname + ' completed');
            markComplete(doclet);
        } else {
            console.log('doclet: ' + doclet.longname + ' processing');
            processInherits(doclet);
        }
    }
};
