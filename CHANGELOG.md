<!-- markdownlint-disable MD024 -->

# Changelog

All notable changes in BinBuild will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added

- Added a way to modify the layout of the target directory after build completion.
  If unspecified, the entire contents of the build directory will be moved to the target directory.
- Added support for local source archives.
  Local sources can be specified as either paths (relative or absolute) or `file://` URLs.
- Added silent build mode.
  Passing `true` to `.build()` suppresses build command outputs.

### Changed

- Source archive are now extracted to a temporary build directory.
  The build process is then executed inside that temporary build directory.
  Files inside the build directory are moved to the target directory after build completion.

### Deprecated

### Removed

### Fixed

- Fixed an issue where `.build()` Promise is firing prematurely.

### Security

## [0.1.1] - 2025-07-25

### Fixed

- Fixed an issue where transpiled library files are not included in the NPM distribution.
  Prior versions are still usable, though they require manual building.
  Navigate to the nearest `node_modules/@ghifari160/binbuild` and execute `npm run build`.

## [0.1.0] - 2025-07-25

### Added

- Added library for building binary distributed on NPM.
  Source files are filtered by host platform and architecture.
