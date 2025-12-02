[**semantic-release-replace-plugin**](../README.md)

***

[semantic-release-replace-plugin](../README.md) / Replacement

# Interface: Replacement

Defined in: [index.ts:19](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L19)

Replacement is similar to the interface used by https://www.npmjs.com/package/replace-in-file
with the difference being the single string for `to` and `from`.

## Properties

### allowEmptyPaths?

> `optional` **allowEmptyPaths**: `boolean`

Defined in: [index.ts:68](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L68)

***

### countMatches?

> `optional` **countMatches**: `boolean`

Defined in: [index.ts:69](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L69)

***

### disableGlobs?

> `optional` **disableGlobs**: `boolean`

Defined in: [index.ts:70](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L70)

***

### dry?

> `optional` **dry**: `boolean`

Defined in: [index.ts:72](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L72)

***

### encoding?

> `optional` **encoding**: `string`

Defined in: [index.ts:71](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L71)

***

### files

> **files**: `string`[]

Defined in: [index.ts:23](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L23)

files to search for replacements

***

### from

> **from**: [`From`](../type-aliases/From.md) \| [`From`](../type-aliases/From.md)[]

Defined in: [index.ts:39](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L39)

The RegExp pattern to use to match.

Uses `String.replace(new RegExp(s, 'gm'), to)` for implementation, if
`from` is a string.

For advanced matching, i.e. when using a `release.config.js` file, consult
the documentation of the `replace-in-file` package
(https://github.com/adamreisnz/replace-in-file/blob/main/README.md) on its
`from` option. This allows explicit specification of `RegExp`s, callback
functions, etc.

Multiple matchers may be provided as an array, following the same
conversion rules as mentioned above.

***

### ignore?

> `optional` **ignore**: `string`[]

Defined in: [index.ts:67](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L67)

***

### results?

> `optional` **results**: `object`[]

Defined in: [index.ts:77](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L77)

The results array can be passed to ensure that the expected replacements
have been made, and if not, throw and exception with the diff.

#### file

> **file**: `string`

#### hasChanged

> **hasChanged**: `boolean`

#### numMatches?

> `optional` **numMatches**: `number`

#### numReplacements?

> `optional` **numReplacements**: `number`

***

### to

> **to**: [`To`](../type-aliases/To.md) \| [`To`](../type-aliases/To.md)[]

Defined in: [index.ts:66](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/a6d96886d7590a3f455f458aaf93dfbc75f80517/src/index.ts#L66)

The replacement value using a template of variables.

`__VERSION__ = "${context.nextRelease.version}"`

The context object is used to render the template. Additional values
can be found at: https://semantic-release.gitbook.io/semantic-release/developer-guide/js-api#result

For advanced replacement (NOTE: only for use with `release.config.js` file version), pass in a function to replace non-standard variables
```
{
   from: `__VERSION__ = 11`, // eslint-disable-line
   to: (matched) => `__VERSION: ${parseInt(matched.split('=')[1].trim()) + 1}`, // eslint-disable-line
 },
```

The `args` for a callback function can take a variety of shapes. In its
simplest form, e.g. if `from` is a string, it's the filename in which the
replacement is done. If `from` is a regular expression the `args` of the
callback include captures, the offset of the matched string, the matched
string, etc. See the `String.replace` documentation for details

Multiple replacements may be specified as an array. These can be either
strings or callback functions. Note that the amount of replacements needs
to match the amount of `from` matchers.
