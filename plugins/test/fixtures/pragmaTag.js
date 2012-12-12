/** @+
 * @default
 * @const */
/** @+
 * @type {string} */
// a confounding undocumented variable.
var ljasdf;

/** a constant */
const A = 'fda';

/** another constant */
const B = 'ljasf';
/** @- */

/** and another */
const C = 3;

/** @+
 * @type {number} */

/** A virtual doclet.
 * @name F
 * @default 2 */
// a confounding undocumented variable.
var sdf;

/** A number */
const D = 1;
/** Another number */
const E = 2;
/** @- */
/** @- */

// we expect A, B, C to get @default @const and @type {string}.
// we expect D, E to get @default @const and @type {number}.
