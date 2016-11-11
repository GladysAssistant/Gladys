# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [3.2.4] - 2016-11-11
### Changed
- Bugfix: Cloning params object in  `gladys.scenario.trigger()` function so that original object is not modified.

## [3.2.3] - 2016-11-11
### Changed
- Injecting event params (house, user, room, datetime) into scenario scope so that back-at-home and left-home scenario can work properly.

## [3.3.2] - 2016-11-08
### Added
- New event create box on the dashboard ! (Update of gladys data needed)

### Changed
- Create event in scenario action is working.