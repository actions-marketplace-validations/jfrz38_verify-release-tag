# Verify Release Tag

A read-only GitHub Action that verifies whether a release tag is consistent
with a version declared in a JSON manifest and, optionally, with an expected
Git commit.

## What it checks

The Action:

- reads a top-level string `version` from a JSON file;
- derives the expected tag from an exact prefix and that version;
- validates an explicitly requested tag when provided;
- inspects the exact local Git tag reference;
- resolves lightweight and annotated tags to commits;
- optionally compares the tag commit with another Git revision;
- applies an explicit tag-existence policy.

It never creates, moves, deletes, fetches, or pushes Git references, and it
does not call the GitHub API.

## Usage

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@<commit-sha>
    with:
      fetch-depth: 0

  - id: release-tag
    uses: jfrz38/verify-release-tag@<commit-sha>
    with:
      version-file: package.json
      tag-prefix: v
      expected-commit: ${{ github.sha }}
      policy: allow-missing
```

This configuration allows the tag to be absent, but requires an existing tag
to point to the workflow commit. Pin Actions to immutable commit SHAs.

## Inputs

| Input             | Default         | Description                                                        |
| ----------------- | --------------- | ------------------------------------------------------------------ |
| `version-file`    | `package.json`  | JSON file containing a top-level non-empty string `version`.       |
| `tag-prefix`      | `v`             | Exact string prepended to the version; it may be explicitly empty. |
| `tag`             | —               | Explicit tag that must exactly match the derived tag.              |
| `expected-commit` | —               | Git revision that must resolve to a commit before comparison.      |
| `policy`          | `allow-missing` | Tag-existence policy to apply.                                     |

Input values are compared exactly. Tag names and prefixes are not trimmed,
case-folded, or otherwise normalized.

## Policies

| Policy             | Tag absent | Tag present | Present at expected commit | Present at another commit |
| ------------------ | ---------: | ----------: | -------------------------: | ------------------------: |
| `allow-missing`    |       Pass |        Pass |                       Pass |                      Fail |
| `require-existing` |       Fail |        Pass |                       Pass |                      Fail |
| `require-missing`  |       Pass |        Fail |             Not applicable |            Not applicable |

`expected-commit` cannot be combined with `require-missing`.

## Outputs

| Output            | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `version`         | Original version read from the manifest.                    |
| `tag`             | Derived and validated release tag.                          |
| `tag-exists`      | Whether the exact local tag reference exists.               |
| `tag-commit`      | Full commit ID resolved from the tag, or empty when absent. |
| `expected-commit` | Full resolved expected commit ID, or empty when omitted.    |
| `commit-matches`  | Comparison result, or empty when no comparison occurred.    |
| `policy`          | Policy applied by the Action.                               |

Reliable outputs discovered before a validation failure are still published.

## Repository requirements

The Action inspects only the local checkout. Use a complete checkout so all
relevant tags are available:

```yaml
- uses: actions/checkout@<commit-sha>
  with:
    fetch-depth: 0
```

Shallow repositories are rejected. A local check cannot prove that an unseen
remote tag does not exist or prevent another process from changing a tag after
verification.

Both lightweight and annotated tags are supported. A tag that exists but does
not resolve to a commit is reported as invalid rather than absent.

## License

[MIT](LICENSE)
