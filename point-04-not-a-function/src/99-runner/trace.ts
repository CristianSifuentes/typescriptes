/**
 * trace.ts — the instrument panel of this project.
 *
 * Types are erased at compile time, which means a type system is, by
 * construction, *invisible* at runtime. This module exists to make it
 * visible: banners, before/after tables, "which properties does the compiler
 * consider valid here?" traces, and controlled runtime explosions.
 *
 * Nothing here is magic. Everything printed is either
 *   (a) an observable runtime fact (a value, a thrown error), or
 *   (b) a compile-time fact that is *proved* by the type checker elsewhere in
 *       the same file (see ./type-assert.ts), and merely rendered here.
 *
 * We never print a claim about the compiler that the compiler has not verified.
 */

const ESC = "\u001b";

const paint = {
  reset: `${ESC}[0m`,
  bold: `${ESC}[1m`,
  dim: `${ESC}[2m`,
  italic: `${ESC}[3m`,
  red: `${ESC}[31m`,
  green: `${ESC}[32m`,
  yellow: `${ESC}[33m`,
  blue: `${ESC}[34m`,
  magenta: `${ESC}[35m`,
  cyan: `${ESC}[36m`,
  grey: `${ESC}[90m`,
} as const;

/** ANSI sequences occupy zero display columns; strip them before measuring. */
const visibleLength = (text: string): number =>
  // eslint-disable-next-line no-control-regex
  text.replace(new RegExp(`${ESC}\\[[0-9;]*m`, "g"), "").length;

const pad = (text: string, width: number): string =>
  text + " ".repeat(Math.max(0, width - visibleLength(text)));

const write = (line = ""): void => {
  console.log(line);
};

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export function banner(title: string, subtitle?: string): void {
  const width = 78;
  write();
  write(`${paint.magenta}${paint.bold}${"═".repeat(width)}${paint.reset}`);
  write(`${paint.magenta}${paint.bold}  ${title}${paint.reset}`);
  if (subtitle) write(`${paint.grey}  ${subtitle}${paint.reset}`);
  write(`${paint.magenta}${paint.bold}${"═".repeat(width)}${paint.reset}`);
}

export function section(title: string): void {
  write();
  write(`${paint.bold}${paint.cyan}▸ ${title}${paint.reset}`);
  write(`${paint.grey}${"─".repeat(78)}${paint.reset}`);
}

/** A line attributed to the JavaScript (unchecked) world. */
export function js(message: string): void {
  write(`  ${paint.yellow}${paint.bold}[JS]${paint.reset} ${message}`);
}

/** A line attributed to the TypeScript (checked) world. */
export function ts(message: string): void {
  write(`  ${paint.blue}${paint.bold}[TS]${paint.reset} ${message}`);
}

export function log(message: string): void {
  write(`  ${message}`);
}

export function note(message: string): void {
  write(`  ${paint.grey}${message}${paint.reset}`);
}

export function good(message: string): void {
  write(`  ${paint.green}✔${paint.reset} ${message}`);
}

export function bad(message: string): void {
  write(`  ${paint.red}✘${paint.reset} ${message}`);
}

export function warn(message: string): void {
  write(`  ${paint.yellow}⚠${paint.reset} ${message}`);
}

