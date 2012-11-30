/**
 * @summary Provides relative links in the link tag. Core function {@link ~resolveLinks}.
 * @overview
 * Provides relative links in the {@link} tag.
 *
 * Note - this will only work if the doclet occurs within the scope of
 * the referencing member.
 *
 * For example, {@link #name} from the documentation of a method inside a
 * class will appropriately link to that class's name property.
 * However, doing {@link #name} in a global scope means nothing.
 *
 * This resolves {@link [P][Symbol]} to the relevant (namespace|class|module),
 * where [P] is a punctuation like '#', '~' or '.'.
 *
 * For example, within a class MyClass, `{@link #asdf}` resolves to
 * `{@link MyClass#asdf}`.
 *
 * The following properties are processed (we copy off markdown):
 * * classdesc
 * * description
 * * params
 * * properties
 * * returns
 * * deprecated
 * * this
 * * augments
 * * fires
 * * see
 * * since
 * * deprecated
 * * summary
 * * todo
 *
 * CAVEATS:
 *
 * Where a symbol may have multiple scopes, we attempt to resolve relative to
 * the closest one.
 *
 * For example, `{@link .foo}` in a class description will resolve to
 * {@link MyClass.foo} (even if this does not exist!), not MyNamespace.foo
 * where MyClass is in MyNamespace.
 *
 * Likewise, {@link [punctuation]method} will always resolve to the closest
 * parent, for example the class in the case of class method documentation
 * (regardless of whether the class itself belongs to a namespace/module), or
 * to the module in top-level functions in a module.
 *
 * There is one expception to this: when @augments or @this occurs in a
 * *class* doclet, these will be resolved relative to the class' enclosing
 * namespace/module rather than the class.
 *
 * For example, if MyClass is in a namespace and MyClass @augments .MySuperclass,
 * this will be resolved to MyNamespace.MySuperclass rather than
 * MyClass.MySuperclass.
 *
 * TODO: allow configuration?
 *
 * @module plugins/relativeLinks
 * @author Amy Chan <mathematical.coffee@gmail.com>
 */
// not @requires - they are expected to be modules already
// same as markdown.js

// these tags may have inline {@link} to be converted.
var textTags = ['comment', 'description', 'classdesc', 'params',
    'returns', 'properties', 'deprecated', 'summary', 'since', 'todo'];
// these tags always refer to a symbol and do not need {@link }
var symbolLinkTags = ['this', 'augments', 'inheritdocs'];
// These tags can have either {@link} or a straight symbol
var mixedTags = ['see'];
// these tags are handled explicitly
var otherTags = ['fires'];

// If we have a static member .foo but are in a namespace, should
//  {@link .foo} link to Namespace.foo or MyClass.foo ???
// Convention: we always use MyClass.foo *unless* it's in @augments or @this.
// "class" tags mean that if this tag occurs in a @class, @namespace or
// @module, we should resolve relative to that class/namespace/module's
// parent environment, not *within* the class/namespace.module.
var classTags = ['augments', 'this'];

var propsToConvert = textTags.concat(symbolLinkTags.concat(mixedTags.concat(otherTags)));

/** Maps tag kind to the doclet member used as the prefix.
 * If not in here, doclet.memberOf is used. */
var kindToPrefix = {
    class: 'longname',
    namespace: 'longname',
    module: 'longname'
};

