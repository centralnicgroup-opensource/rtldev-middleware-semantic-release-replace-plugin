import { replaceInFile } from "replace-in-file";
import type { ReplaceInFileConfig } from "replace-in-file";
import { VerifyReleaseContext as Context } from "semantic-release";

// Redefine `replace-in-file` config's `From` and `To` types for their callback
// variants to be compatible with passing in the `semantic-release` `Context`.
export type From = FromCallback | RegExp | string;
export type FromCallback = (
  filename: string,
  ...args: unknown[]
) => RegExp | string;
export type To = string | ToCallback;
export type ToCallback = (match: string, ...args: unknown[]) => string;

/**
 * Replacement is similar to the interface used by https://www.npmjs.com/package/replace-in-file
 * with the difference being the single string for `to` and `from`.
 */
export interface Replacement {
  /**
   * files to search for replacements
   */
  files: string[];
  /**
   * The RegExp pattern to use to match.
   *
   * Uses `String.replace(new RegExp(s, 'gm'), to)` for implementation, if
   * `from` is a string.
   *
   * For advanced matching, i.e. when using a `release.config.js` file, consult
   * the documentation of the `replace-in-file` package
   * (https://github.com/adamreisnz/replace-in-file/blob/main/README.md) on its
   * `from` option. This allows explicit specification of `RegExp`s, callback
   * functions, etc.
   *
   * Multiple matchers may be provided as an array, following the same
   * conversion rules as mentioned above.
   */
  from: From | From[];
  /**
   * The replacement value using a template of variables.
   *
   * `__VERSION__ = "${context.nextRelease.version}"`
   *
   * The context object is used to render the template. Additional values
   * can be found at: https://semantic-release.gitbook.io/semantic-release/developer-guide/js-api#result
   *
   * For advanced replacement (NOTE: only for use with `release.config.js` file version), pass in a function to replace non-standard variables
   * ```
   * {
   *    from: `__VERSION__ = 11`, // eslint-disable-line
   *    to: (matched) => `__VERSION: ${parseInt(matched.split('=')[1].trim()) + 1}`, // eslint-disable-line
   *  },
   * ```
   *
   * The `args` for a callback function can take a variety of shapes. In its
   * simplest form, e.g. if `from` is a string, it's the filename in which the
   * replacement is done. If `from` is a regular expression the `args` of the
   * callback include captures, the offset of the matched string, the matched
   * string, etc. See the `String.replace` documentation for details
   *
   * Multiple replacements may be specified as an array. These can be either
   * strings or callback functions. Note that the amount of replacements needs
   * to match the amount of `from` matchers.
   */
  to: To | To[];
  ignore?: string[];
  allowEmptyPaths?: boolean;
  countMatches?: boolean;
  disableGlobs?: boolean;
  encoding?: string;
  dry?: boolean;
  /**
   * The results array can be passed to ensure that the expected replacements
   * have been made, and if not, throw and exception with the diff.
   */
  results?: {
    file: string;
    hasChanged: boolean;
    numMatches?: number;
    numReplacements?: number;
  }[];
}
/**
 * PluginConfig is used to provide multiple replacement.
 *
 * ```
 * [
 *   "@google/semantic-release-replace-plugin",
 *   {
 *     "replacements": [
 *       {
 *         "files": ["foo/__init__.py"],
 *         "from": "__VERSION__ = \".*\"",
 *         "to": "__VERSION__ = \"${context.nextRelease.version}\"",
 *         "results": [
 *           {
 *             "file": "foo/__init__.py",
 *             "hasChanged": true,
 *             "numMatches": 1,
 *             "numReplacements": 1
 *           }
 *         ],
 *         "countMatches": true
 *       }
 *     ]
 *   }
 * ]
 * ```
 */
export interface PluginConfig {
  /** An array of replacements to be made. */
  replacements: Replacement[];
}

/**
 * Wraps the `callback` in a new function that passes the `context` as the
 * final argument to the `callback` when it gets called.
 */
function applyContextToCallback(
  callback: (...args: unknown[]) => unknown,
  context: Context,
) {
  return (...args: unknown[]) => callback.apply(null, args.concat(context));
}

/**
 * Applies the `context` to the replacement property `to` depending on whether
 * it is a string template or a callback function.
 */
function applyContextToReplacement(to: To, context: Context): To {
  return typeof to === "function"
    ? applyContextToCallback(to, context)
    : new Function(...Object.keys(context), `return \`${to}\`;`)(
        ...Object.values(context),
      );
}

/**
 * Normalizes a `value` into an array, making it more straightforward to apply
 * logic to a single value of type `T` or an array of those values.
 */
function normalizeToArray<T>(value: T | T[]): T[] {
  return value instanceof Array ? value : [value];
}

