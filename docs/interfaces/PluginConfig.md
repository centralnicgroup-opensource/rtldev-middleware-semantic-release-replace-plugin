[**semantic-release-replace-plugin**](../README.md)

***

[semantic-release-replace-plugin](../README.md) / PluginConfig

# Interface: PluginConfig

Defined in: [index.ts:111](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/1cd9b4e3f4e3e5f58ecf23af95ef0b989d354aee/src/index.ts#L111)

PluginConfig is used to provide multiple replacement.

```
[
  "@google/semantic-release-replace-plugin",
  {
    "replacements": [
      {
        "files": ["foo/__init__.py"],
        "from": "__VERSION__ = \".*\"",
        "to": "__VERSION__ = \"${context.nextRelease.version}\"",
        "results": [
          {
            "file": "foo/__init__.py",
            "hasChanged": true,
            "numMatches": 1,
            "numReplacements": 1
          }
        ],
        "countMatches": true
      }
    ]
  }
]
```

## Properties

### replacements

> **replacements**: [`Replacement`](Replacement.md)[]

Defined in: [index.ts:113](https://github.com/centralnicgroup-opensource/rtldev-middleware-semantic-release-replace-plugin/blob/1cd9b4e3f4e3e5f58ecf23af95ef0b989d354aee/src/index.ts#L113)

An array of replacements to be made.
