// sett Theia colour theme. Renders one VS Code / Theia colour-theme JSON per theme set from
// the resolved tokens: syntax.* and editor.* carry the editor, color.* the surfaces the
// editor sits on (DESIGN.md rule 12: sett themes the editor, it does not redraw it).
// Every value in the output is a token's hex; the tables below are the only place a Theia
// colour id or a TextMate scope is named. Workbench chrome (sidebars, tabs, panels) is out
// of scope: those are sett components in the Theia shell, not the editor.

/** Theia / VS Code workbench colour id → token path in the theme set. */
export const COLORS = {
  // surfaces: the editor is a pane, so it sits on paper with ink on it
  'editor.background': 'color.paper',
  'editor.foreground': 'color.ink',
  'editorGutter.background': 'color.paper',
  'editorLineNumber.foreground': 'color.mute',
  'editorLineNumber.activeForeground': 'color.ink2',
  'editorCursor.foreground': 'color.ink',
  'editorWhitespace.foreground': 'color.line2',
  'editorRuler.foreground': 'color.line2',
  // editor.* aliases
  'editor.lineHighlightBackground': 'editor.line',
  'editor.selectionBackground': 'editor.selection',
  'editor.inactiveSelectionBackground': 'editor.selection',
  'editor.wordHighlightBackground': 'editor.occurrence',
  'editor.wordHighlightStrongBackground': 'editor.occurrence',
  'editor.selectionHighlightBackground': 'editor.occurrence',
  'editor.findMatchBackground': 'editor.find',
  'editor.findMatchHighlightBackground': 'editor.find',
  'editorIndentGuide.background1': 'editor.indentGuide',
  'editorIndentGuide.activeBackground1': 'editor.bracket',
  'editorBracketMatch.border': 'editor.bracket',
  'editorBracketMatch.background': 'editor.occurrence',
  'editorError.foreground': 'editor.underlineError',
  'editorWarning.foreground': 'editor.underlineWarning',
  'editorInfo.foreground': 'editor.underlineHint',
  'editorHint.foreground': 'editor.underlineHint',
  'editorInlayHint.background': 'editor.hintBg',
  'editorInlayHint.foreground': 'editor.hintInk',
  'editorInlayHint.typeBackground': 'editor.hintBg',
  'editorInlayHint.typeForeground': 'editor.hintInk',
  'editorInlayHint.parameterBackground': 'editor.hintBg',
  'editorInlayHint.parameterForeground': 'editor.hintInk',
  'editorGutter.modifiedBackground': 'editor.gutterYou',
  // added and removed lines are what color.ok and color.bad are for
  'editorGutter.addedBackground': 'color.ok',
  'editorGutter.deletedBackground': 'color.bad',
  'diffEditor.insertedTextBackground': 'color.okBg',
  'diffEditor.removedTextBackground': 'color.badBg',
  'diffEditor.insertedLineBackground': 'color.okBg',
  'diffEditor.removedLineBackground': 'color.badBg',
  'editorOverviewRuler.errorForeground': 'editor.underlineError',
  'editorOverviewRuler.warningForeground': 'editor.underlineWarning',
  'editorOverviewRuler.infoForeground': 'editor.underlineHint',
  'editorOverviewRuler.modifiedForeground': 'editor.gutterYou',
  'editorOverviewRuler.addedForeground': 'color.ok',
  'editorOverviewRuler.deletedForeground': 'color.bad',
  'editorOverviewRuler.findMatchForeground': 'color.sug',
  'editorOverviewRuler.selectionHighlightForeground': 'color.sel',
  'editorOverviewRuler.wordHighlightForeground': 'color.line',
  'editorOverviewRuler.bracketMatchForeground': 'color.line',
  'editorOverviewRuler.border': 'color.line2',
  'editorLink.activeForeground': 'color.sel',
  'editorCodeLens.foreground': 'editor.hintInk',
  'editorLightBulb.foreground': 'color.sug',
  'editorGhostText.foreground': 'editor.hintInk',
};

/**
 * editor.* tokens with no Theia colour id: they are decoration classes in
 * packages/ui/src/editor/editor.css, applied through the decoration API.
 */
export const DECORATION_ONLY = ['editor.witness'];

/** Semantic token type or selector → syntax class. rust-analyzer's vocabulary first. */
export const SEMANTIC = {
  keyword: ['keyword', 'selfKeyword', 'selfTypeKeyword', 'operator.controlFlow', '*.declaration'],
  string: ['string', 'character', 'escapeSequence', 'formatSpecifier'],
  constant: ['number', 'boolean', 'enumMember', 'variable.constant', 'variable.static'],
  type: ['type', 'class', 'struct', 'enum', 'interface', 'union', 'typeAlias', 'typeParameter', 'builtinType', 'lifetime'],
  function: ['function', 'method'],
  macro: ['macro', 'macroBang', 'derive', 'deriveHelper', 'procMacro'],
  attribute: ['attribute', 'attributeBracket', 'builtinAttribute', 'decorator', 'toolModule'],
  comment: ['comment'],
};

/** TextMate scopes → syntax class, for grammars without semantic tokens. */
export const TEXTMATE = {
  keyword: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control'],
  string: ['string', 'constant.character.escape'],
  constant: ['constant.numeric', 'constant.language', 'constant.other', 'variable.other.constant', 'entity.name.constant'],
  type: ['entity.name.type', 'entity.name.class', 'entity.name.struct', 'entity.name.enum', 'entity.name.trait', 'entity.name.union', 'entity.other.inherited-class', 'support.type', 'storage.type.primitive', 'entity.name.lifetime'],
  function: ['entity.name.function', 'support.function'],
  macro: ['entity.name.function.macro', 'entity.name.macro', 'support.function.macro'],
  attribute: ['meta.attribute', 'meta.attribute entity.name.type', 'meta.attribute entity.name.function', 'meta.attribute punctuation', 'meta.preprocessor', 'keyword.control.directive', 'entity.other.attribute-name'],
  comment: ['comment', 'punctuation.definition.comment'],
};

/** A DTCG colour as the #RRGGBB or #RRGGBBAA Theia expects. */
export function themeHex(c) {
  const hex = c.hex.toUpperCase();
  if (c.alpha === undefined || c.alpha === 1) return hex;
  return hex + Math.round(c.alpha * 255).toString(16).toUpperCase().padStart(2, '0');
}

/** The Theia colour theme for one set (the flat token list of light.json or dark.json). */
export function renderTheme(tokens, { name, type }) {
  const byPath = new Map(tokens.map((t) => [t.path.join('.'), t]));
  const hex = (path) => {
    const t = byPath.get(path);
    if (!t) throw new Error(`theme: no token at ${path}`);
    if (t.type !== 'color') throw new Error(`theme: ${path} is a ${t.type}, not a color`);
    return themeHex(t.value);
  };
  const colors = Object.fromEntries(Object.entries(COLORS).map(([id, path]) => [id, hex(path)]));
  const syntax = (cls) => hex(`syntax.${cls}`);
  const semanticTokenColors = {};
  for (const [cls, selectors] of Object.entries(SEMANTIC)) for (const s of selectors) semanticTokenColors[s] = syntax(cls);
  const tokenColors = Object.entries(TEXTMATE).map(([cls, scope]) => ({ name: `sett ${cls}`, scope, settings: { foreground: syntax(cls) } }));
  return {
    $schema: 'vscode://schemas/color-theme',
    name,
    type,
    semanticHighlighting: true,
    colors,
    tokenColors,
    semanticTokenColors,
  };
}
