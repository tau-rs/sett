/**
 * A group's gate, DESIGN.md "The shell": a group is a set of plan elements
 * run together and a gate is the checks that run when it ends. Its words are
 * rule 7's, written the same on the session card's group row and in the
 * Sessions view: `done` · `running` · `gate` · `failed n/m` · `waiting`.
 */
export const GROUP_STATES = ['done', 'running', 'gate', 'failed n/m', 'waiting'] as const;

/** the gate word without its count; `failed` carries `n/m` in the words */
export type GateWord = 'done' | 'running' | 'gate' | 'failed' | 'waiting';

/** the gate word of a group's words: the first word; anything else reads as waiting */
export const gateOf = (words?: string): GateWord => {
  const w = (words ?? '').trim().split(/\s/)[0];
  return (['done', 'running', 'gate', 'failed', 'waiting'] as const).includes(w as GateWord) ? (w as GateWord) : 'waiting';
};
