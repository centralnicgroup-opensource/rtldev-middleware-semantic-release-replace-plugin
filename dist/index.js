/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import replace from "replace-in-file";
import { isEqual, template } from "lodash-es";
import { diff } from "jest-diff";
/**
 * Wraps the `callback` in a new function that passes the `context` as the
 * final argument to the `callback` when it gets called.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function applyContextToCallback(callback, context) {
    // eslint-disable-next-line prefer-spread
    return (...args) => callback.apply(null, args.concat(context));
}
/**
 * Applies the `context` to the replacement property `to` depending on whether
 * it is a string template or a callback function.
 */
function applyContextToReplacement(to, context) {
    return typeof to === "function"
        ? applyContextToCallback(to, context)
        : template(to)({ ...context });
}
/**
 * Normalizes a `value` into an array, making it more straightforward to apply
 * logic to a single value of type `T` or an array of those values.
 */
function normalizeToArray(value) {
    return value instanceof Array ? value : [value];
}
export async function prepare(PluginConfig, context) {
    for (const replacement of PluginConfig.replacements) {
        let { results } = replacement;
        delete replacement.results;
        const replaceInFileConfig = {
            ...replacement,
            from: replacement.from ?? [],
            to: replacement.to ?? [],
        };
        // The `replace-in-file` package uses `String.replace` under the hood for
        // the actual replacement. If `from` is a string, this means only a
        // single occurrence will be replaced. This plugin intents to replace
        // _all_ occurrences when given a string to better support
        // configuration through JSON, this requires conversion into a `RegExp`.
        //
        // If `from` is a callback function, the `context` is passed as the final
        // parameter to the function. In all other cases, e.g. being a
        // `RegExp`, the `from` property does not require any modifications.
        //
        // The `from` property may either be a single value to match or an array of
        // values (in any of the previously described forms)
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
        let actual = await replace(replaceInFileConfig);
        if (results) {
            results = results.sort();
            actual = actual.sort();
            if (!isEqual(actual.sort(), results.sort())) {
                throw new Error(`Expected match not found!\n${diff(actual, results)}`);
            }
        }
    }
}