/**
 * Compares two values for deep equality.
 *
 * This function handles complex data types such as `RegExp`, `Date`, `Map`, `Set`,
 * and performs deep comparison of nested objects and arrays.
 *
 * @param {any} a - The first value to compare.
 * @param {any} b - The second value to compare.
 * @returns {boolean} `true` if the values are deeply equal, `false` otherwise.
 *
 * @example
 * const obj1 = { regex: /abc/g, date: new Date(), set: new Set([1, 2, 3]) };
 * const obj2 = { regex: /abc/g, date: new Date(), set: new Set([1, 2, 3]) };
 *
 * console.log(deepEqual(obj1, obj2)); // true
 *
 * @example
 * const obj1 = { regex: /abc/g, date: new Date(2022, 0, 1) };
 * const obj2 = { regex: /abc/g, date: new Date(2021, 0, 1) };
 *
 * console.log(deepEqual(obj1, obj2)); // false
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true; // Handle primitives

  // Check for null or undefined
  if (a == null || b == null) return false;

  // Handle RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle Map and Set
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (let [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key))) return false;
    }
    return true;
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (let item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  // Handle objects and arrays
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (let key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  // If none of the checks match, return false
  return false;
}

/**
 * Recursively compares two objects and returns an array of differences.
 *
 * The function traverses the two objects (or arrays) and identifies differences
 * in their properties or elements. It supports complex types like `Date`, `RegExp`,
 * `Map`, `Set`, and checks nested objects and arrays.
 *
 * @param {any} obj1 - The first value to compare.
 * @param {any} obj2 - The second value to compare.
 * @param {string} [path=""] - The current path to the property or element being compared (used for recursion).
 * @returns {string[]} An array of strings representing the differences between the two values.
 *
 * @example
 * const obj1 = { a: 1, b: { c: 2 } };
 * const obj2 = { a: 1, b: { c: 3 } };
 *
 * const differences = deepDiff(obj1, obj2);
 * console.log(differences); // ['Difference at b.c: 2 !== 3']
 *
 * @example
 * const set1 = new Set([1, 2, 3]);
 * const set2 = new Set([1, 2, 4]);
 *
 * const differences = deepDiff(set1, set2);
 * console.log(differences); // ['Difference at : Set { 1, 2, 3 } !== Set { 1, 2, 4 }']
 */
function deepDiff(obj1: unknown, obj2: unknown, path = ""): string[] {
  let differences: string[] = [];

  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    if (obj1 !== obj2) {
      differences.push(`Difference at ${path}: ${obj1} !== ${obj2}`);
    }
    return differences;
  }

  // Check for Map or Set
  if (obj1 instanceof Map && obj2 instanceof Map) {
    if (obj1.size !== obj2.size) {
      differences.push(`Difference at ${path}: Map sizes do not match`);
    }
    for (let [key, value] of obj1) {
      if (!obj2.has(key) || !deepEqual(value, obj2.get(key))) {
        differences.push(
          `Difference at ${path}.${key}: ${value} !== ${obj2.get(key)}`,
        );
      }
    }
    return differences;
  }

  if (obj1 instanceof Set && obj2 instanceof Set) {
    if (obj1.size !== obj2.size) {
      differences.push(`Difference at ${path}: Set sizes do not match`);
    }
    for (let item of obj1) {
      if (!obj2.has(item)) {
        differences.push(`Difference at ${path}: Set items do not match`);
      }
    }
    return differences;
  }

  // Handle RegExp
  if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
    if (obj1.source !== obj2.source || obj1.flags !== obj2.flags) {
      differences.push(`Difference at ${path}: RegExp ${obj1} !== ${obj2}`);
    }
    return differences;
  }

  // Handle Date
  if (obj1 instanceof Date && obj2 instanceof Date) {
    if (obj1.getTime() !== obj2.getTime()) {
      differences.push(`Difference at ${path}: Date ${obj1} !== ${obj2}`);
    }
    return differences;
  }

  // Handle objects and arrays
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  for (const key of keys) {
    const newPath = path ? `${path}.${key}` : key;
    differences = differences.concat(deepDiff(obj1[key], obj2[key], newPath));
  }

  return differences;
}

export async function prepare(
  PluginConfig: PluginConfig,
  context: Context,
): Promise<void> {
  for (const replacement of PluginConfig.replacements) {
    let { results } = replacement;

    delete replacement.results;

    // Log file patterns being searched
    context.logger?.log?.(
      `🔍 Searching for files matching: ${JSON.stringify(replacement.files)}`,
    );

    const replaceInFileConfig: ReplaceInFileConfig & {
      from: From | From[];
      to: To | To[];
    } = {
      ...replacement,
      from: replacement.from ?? [],
      to: replacement.to ?? [],
    };

    replaceInFileConfig.from = normalizeToArray(replacement.from).map(
      (from) => {
        switch (typeof from) {
          case "function":
            return applyContextToCallback(from, context);
          case "string":
            return new RegExp(from, "gm");
          default:
            return from;
        }
      },
    );

    replaceInFileConfig.to =
      replacement.to instanceof Array
        ? replacement.to.map((to) => applyContextToReplacement(to, context))
        : applyContextToReplacement(replacement.to, context);

    let actual = await replaceInFile(
      replaceInFileConfig as ReplaceInFileConfig & {
        from: From | From[];
        to: To | To[];
        processor?: never;
      },
    );

    // Log results of replacement
    if (actual && actual.length > 0) {
      context.logger?.log?.(
        `✅ Files processed: ${actual.length} file(s) matched and updated`,
      );
      actual.forEach((file) => {
        context.logger?.log?.(
          `   📄 ${file.file}: ${file.numReplacements ?? 0} replacement(s) made (${file.numMatches ?? 0} match(es))`,
        );
      });
    } else {
      context.logger?.warn?.(
        `⚠️  No files found matching pattern: ${JSON.stringify(replacement.files)}`,
      );
    }

    if (results) {
      results = results.sort();
      actual = actual.sort();

      if (!deepEqual([...actual].sort(), [...results].sort())) {
        const difference = deepDiff(actual, results);
        const errorMsg = [
          "❌ Replacement validation failed!",
          "",
          "Expected results did not match actual results.",
          "",
          "Possible causes:",
          "  • File glob pattern didn't match expected files",
          "  • Regex pattern didn't find expected matches",
          "  • Check for proper escaping in JSON (use \\\\ for backslash)",
          "  • Verify numMatches and numReplacements expectations",
          "",
          "Details:",
          ...difference.map(d => `  ${d}`),
        ].join("\n");
        throw new Error(errorMsg);
      }
    }
  }
}
