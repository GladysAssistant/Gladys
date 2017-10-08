# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).


## [3.6.1] - 2017-05-28

### Changed
- Correct bug: process.exit() in init.js script to ensure process exit as fast as possible.

## [3.6.0] - 2017-05-28

### Added
- New gladys.direction API !
- Gladys auto wake up feature !

## [3.5.4] - 2017-05-27

### Changed
- Bugfix: remove arrow function in client code to stay ES5

## [3.5.3] - 2017-05-27

### Added
- Identifying house name in sentences
- Recognizing house & rooms in gladys.event.command()

### Changed
- Call service with protocol in gladys.deviceType.exec()
- Try to call Gladys service first in gladys.notification.create()

## [3.5.2] - 2017-05-16

### Changed
- add house description in parameters
- expose gladys.brain.answer()
- Change update script info

## [3.5.1] - 2017-04-10

### Changed
- bugfix in brain answer : keep only 2 first character of user language
- update rpi-update.sh, start directly node init.js in folder

## [3.5.0] - 2017-04-09

### Added
- Big refactor of Gladys brain
- Added gladys.message(send, getByUser, create, getConversation)
- gladys.time.command()
- Refactor gladys.socket to handle disconnect and keep track of connected user
- Gladys chat box view
- gladys.weather.command()
- gladys.alarm.command()

## [3.4.4] - 2017-03-08

### Added
- Added yarn.lock
- gladys.house.userSeen()
- if user is already at home, create event user seen at home
- Device now have a `user` attribute

### Changed
- Disable Gladys module when init Gladys
- Postcode in house is now a string
- fix bug, devicetype is lowercase in SQL request

## [3.4.2] - 2017-02-11
### Changed
- Fix issue with leaflet CSS in production mode
- Bugfix: Alarm are now re-scheduled when gladys restart

## [3.4.1] - 2017-01-31
### Changed
- BoxType.create update boxType if already exist

## [3.4] - 2017-01-31
### Added
- new method gladys.paramUser.getValues()
- handling calendar/calendarevent with all API routes
- real-time map of the family in the dashboard
- added identifier to the devicetype modal
- native weather implementation in Gladys
- added sunrise/sunset schedule to init tasks (inited each day at 00.01)
- added House & room ID to parameters view in dashboard
- added gladys.deviceState.purge() function to clean deviceState table
- added gladys.sun.isItDay(), gladys.sun.isItNight(), gladys.sun.getState()
- device now added in real-time on the device list view
- added 'category' field on the deviceType table to identify properly each category of device (ex: 'light')
- new deviceType.getByCategory() function
- passing user starting the script in a context object in each script 
- brain : parsing room name with lowercase
- deviceType.command can now select lights in a room
- Schedule alarms with cron-rules ! 

## [3.3.4] - 2016-12-10
###Changed
- Fix critical bug when getting deviceType by room
- add unit tests to GET /devicetype/room to prevent that

## [3.3.3] - 2016-12-10
###Added
- new route: GET /devicetype/:id
- scenario now accept empty templates
- new function: gladys.house.getById()

### Changed
- Bugfixed mode.change, now working !
- full REST API documentation thanks to apidoc
- brain now call module functions and not global services anymore

## [3.3.2] - 2016-11-12
### Changed
- Added roomName in deviceType get requests so that you don't have to query room to get room name.

## [3.3.1] - 2016-11-12
### Changed
- Bugfix: In scenario, test if trigger scope has property before overidding it.

## [3.3] - 2016-11-12
### Added
- New music service in Gladys ! To be able to handle various music system in Gladys, there is a now a `gladys.music` abstract service.
This service search for devices with a deviceType `music`, and treat them as music capable devices.
It forwards all commands (play, pause, stop, ...) to the `service` of the device.

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