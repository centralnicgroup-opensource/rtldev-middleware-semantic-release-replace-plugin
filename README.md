# Automated Semantic Release Plugin for Version Number Replacement and Date Management

[![npm](https://img.shields.io/npm/v/semantic-release-replace-plugin)](https://www.npmjs.com/package/semantic-release-replace-plugin)
![Build](https://github.com/jpoehnelt/semantic-release-replace-plugin/workflows/Build/badge.svg)
![Release](https://github.com/jpoehnelt/semantic-release-replace-plugin/workflows/Release/badge.svg)
[![codecov](https://codecov.io/gh/jpoehnelt/semantic-release-replace-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/jpoehnelt/semantic-release-replace-plugin)
![GitHub contributors](https://img.shields.io/github/contributors/jpoehnelt/semantic-release-replace-plugin?color=green)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

The `semantic-release-replace-plugin` plugin provides functionality to update version strings throughout a project. This enables semantic release to be used in many different languages and build processes.

Read more about [Semantic Release](https://semantic-release.gitbook.io/).

## Install

```bash
$ npm install https://github.com/centralnicgroup-opensource/semantic-release-replace-plugin -D
```

## Usage

The following example uses this plugin to demonstrate using semantic-release in a Python package where `__VERSION__` is defined in the root `__init__.py` file.

### Configuration Example

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    [
      "semantic-release-replace-plugin",
      {
        "replacements": [
          {
            "files": ["foo/**/*.py"],
            "from": "__VERSION__ = \".*\"",
            "to": "__VERSION__ = \"${nextRelease.version}\"",
            "ignore": ["foo/go.py"],
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
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["foo/**/*.py"]
      }
    ]
  ]
}
```

### Real-world Examples

#### JSON Version (like whmcs.json)
```json
{
  "replacements": [
    {
      "files": ["./modules/addons/cnicdnsmanager/whmcs.json"],
      "from": "\"version\": \"\\d+\\.\\d+\\.\\d+\"",
      "to": "\"version\": \"${nextRelease.version}\"",
      "countMatches": true
    }
  ]
}
```

#### Gradle Build File
```json
{
  "replacements": [
    {
      "files": ["./build.gradle"],
      "from": "version = '[^']+'",
      "to": "version = '${nextRelease.version}'",
      "countMatches": true
    }
  ]
}
```

#### Multiple Files with Results Validation
```json
{
  "replacements": [
    {
      "files": ["./release.json", "./COPYRIGHTS"],
      "from": "(19|20)\\d{2}[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12]\\d|3[01])",
      "to": "${(new Date()).toISOString().split('T')[0]}",
      "countMatches": true,
      "results": [
        {
          "file": "./release.json",
          "hasChanged": true,
          "numMatches": 1,
          "numReplacements": 1
        },
        {
          "file": "./COPYRIGHTS",
          "hasChanged": true,
          "numMatches": 1,
          "numReplacements": 1
        }
      ]
    }
  ]
}
```

### Validation

The presence of the `results` array will trigger validation that a replacement has been made. This is optional but recommended.

### Warning

This plugin will not commit changes unless you specify assets for the @semantic-release/git plugin! This is highlighted below.

```
[
  "@semantic-release/git",
  {
    "assets": ["foo/*.py"]
  }
]
```

## Troubleshooting

### Common Issues

#### Pattern Not Matching
**Problem:** "No files found matching pattern"

**Solutions:**
- Verify glob pattern is correct (use `foo/**/*.py` not `foo/**.py`)
- Check file paths relative to project root
- Use `countMatches: true` to get detailed feedback
- Test your regex pattern at [regex101.com](https://regex101.com/)

#### JSON Escaping Issues
**Problem:** Regex pattern not matching (common in `.releaserc.json`)

**Remember:** In JSON, backslashes must be escaped with another backslash:
- ❌ Wrong: `"from": "\d+\.\d+"`
- ✅ Correct: `"from": "\\d+\\.\\d+"`

**Rule:** Double every backslash in JSON strings

#### Results Validation Failed
**Problem:** "Expected match not found"

**Check:**
1. Does the file actually exist?
2. Is the glob pattern matching the right file?
3. Do the `numMatches` and `numReplacements` match actual replacements?
4. Is `countMatches: true` enabled?

### Debugging Tips

1. **Enable verbose logging**: The plugin logs all matched files and replacements
2. **Start simple**: Test with a single replacement first
3. **Use `results` validation**: It forces you to be explicit about expectations
4. **Test regex patterns separately**: Use online tools before adding to config

## Options

Please refer to the [documentation](./docs/README.md) for more options.