export function blank(): void {
  write();
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function table(headers: readonly string[], rows: readonly (readonly string[])[]): void {
  const widths = headers.map((header, columnIndex) =>
    Math.max(
      visibleLength(header),
      ...rows.map((row) => visibleLength(row[columnIndex] ?? "")),
    ),
  );

  const line = (left: string, mid: string, right: string): string =>
    left + widths.map((width) => "─".repeat(width + 2)).join(mid) + right;

  const renderRow = (cells: readonly string[]): string =>
    "│ " + cells.map((cell, i) => pad(cell ?? "", widths[i] ?? 0)).join(" │ ") + " │";

  write(`  ${paint.grey}${line("┌", "┬", "┐")}${paint.reset}`);
  write(`  ${paint.bold}${renderRow(headers)}${paint.reset}`);
  write(`  ${paint.grey}${line("├", "┼", "┤")}${paint.reset}`);
  for (const row of rows) write(`  ${renderRow(row)}`);
  write(`  ${paint.grey}${line("└", "┴", "┘")}${paint.reset}`);
}

/**
 * Render "which property names the compiler considers VALID for this type at
 * this point" — the same information the editor's autocomplete list is drawn
 * from. Each row is `[type, valid members, source]`.
 */
export function shapeTrace(
  rows: readonly (readonly [type: string, validMembers: string, source: string])[],
): void {
  table(["type", "valid members (the property map)", "source"], rows);
}

/**
 * Render "what does the compiler believe is CALLABLE at this point, and with
 * what signature?" — the type-level fact every demo in this project checks
 * an invocation against. Each row is `[expression, static type, call
 * signature or "not callable", why]`.
 */
export function callableTrace(
  rows: readonly (readonly [expression: string, type: string, signature: string, why: string])[],
): void {
  table(["expression", "static type", "call signature", "why"], rows);
}

// ---------------------------------------------------------------------------
// Compiler diagnostics (transcribed from `npm run evidence`)
// ---------------------------------------------------------------------------

/**
 * Print a diagnostic exactly as `tsc --pretty false` emits it.
 *
 * These strings are transcribed from the evidence lab (`npm run evidence`),
 * which compiles the matching `*.tsc-error.ts` fixture with real, unsuppressed
 * errors. If the compiler ever changes its wording, the evidence run will
 * disagree with these lines and the project's own claims become falsifiable.
 */
export function compilerSays(code: `TS${number}`, message: string, meaning?: string): void {
  write(`  ${paint.red}${paint.bold}error ${code}${paint.reset}${paint.red}: ${message}${paint.reset}`);
  if (meaning) write(`    ${paint.grey}↳ ${meaning}${paint.reset}`);
}

/** The JavaScript counterpart: what the runtime would have said instead. */
export function runtimeSays(message: string, meaning?: string): void {
  write(`  ${paint.yellow}${paint.bold}runtime${paint.reset}${paint.yellow}: ${message}${paint.reset}`);
  if (meaning) write(`    ${paint.grey}↳ ${meaning}${paint.reset}`);
}

// ---------------------------------------------------------------------------
// Controlled explosions
// ---------------------------------------------------------------------------

/**
 * Execute a fragment of unchecked ("JavaScript") code and report what happens.
 *
 * Two outcomes are interesting and both are failures of the JavaScript model:
 *   1. It throws  → the bug reached production and crashed.
 *   2. It returns garbage (`undefined`, `NaN`, `"[object Object]"`) → worse:
 *      the bug reached production and did NOT crash, so it propagated silently.
 */
export function detonate(label: string, fragment: () => unknown): void {
  try {
    const value = fragment();
    const rendered = render(value);
    if (isGarbage(value)) {
      warn(
        `${label} → ${paint.bold}${rendered}${paint.reset} ` +
          `${paint.grey}(no crash — the corrupt value keeps travelling)${paint.reset}`,
      );
    } else {
      log(`${label} → ${rendered}`);
    }
  } catch (error: unknown) {
    const description =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    bad(`${label} → ${paint.red}${paint.bold}THROWS${paint.reset} ${paint.red}${description}${paint.reset}`);
  }
}

const isGarbage = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "number" && Number.isNaN(value)) ||
  (typeof value === "string" && (value === "[object Object]" || value.includes("undefined") || value.includes("NaN")));

export function render(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return `${value}n`;
  if (value === undefined) return "undefined";
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * A block the COMPILER checks but the program never runs.
 *
 * Several demos deliberately contain expressions that TypeScript rejects
 * (each marked `@ts-expect-error`). Those lines are still emitted —
 * `@ts-expect-error` suppresses a diagnostic, it does not delete code — so
 * executing them would throw the very runtime error the demo argues you
 * should never see.
 *
 * Wrapping them here keeps both halves of the point intact: the type checker
 * still reads and rejects the code (that is the evidence), and Node never
 * evaluates it (that is the guarantee).
 */
export function compileTimeOnly(fragment: () => void): void {
  void fragment;
}

export const colors = paint;