/** Replaces {@link [~#.]member} with {@link Parent[~#.]member}. */
function convertLinkTags(text, memberOf) {
    return text.replace(/\{@link +([.~#]\w)/g, function (wholeMatch, rest) {
        return '{@link ' + memberOf + rest;
    });
}

/** special for the @fire tag because it turns up as event:[.~#]... */
function convertEventTag(text, memberOf) {
    return text.replace(/event:([.~#])(\w)/g, function (wholeMatch, punc, rest) {
        return memberOf + punc + 'event:' + rest;
    });
}

/** Replaces [~#.]member with Parent[~#.]member */
function convertEntireText(text, memberOf) {
    return text.replace(/^ *([.~#])(\w[^ ]+) *$/g, function (wholeMatch, punc, rest) {
        return memberOf + punc + rest;
    });
}

/** Resolves all links in text. See {@link ~kindToPrefix}
 * @see ~convertLinkTags
 * @see {@link ~convertEntireText} */
function resolveLinks(text, memberOf, secondaryMemberOf, tag) {
    if (classTags.indexOf(tag) > -1) {
        memberOf = secondaryMemberOf;
    }
    if (textTags.indexOf(tag) > -1) {
        // replace {@link [#.~]... } with resolved link.
        return convertLinkTags(text, memberOf);
    } else if (tag === 'fires') {
        return convertEventTag(text, memberOf);
    } else if (symbolLinkTags.indexOf(tag) > -1) {
        // no {@link } but `text` is meant to entirely resolve to a symbol.
        return convertEntireText(text, memberOf);
    } else if (mixedTags.indexOf(tag) > -1) {
        // it could either be {@link .. } or a whole word.
        var fixed = convertLinkTags(text, memberOf);
        return (fixed !== text ? fixed : convertEntireText(text, memberOf));
    } else {
        console.log('relativeLinks: unrecognised tag ' + tag);
    }
    return text;
}

// same as the markdown one.
// memberOf is doclet[kindToPrefix[doclet.kind] || 'memberOf'.
// secondaryMemberOf is a hack - if the doclet's kind is @class,
//   memberOf is the class/module/namespace name and
//   secondaryMemberof is the enclosing namespace for the class.
// This is because {@link #..} in the class description will be resolved
// relative to the class, but #fdsa in the *augments* tag will be resolved
// relative to the enclosing namespace.
function process(doclet, memberOf, secondaryMemberOf) {

    propsToConvert.forEach(function (tag) {
        if (!doclet.hasOwnProperty(tag)) {
            return;
        }

        if (typeof doclet[tag] === "string") {
            doclet[tag] = resolveLinks(doclet[tag], memberOf, secondaryMemberOf, tag);
        } else if (doclet[tag] instanceof Array) {
            // If it's an array of strings we assume that each element should
            // be resolved (e.g. @see or @augments).
            // Otherwise we recurse into it with process.
            if (doclet[tag].filter(function (x) {
                return typeof x !== 'string';
            }).length) {
                doclet[tag].forEach(function (x) {
                    process(x, memberOf, secondaryMemberOf);
                });
            } else {
                doclet[tag].forEach(function (x, i) {
                    doclet[tag][i] = resolveLinks(doclet[tag][i], memberOf, secondaryMemberOf, tag);
                });
            }
        } else if (doclet[tag]) {
            process(doclet[tag], memberOf, secondaryMemberOf);
        }
    });
}

/** Handlers. See {@link .handlers.newDoclet} */
exports.handlers = {
    // note - we really want to do this on the comment level, but it's easier
    // to know what we're a member of on the doclet level.
    newDoclet: function (e) {
        var d = e.doclet;
        var memberOf = d[(kindToPrefix[d.kind] || 'memberof')];
        var secondaryMemberOf = (kindToPrefix[d.kind] && d.memberof || memberOf);
        //console.log(d);
        // if memberOf is undefined we skip
        if (memberOf === undefined) {
            return;
        }
        process(d, memberOf, secondaryMemberOf);
        // e.doclet
        // d. comment, meta, description, kind, name, longname, memberof, scope
    }
};

/** Dummy class for testing. See {@link #foo}, {@link ~foo} and {@link .foo}.
 * @class */
function TestClass() {
    /** TestClass#foo */
    this.foo = 1;
    // TestClass~foo
    var foo = 2;
}
// TestClass.foo
TestClass.foo = 3;

/** Another dummy class.
 * @class
 * @extends ~TestClass */
function MySubclass() {
}
