/*global env: true */
var template = require('jsdoc/template'),
    fs = require('jsdoc/fs'),
    path = require('path'),
    taffy = require('taffydb').taffy,
    helper = require('jsdoc/util/templateHelper'),
    htmlsafe = helper.htmlsafe,
    linkto = helper.linkto,
    scopeToPunc = helper.scopeToPunc,
    hasOwnProp = Object.prototype.hasOwnProperty,
    data,
    view,
    outdir = env.opts.destination;


function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial) {
    return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
    if ( !/^(#.+)/.test(hash) ) { return hash; }
    
    var url = helper.createLink(doclet);
    
    url = url.replace(/(#.+|$)/, hash);
    return '<a href="' + url + '">' + hash + '</a>';
}

function addSignatureParams(f) {
    var params = helper.getSignatureParams(f, 'optional');
    
    f.signature = (f.signature || '') + '('+params.join(', ')+')';
}

function addSignatureReturns(f) {
    var returnTypes = helper.getSignatureReturns(f);
    
    f.signature = '<span class="signature">'+(f.signature || '') + '</span>' + '<span class="type-signature">'+(returnTypes.length? ' &rarr; {'+returnTypes.join('|')+'}' : '')+'</span>';
}

function addSignatureTypes(f) {
    var types = helper.getSignatureTypes(f);
    
    f.signature = (f.signature || '') + '<span class="type-signature">'+(types.length? ' :'+types.join('|') : '')+'</span>';
}

function addAttribs(f) {
    var attribs = helper.getAttribs(f);
    
    f.attribs = '<span class="type-signature">'+htmlsafe(attribs.length? '<'+attribs.join(', ')+'> ' : '')+'</span>';
}
    
function generate(title, docs, filename) {
    var docData = {
        title: title,
        docs: docs,
        filename: filename
    };
    
    var outpath = path.join(outdir, filename),
        html = view.render('container.tmpl', docData);
    
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    
    fs.writeFileSync(outpath, html, 'utf8');
}

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
    // Using jqTree 0.14: http://mbraak.github.com/jqTree/
    // create tree data. Each node is {label:string, id:any, children: [nodes]}
    // The id is needed to save where the tree is (not documented in jqTree!),
    // and should evaluate to true (don't use 0).
    var seen = {},
        id = 1;
    return Object.keys(members).map(function(h) {
        return {
            label: '<h3>' + h[0].toUpperCase() + h.substr(1) + '</h3>',
            id: id++,
            children: members[h].filter(function (d) {
                return (!hasOwnProp.call(seen, d.longname) && 
                        (h === 'globals' ? d.kind !== 'typedef' : true))
            }).map(function (d) {
                var node = { id: helper.longnameToUrl[d.longname] || id++ };
                if (h !== 'tutorials') {
                    seen[d.longname] = true;
                }
                switch (h) {
                    case 'externals':
                        node.label = linkto(d.longname, d.name.replace(/(^"|"$)/g, ''));
                    case 'classes':
                        // see if there's a module with the same name as this class.
                        var moduleSameName = find({kind: 'module', longname: d.longname});
                        if (moduleSameName.length) {
                            // this code doesn't make sense - why change d.name?
                            // why would d.name have module: in it?
                            d.name = d.name.replace('module:', 'require("')+'")';
                            moduleSameName[0].module = d;
                        }
                        node.label = linkto(d.longname, d.name);
                    case 'tutorials':
                        node.label = tutoriallink(d.name);
                    default:
                        node.label = linkto(d.longname, d.name);
                }
                return node;            
            })
        }
    }).filter(function (n) {
        return n.children.length;
    });
}

function oldBuildNav(members) {
    var nav = '<h2><a href="index.html">Index</a></h2>',
        seen = {};

    if (members.modules.length) {
        nav += '<h3>Modules</h3><ul>';
        members.modules.forEach(function(m) {
            if ( !hasOwnProp.call(seen, m.longname) ) {
                nav += '<li>'+linkto(m.longname, m.name)+'</li>';
            }
            seen[m.longname] = true;
        });
        
        nav += '</ul>';
    }
    
    if (members.externals.length) {
        nav += '<h3>Externals</h3><ul>';
        members.externals.forEach(function(e) {
            if ( !hasOwnProp.call(seen, e.longname) ) {
                nav += '<li>'+linkto( e.longname, e.name.replace(/(^"|"$)/g, '') )+'</li>';
            }
            seen[e.longname] = true;
        });
        
        nav += '</ul>';
    }

    if (members.classes.length) {
        var moduleClasses = 0;
        members.classes.forEach(function(c) {
            var moduleSameName = find({kind: 'module', longname: c.longname});
            if (moduleSameName.length) {
                c.name = c.name.replace('module:', 'require("')+'")';
                moduleClasses++;
                moduleSameName[0].module = c;
            }
            if (moduleClasses !== -1 && moduleClasses < members.classes.length) {
                nav += '<h3>Classes</h3><ul>';
                moduleClasses = -1;
            }
            if ( !hasOwnProp.call(seen, c.longname) ) {
                nav += '<li>'+linkto(c.longname, c.name)+'</li>';
            }
            seen[c.longname] = true;
        });
        
        nav += '</ul>';
    }

    if (members.events.length) {
        nav += '<h3>Events</h3><ul>';
        members.events.forEach(function(e) {
            if ( !hasOwnProp.call(seen, e.longname) ) {
                nav += '<li>'+linkto(e.longname, e.name)+'</li>';
            }
            seen[e.longname] = true;
        });
        
        nav += '</ul>';
    }
    
    if (members.namespaces.length) {
        nav += '<h3>Namespaces</h3><ul>';
        members.namespaces.forEach(function(n) {
            if ( !hasOwnProp.call(seen, n.longname) ) {
                nav += '<li>'+linkto(n.longname, n.name)+'</li>';
            }
            seen[n.longname] = true;
        });
        
        nav += '</ul>';
    }
    
    if (members.mixins.length) {
        nav += '<h3>Mixins</h3><ul>';
        members.mixins.forEach(function(m) {
            if ( !hasOwnProp.call(seen, m.longname) ) {
                nav += '<li>'+linkto(m.longname, m.name)+'</li>';
            }
            seen[m.longname] = true;
        });
        
        nav += '</ul>';
    }

    if (members.tutorials.length) {
        nav += '<h3>Tutorials</h3><ul>';
        members.tutorials.forEach(function(t) {
            nav += '<li>'+tutoriallink(t.name)+'</li>';
        });
        
        nav += '</ul>';
    }
    
    if (members.globals.length) {
        nav += '<h3>Global</h3><ul>';
        members.globals.forEach(function(g) {
            if ( g.kind !== 'typedef' && !hasOwnProp.call(seen, g.longname) ) {
                nav += '<li>'+linkto(g.longname, g.name)+'</li>';
            }
            seen[g.longname] = true;
        });
        
        nav += '</ul>';
    }

    return nav;
}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
    data = taffyData;

    var templatePath = opts.template;
    view = new template.Template(templatePath + '/tmpl');
    
    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    var indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    var globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

    // set up templating
    view.layout = 'layout.tmpl';

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data);
    data.sort('longname, version, since');

    data().each(function(doclet) {
         doclet.attribs = '';
        
        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function(example) {
                var caption, code;
                
                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code    = RegExp.$3;
                }
                
                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }
    });
    
    // update outdir if necessary, then create outdir
    var packageInfo = ( find({kind: 'package'}) || [] ) [0];
    if (packageInfo && packageInfo.name) {
        outdir = path.join(outdir, packageInfo.name, packageInfo.version);
    }
    fs.mkPath(outdir);

    // copy static files to outdir
    var fromDir = path.join(templatePath, 'static'),
        staticFiles = fs.ls(fromDir, 3);
        
    staticFiles.forEach(function(fileName) {
        var toDir = fs.toDir( fileName.replace(fromDir, outdir) );
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
    });
    
    data().each(function(doclet) {
        var url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);
    });
    
    data().each(function(doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        }
        else {
            doclet.id = doclet.name;
        }
        
        if (doclet.kind === 'function' || doclet.kind === 'class') {
            addSignatureParams(doclet);
            addSignatureReturns(doclet);
            addAttribs(doclet);
        }
    });
    
    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
        }
        
        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
            doclet.kind = 'member';
        }
    });
    
    var members = helper.getMembers(data);
    members.tutorials = tutorials.children;

    // add template helpers
    view.find = find;
    view.linkto = linkto;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = htmlsafe;

    // once for all
    view.nav = buildNav(members);

    if (members.globals.length) { generate('Global', [{kind: 'globalobj'}], globalUrl); }
    
    // index page displays information from package.json and lists files
    var files = find({kind: 'file'}),
        packages = find({kind: 'package'});

    generate('Index',
        packages.concat(
            [{kind: 'mainpage', readme: opts.readme, longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'}]
        ).concat(files),
    indexUrl);

    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var modules = taffy(members.modules);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);
    
    for (var longname in helper.longnameToUrl) {
        if ( hasOwnProp.call(helper.longnameToUrl, longname) ) {
            var myClasses = helper.find(classes, {longname: longname});
            if (myClasses.length) {
                generate('Class: ' + myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
            }
            
            var myModules = helper.find(modules, {longname: longname});
            if (myModules.length) {
                generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
            }

            var myNamespaces = helper.find(namespaces, {longname: longname});
            if (myNamespaces.length) {
                generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
            }
            
            var myMixins = helper.find(mixins, {longname: longname});
            if (myMixins.length) {
                generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
            }

            var myExternals = helper.find(externals, {longname: longname});
            if (myExternals.length) {
                generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
            }
        }
    }

    // TODO: move the tutorial functions to templateHelper.js
    function generateTutorial(title, tutorial, filename) {
        var tutorialData = {
            title: title,
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children
        };
        
        var tutorialPath = path.join(outdir, filename),
            html = view.render('tutorial.tmpl', tutorialData);
        
        // yes, you can use {@link} in tutorials too!
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
        
        fs.writeFileSync(tutorialPath, html, 'utf8');
    }
    
    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node) {
        node.children.forEach(function(child) {
            generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child);
        });
    }
    saveChildren(tutorials);
};
