# Changelog

## 3.2.1

- Fixed a bug where the maintainer forgot to merge the PR before publishing

## 3.2.0

- Added support for SSR environments [#25](https://github.com/shoelace-style/localize/pull/25/)

## 3.1.2

- Fixed a bug that caused underscores in locale identifiers to throw a `RangeError`

## 3.1.1

- Upgraded TypeScript to 5.1.3

## 3.1.0

- Added `exists()` method to determine if a term and/or a fallback term exists [#17](https://github.com/shoelace-style/localize/issues/17)

## 3.0.4

- Ensure return values of translation functions are always a string

## 3.0.3

- Fixed a bug where regional locales stopped working

## 3.0.2

- Fixed a parsing bug in extended language codes [#16](https://github.com/shoelace-style/localize/issues/16)
- Updated TypeScript to 4.8.4

## 3.0.1

- Fixed module paths in `package.json`

## 3.0.0

- 🚨BREAKING: Removed top level `term()`, `date()`, `number()`, and `relativeTime()` functions
- Refactored `LocalizeController.term()` to allow strong typings by extending the controller and default translation (see "Typed Translations and Arguments" in the readme for details)

## 2.2.1

- Fixed a bug that prevented updates from happening when `<html dir>` changed

## 2.2.0

- Added `dir()` method to return the target element's directionality
- Added `lang()` method to return the target element's language

## 2.1.3

- Renamed `updateLocalizedTerms()` to `update()` (forgive me SemVer, but nobody was using this I promise)

## 2.1.2

- Removed all dependencies

## 2.1.1

- Change import to ensure only types get used

## 2.1.0

- Added relative time method to 

## 2.0.0

- Reworked the library to use the [ReactiveController](https://lit.dev/docs/composition/controllers/) interface
