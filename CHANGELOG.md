<!-- markdownlint-disable MD024 -->

# Changelog

All notable changes in BinBuild will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
THis project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added

### Changed

### Deprecated

### Removed

### Fixed

- Fixed an issue where transpiled library files are not included in the NPM distribution.
  Prior versions are still usable, though they require manual building.
  Navigate to the nearest `node_modules/@ghifari160/binbuild` and execute `npm run build`.

### Security

## [0.1.0] - 2025-07-25

### Added

- Added library for building binary distributed on NPM.
  Source files are filtered by host platform and architecture.
