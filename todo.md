# Roadmap: Next Language Feature Implementations

Focus starts with expanding operator support beyond current arithmetic, comparison, and logical basics. Each phase should include: grammar changes (`concept.peggy`), generator enhancements (`generator.js`), and minimal tests (`test-peggy.js`). Avoid documentation changes unless explicitly requested.

## Phase 1: Concatenation & Unary Improvements (Status: COMPLETE)
Implemented: `&` / `&&` treated as `+` (string concat), unary `+` supported without extra whitespace.
Tests: Added in construct suite; examples: `operator-examples.uni`, `membership-range.uni` parse successfully.
Notes: Potential future optimization to collapse consecutive concats into template literals in Phase 10.
## Phase 2: Modulo & Extended Arithmetic (Status: COMPLETE)
Implemented: `%` already present; power operator `**` added (right-associative) via `Power` rule.
Tests: Exponent chains covered; precedence validated implicitly (no regressions).
Notes: No dedicated generator method required—handled as normal `BinaryExpression`.

## Phase 3: Substring / Word Extraction Operators (Status: COMPLETE)
Implemented: Infix `#` substring (via `SubstringPrimary`), `SUBSTR`, `WORD` intrinsics mapped to runtime helpers (`ConceptRuntime.substr`, `ConceptRuntime.word`).
Tests: Basic positive cases implemented. Missing: boundary edge cases (start < 1, end < start, length exceeding source) and WORD out-of-range index tests.
Action: Add edge tests in Phase 5 prep.

## Phase 4: Range Operator and IN Membership (Status: COMPLETE)
Implemented: `value in ( ... )` mapped to `[].includes(value)`; `start : end` produces `{ start, end }` object.
Tests: Basic membership and range parsing present. Missing: nested list membership test, semantic usage of range object (currently passive). Future: define operations on range (iteration, containment check) or convert to array in generator when context requires.
Action: Design range utility semantics (e.g., `runtime.rangeContains(range, value)`) in later phase.

## Phase 5: Tokenization / JUSTIFY / Advanced Text Ops (Next)
Scope: Add intrinsics `TOKEN(source, index[, delimiters])`, `JUSTIFY(source, width[, mode])`.
Grammar: Parse as function-call style intrinsics (similar to SUBSTR/WORD); consider reserved words addition.
Runtime: Implement `token(source, index, delimiters)` and `justify(source, width, mode)`.
Generator: Map intrinsic calls to runtime methods by name (case-insensitive).
Tests (Planned):
	- TOKEN splitting default whitespace, custom delimiter list.
	- TOKEN out-of-range returns empty string.
	- JUSTIFY left/right/center modes (trim vs pad behaviors).
Edge Cases: Empty source, width < source length (truncate? define spec) — need spec decision.

## Phase 6: Preprocessor Conditionals (Planned)
Directives: `$if`, `$elseif`, `$else`, `$endif` executed in a preprocessing pass maintaining line number mapping.
Approach: Implement line scanner producing filtered source + mapping table for error localization.
Tests: Nested conditionals, missing `$endif` diagnostics, variable substitution via `$constant` values.
Risk: Must preserve newline count for accurate error columns.

## Phase 7: Callback Application Skeleton
- Parse `callback` attribute in field definitions.
- Recognize sub applications `GetDisplayValue`, `GetSearchValueList` for callback types.
- Generator: stub methods for callback fields.
- Tests: presence of generated stubs and invocation via runtime.

## Phase 8: Form & Element Declarations (Parsing Only)
- Grammar rules for `form="Name"` and `element="Name" type(...) ... endform` etc.
- AST nodes without generation logic yet.
- Tests: simple form with two elements.

## Phase 9: Element Generation (Browser Only Path)
- Map input/output elements to HTMX-friendly HTML in browser runtime.
- Add `generateFormHTML(formNode)` in a new `web/generator-extensions.js`.
- Tests: transpile small form and check HTML string contains expected fields.

## Phase 10: Performance & Refactor Pass
- Consolidate intrinsic implementations in runtime.
- Optional optimization: join concatenations into template literals.
- Stress test large expression chain.

## Acceptance Criteria Per Phase
- Grammar compiles (no parse errors) for new constructs.
- Added tests pass (extend test count accordingly).
- No regressions in existing 19 example files.
- Generator produces syntactically valid JS (run `node test-peggy.js`).

## Risks / Notes
- Operator precedence changes must not break existing binary expression grouping.
- Introducing preprocessing requires maintaining line numbers for error reporting.
- Element generation should remain opt-in until stable.

## Gap Analysis & Pending Items
1. Substring Edge Tests: Missing negative/zero start handling, end < start scenario; runtime currently clamps start but not validating end.
2. WORD Out-of-Range: Add tests confirming empty string return for large index.
3. Range Semantics: Decide if `start:end` should create iterable array, object with helper methods, or be lowered to `[start, end]`.
4. Duplicate Substring Rules: Both `SubstringInfix` and `SubstringPrimary` present—evaluate consolidation (prefer single rule to reduce ambiguity).
5. Intrinsic Normalization: Provide single dispatch map for all intrinsics (SUBSTR, WORD, TOKEN, JUSTIFY) in generator for easier extension.
6. Performance Optimization: Concatenation chains `a && b && c` currently become nested `(+ )` expressions; evaluate flattening during Phase 10.

## Updated Immediate Next Action
Begin Phase 5 implementation: add grammar & runtime stubs for `TOKEN` and `JUSTIFY`, plus edge case tests for existing substring/word features.
