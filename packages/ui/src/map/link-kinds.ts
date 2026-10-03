/**
 * The vocabulary of `sett-link`: 21 kinds in four families, a fallback, and
 * the finding overlay (#58 coverage audit, #68 stress test). The grammar is
 * fixed so a reader learns four patterns and a few heads, not 22 shapes:
 * the line pattern is the family (`map.link.<family>.stroke`), the head is
 * the kind, a diamond at the start is ownership. The lighter the line, the
 * less the analyser knows: `guessed` is lighter, `refers-to` the lightest.
 */
export type LinkFamily = 'does' | 'promises' | 'knows' | 'around';
export const LINK_FAMILIES: LinkFamily[] = ['does', 'promises', 'knows', 'around'];
/** what a family says, in the words of `map.link.<family>` */
export const LINK_FAMILY_MEANS: Record<LinkFamily, string> = { does: 'runs something', promises: 'a contract', knows: 'depends on a shape', around: 'surrounds the code' };

export type LinkKind =
  | 'calls' | 'calls-port' | 'hands-off' | 'constructs' | 'wires' | 'calls-out' | 'listens-to'
  | 'implements' | 'inherits' | 'refines' | 'depends-on-port'
  | 'uses-type' | 'holds' | 'shares-state' | 'matches-on' | 'translates' | 'reads'
  | 'tests' | 're-exports' | 'expands' | 'decorates'
  | 'refers-to';

/** the shapes a head can take; entrenched ones keep their meaning (hollow triangle = is a, socket = interface, open head = weaker or asynchronous) */
export type LinkHead = 'triangle' | 'hollow-triangle' | 'based-triangle' | 'double-hollow-triangle' | 'chevron' | 'double-chevron' | 'dot' | 'hollow-dot' | 'bar' | 'square' | 'socket' | 'none';
/** the marker at the start: ownership (filled = owned, hollow = shared) */
export type LinkTail = 'diamond' | 'hollow-diamond';

export interface LinkKindSpec {
  /** the family, which picks the line pattern and the dock height; the fallback has none */
  family?: LinkFamily;
  head: LinkHead;
  tail?: LinkTail;
  /** the words shown on hover */
  label: string;
  /** what the line means, language-neutral (#68) */
  means: string;
}

export const LINK_KINDS: Record<LinkKind, LinkKindSpec> = {
  'calls': { family: 'does', head: 'triangle', label: 'calls', means: 'runs it directly, compiler-inserted calls included' },
  'calls-port': { family: 'does', head: 'socket', label: 'calls port', means: 'calls through an interface whose target is chosen at run time' },
  'hands-off': { family: 'does', head: 'chevron', label: 'hands off', means: 'starts work that runs later or elsewhere: spawn, callback, send' },
  'constructs': { family: 'does', head: 'dot', label: 'constructs', means: 'makes a value of it' },
  'wires': { family: 'does', head: 'bar', label: 'wires', means: 'builds an adapter and plugs it into a port slot, or registers it in a container' },
  'calls-out': { family: 'does', head: 'double-chevron', label: 'calls out', means: 'reaches outside the unit: another crate, the system, the environment' },
  'listens-to': { family: 'does', head: 'hollow-dot', label: 'listens to', means: 'subscribes to its events' },
  'implements': { family: 'promises', head: 'hollow-triangle', label: 'implements', means: 'fulfils the contract, declared or by shape' },
  'inherits': { family: 'promises', head: 'based-triangle', label: 'inherits', means: 'is a kind of it, with its behaviour' },
  'refines': { family: 'promises', head: 'double-hollow-triangle', label: 'refines', means: 'a contract that requires another' },
  'depends-on-port': { family: 'promises', head: 'socket', label: 'depends on port', means: 'declares a need by interface only' },
  'uses-type': { family: 'knows', head: 'chevron', label: 'uses type', means: 'names it in a signature or a local' },
  'holds': { family: 'knows', head: 'chevron', tail: 'diamond', label: 'holds', means: 'has a field of that type' },
  'shares-state': { family: 'knows', head: 'chevron', tail: 'hollow-diamond', label: 'shares state', means: 'mutable state reachable from both: statics, interior mutability, shared ownership' },
  'matches-on': { family: 'knows', head: 'square', label: 'matches on', means: 'depends on its insides: destructuring, field access, casts' },
  'translates': { family: 'knows', head: 'double-chevron', label: 'translates', means: 'converts to or from it' },
  'reads': { family: 'knows', head: 'dot', label: 'reads', means: 'uses a constant or immutable static as a value' },
  'tests': { family: 'around', head: 'hollow-dot', label: 'tests', means: 'exercises it from a test' },
  're-exports': { family: 'around', head: 'double-chevron', label: 're-exports', means: 'makes it visible under its own name' },
  'expands': { family: 'around', head: 'triangle', label: 'expands', means: 'a macro, template or generator that writes code' },
  'decorates': { family: 'around', head: 'square', label: 'decorates', means: 'alters or registers it without being called by it' },
  'refers-to': { head: 'none', label: 'refers to', means: 'only an import or an unresolved reference is known' },
};
export const LINK_KIND_NAMES = Object.keys(LINK_KINDS) as LinkKind[];

export const isLinkKind = (s: string): s is LinkKind => s in LINK_KINDS;
/** the family of a kind; the fallback has none */
export const familyOf = (kind: LinkKind): LinkFamily | undefined => LINK_KINDS[kind]?.family;
/** the kinds of a family, in the order of the table */
export const kindsOf = (family: LinkFamily): LinkKind[] => LINK_KIND_NAMES.filter((k) => LINK_KINDS[k].family === family);
