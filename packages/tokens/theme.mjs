// sett Theia colour theme. Renders one VS Code / Theia colour-theme JSON per theme set from
// the resolved tokens: syntax.* and editor.* carry the editor, color.* the surfaces the
// editor sits on (DESIGN.md rule 12: sett themes the editor, it does not redraw it).
// Every value in the output is a token's hex; the tables below are the only place a Theia
// colour id or a TextMate scope is named. WORKBENCH colours Theia's own chrome (activity bar,
// side bar, tabs, panel, status bar, menus, title bar) with the tokens sett's shell components
// use for the same part, so Theia's chrome and sett's read as one frame (arch-design#47).

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
  // both id generations: Theia before Monaco 0.44 reads the unsuffixed ones
  'editorIndentGuide.background': 'editor.indentGuide',
  'editorIndentGuide.activeBackground': 'editor.bracket',
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
 * Theia workbench colour id → color.* token, each taken from the sett component that draws the
 * same part. Ids as Theia 1.76 registers them (core common-frontend-contribution); an id left
 * out keeps Theia's default, which derives from the ones here. Ids with no sett counterpart
 * (drop targets, offline, prominent items, modified-tab borders) are left out on purpose.
 */
export const WORKBENCH = {
  // sett-activity-rail: well, a line2 rule on its right; the active label is ink on paper with a sel bar
  'activityBar.background': 'color.well',
  'activityBar.foreground': 'color.ink',
  'activityBar.inactiveForeground': 'color.ink2',
  'activityBar.border': 'color.line2',
  'activityBar.activeBackground': 'color.paper',
  'activityBar.activeBorder': 'color.sel',
  'activityBar.activeFocusBorder': 'color.sel',
  // the rail badge (badge.ts): paper on amber, asks you
  'activityBarBadge.background': 'color.sug',
  'activityBarBadge.foreground': 'color.paper',
  // sett-sessions-view and sett-files-view: paper, ink2; a files-view area head is well
  'sideBar.background': 'color.paper',
  'sideBar.foreground': 'color.ink2',
  'sideBarSectionHeader.background': 'color.well',
  'sideBarSectionHeader.foreground': 'color.ink2',
  'sideBarSectionHeader.border': 'color.line2',
  // sett-tabs: a well bar ruled in line2; a tab is ink2, the active one ink on paper with a sel bar on
  // top. sett has no unfocused tab state, so unfocused reads as focused
  'editorGroupHeader.tabsBackground': 'color.well',
  'editorGroupHeader.tabsBorder': 'color.line2',
  'tab.border': 'color.line2',
  'tab.activeBackground': 'color.paper',
  'tab.activeForeground': 'color.ink',
  'tab.activeBorderTop': 'color.sel',
  'tab.inactiveBackground': 'color.well',
  'tab.inactiveForeground': 'color.ink2',
  'tab.unfocusedActiveBackground': 'color.paper',
  'tab.unfocusedActiveForeground': 'color.ink',
  'tab.unfocusedActiveBorderTop': 'color.sel',
  'tab.unfocusedInactiveForeground': 'color.ink2',
  // sett-status-bar: bg, ink2, a line2 rule on top; error and warning items take the tint with the
  // tone's ink, as sett tones a word, never a solid fill
  'statusBar.background': 'color.bg',
  'statusBar.foreground': 'color.ink2',
  'statusBar.border': 'color.line2',
  'statusBar.noFolderBackground': 'color.bg',
  'statusBar.noFolderForeground': 'color.ink2',
  'statusBar.noFolderBorder': 'color.line2',
  'statusBarItem.hoverBackground': 'color.well',
  'statusBarItem.hoverForeground': 'color.ink',
  'statusBarItem.focusBorder': 'color.sel',
  'statusBarItem.errorBackground': 'color.badBg',
  'statusBarItem.errorForeground': 'color.bad',
  'statusBarItem.warningBackground': 'color.sugBg',
  'statusBarItem.warningForeground': 'color.sug',
  'statusBarItem.remoteBackground': 'color.selBg',
  'statusBarItem.remoteForeground': 'color.selInk',
  // sett-bottom-panel: paper under a line rule; its tabs are ink2, the active one ink with a sel bar
  'panel.background': 'color.paper',
  'panel.border': 'color.line',
  'panelTitle.activeForeground': 'color.ink',
  'panelTitle.inactiveForeground': 'color.ink2',
  'panelTitle.activeBorder': 'color.sel',
  'panelInput.border': 'color.line',
  // sett-bar: paper, ink, a line2 rule under it
  'titleBar.activeBackground': 'color.paper',
  'titleBar.activeForeground': 'color.ink',
  'titleBar.inactiveBackground': 'color.paper',
  'titleBar.inactiveForeground': 'color.ink2',
  'titleBar.border': 'color.line2',
  // sett-menu: paper in a line border, ink rows; the row under the pointer is well
  'menu.background': 'color.paper',
  'menu.foreground': 'color.ink',
  'menu.border': 'color.line',
  'menu.selectionBackground': 'color.well',
  'menu.selectionForeground': 'color.ink',
  'menu.separatorBackground': 'color.line2',
  'menubar.selectionBackground': 'color.well',
  'menubar.selectionForeground': 'color.ink',
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
  const colors = Object.fromEntries(Object.entries({ ...COLORS, ...WORKBENCH }).map(([id, path]) => [id, hex(path)]));
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
