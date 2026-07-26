# Point 03 — Typos in property names (JavaScript) vs verified at compile time (TypeScript)

> **Concept #3.** In JavaScript, misspelling a property name (`user.nam`
> instead of `user.name`) silently returns `undefined`, and the bug
> propagates until it crashes somewhere far away. TypeScript verifies,
> against the declared shape of every object, that each property you read or
> write actually exists — flagging the typo the instant you type it, and
> offering autocomplete so it never happens.

An executable, self-contained dissection of that sentence: **16 demos across
4 levels**, each one written twice — once as the JavaScript that silently
misbehaves, once as the TypeScript that refuses to compile — plus a
foundations essay, a concept map, and an evidence lab that prints real `tsc`
diagnostics.

Nothing here is asserted without proof:

- every **runtime** claim is produced by actually running the code;
- every **compile-time** claim is either verified by a type-level assertion
  that breaks the build if it is wrong, or transcribed from `npm run
  evidence`, which compiles deliberately-broken fixtures and prints the
  compiler's own words — every diagnostic in this project was checked
  against real `tsc` output before being written down.

---

## Quick start

```bash
npm install
npm run demo:all        # every demo, in order, then the final report
npm run evidence         # real tsc diagnostics, unsuppressed, with TSxxxx codes
```

Requires Node ≥ 20. TypeScript is a dev dependency; nothing is installed
globally.

---

## Every command

| command | what it does |
|---|---|
| `npm run build` | compile `src/` → `dist/` (must succeed with **zero** errors) |
| `npm run check` | type-check only, no emit |
| `npm run demo:all` | run all 16 demos, then print the final report |
| `npm run evidence` | **the evidence lab** — compile the error fixtures and print real diagnostics |
| `node dist/99-runner/run.js --list` | list the demos (after `npm run build`) |

### The 16 demos

| level | command | granular feature |
|---|---|---|
| **01 basic** | `npm run demo:01-read-typo` | member resolution against the declared property map |
| | `npm run demo:02-write-typo` | write-side checks: key existence, then value type |
| | `npm run demo:03-excess-property` | required-member and excess-property (freshness) checking |
| **02 intermediate** | `npm run demo:04-optional-vs-typo` | optional keys vs typos — both look like `undefined`, never confused by TS |
| | `npm run demo:05-nested-chain` | nested access; each `.` checked independently, depth-agnostic |
| | `npm run demo:06-readonly-typo` | existence checked before mutability |
| | `npm run demo:07-index-signatures` | `[key: string]: T` loosens typo protection, on purpose |
| **03 advanced** | `npm run demo:08-structural-typing` | independent interfaces, same shape, mutually assignable |
| | `npm run demo:09-excess-property-subtlety` | freshness scoped to the literal, lost through a binding |
| | `npm run demo:10-keyof` | property names as a checkable, literal-string union |
| | `npm run demo:11-mapped-template-keys` | GENERATED property maps (\`get${Capitalize<K>}\`) |
| **04 expert** | `npm run demo:12-resolution-model` | own → inherited → index signature → error |
| | `npm run demo:13-soundness-limits` | **where TypeScript cannot protect you** |
| | `npm run demo:14-rename-safety` | rename/refactor safety, and `satisfies` |
| | `npm run demo:15-exhaustive-keyof` | `{ [K in keyof T]: X }` — exhaustiveness over property names |
| | `npm run demo:16-symbol-keys` | symbol keys, `Object.keys`, and `unique symbol` |

---

## Layout

```
point-03-property-typos/
├── README.md                     ← you are here
├── package.json                  one npm script per demo
├── tsconfig.json                 strict: true — every flag annotated with
│                                 the property-name failure mode it closes
├── tsconfig.evidence.json        the evidence lab: compiles the broken fixtures
├── scripts/evidence.mjs          runs the lab and renders the diagnostics
├── docs/
│   └── concept-map.md            hierarchical decomposition of Concept #3
│                                 (nested lists + a Mermaid diagram)
└── src/
    ├── 00-foundations/
    │   └── manifesto.md          shape/property maps, structural typing,
    │                             excess-property checking, why compile-time
    │                             typo-catching deletes a bug CLASS
    ├── 01-basic/                 read typo, write typo, excess-property literal
    ├── 02-intermediate/          optional vs typo, nested chains, readonly,
    │                             index signatures
    ├── 03-advanced/              structural typing, freshness subtlety,
    │                             keyof, mapped/template-literal keys
    ├── 04-expert/                resolution model, soundness limits, rename
    │                             safety + satisfies, exhaustive keyof,
    │                             symbol keys
    └── 99-runner/                registry, CLI, final report
```

Each demo follows the same three-file pattern:

| file | role |
|---|---|
| `*.js-broken.ts` | the JavaScript version (`// @ts-nocheck`) — it runs, and misbehaves |
| `*.ts-safe.ts` | the TypeScript version — the same defects, each `@ts-expect-error`ed |
| `*.explanation.md` | the dissection: mechanism, precise diagnostics, tables, limits |

### Three non-negotiable rules (same standard as point-01)

1. **`@ts-expect-error`, never `@ts-ignore`.** The former asserts that an
   error *exists* (TS2578 if it stops existing), so every demo doubles as a
   regression test of compiler behaviour.
2. **Compile-time claims must be machine-verified.** `proveType<T>()(value,
   ...)` fails to compile unless the compiler's belief matches the printed
   string, so the traces are renderings of proved facts rather than
   promises.
3. **Every quoted diagnostic comes from real `tsc` output**, checked against
   a throwaway fixture before being written into a demo — never paraphrased
   from memory.

---

## The one-sentence version

> TypeScript turns "is this property spelled correctly?" from a question
> answered by a user hitting a blank field in production into a question
> answered by the compiler before the code is ever run — and the editor
> answers it before you even finish typing, via autocomplete drawn from the
> exact same property map every diagnostic in this project is checking
> against.

---

## License

See the repository root [LICENSE](../LICENSE).
