import { replaceInFile } from "replace-in-file";
/**
 * Wraps the `callback` in a new function that passes the `context` as the
 * final argument to the `callback` when it gets called.
 */
function applyContextToCallback(callback, context) {
    return (...args) => callback.apply(null, args.concat(context));
}
/**
 * Applies the `context` to the replacement property `to` depending on whether
 * it is a string template or a callback function.
 */
function applyContextToReplacement(to, context) {
    return typeof to === "function"
        ? applyContextToCallback(to, context)
        : new Function(...Object.keys(context), `return \`${to}\`;`)(...Object.values(context));
}
/**
 * Normalizes a `value` into an array, making it more straightforward to apply
 * logic to a single value of type `T` or an array of those values.
 */
function normalizeToArray(value) {
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
function deepEqual(a, b) {
    if (a === b)
        return true; // Handle primitives
    // Check for null or undefined
    if (a == null || b == null)
        return false;
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
        if (a.size !== b.size)
            return false;
        for (let [key, value] of a) {
            if (!b.has(key) || !deepEqual(value, b.get(key)))
                return false;
        }
        return true;
    }
    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size)
            return false;
        for (let item of a) {
            if (!b.has(item))
                return false;
        }
        return true;
    }
    // Handle objects and arrays
    if (typeof a === "object" && typeof b === "object") {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
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
function deepDiff(obj1, obj2, path = "") {
    let differences = [];
    if (typeof obj1 !== "object" ||
        typeof obj2 !== "object" ||
        obj1 === null ||
        obj2 === null) {
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
                differences.push(`Difference at ${path}.${key}: ${value} !== ${obj2.get(key)}`);
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
export async function prepare(PluginConfig, context) {
    for (const replacement of PluginConfig.replacements) {
        let { results } = replacement;
        delete replacement.results;
        // Log file patterns being searched
        context.logger?.log?.(`🔍 Searching for files matching: ${JSON.stringify(replacement.files)}`);
        const replaceInFileConfig = {
            ...replacement,
            from: replacement.from ?? [],
            to: replacement.to ?? [],
        };
        replaceInFileConfig.from = normalizeToArray(replacement.from).map((from) => {
            switch (typeof from) {
                case "function":
                    return applyContextToCallback(from, context);
                case "string":
                    return new RegExp(from, "gm");
                default:
                    return from;
            }
        });
        replaceInFileConfig.to =
            replacement.to instanceof Array
                ? replacement.to.map((to) => applyContextToReplacement(to, context))
                : applyContextToReplacement(replacement.to, context);
        let actual = await replaceInFile(replaceInFileConfig);
        // Log results of replacement
        if (actual && actual.length > 0) {
            context.logger?.log?.(`✅ Files processed: ${actual.length} file(s) matched and updated`);
            actual.forEach((file) => {
                context.logger?.log?.(`   📄 ${file.file}: ${file.numReplacements ?? 0} replacement(s) made (${file.numMatches ?? 0} match(es))`);
            });
        }
        else {
            context.logger?.warn?.(`⚠️  No files found matching pattern: ${JSON.stringify(replacement.files)}`);
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
