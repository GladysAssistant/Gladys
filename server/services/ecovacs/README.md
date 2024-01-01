How To
======

Install it, setup access in "Integration", use it.

Changelog
=========
MAJOR 10-2023 v1 Deals with the ecovacs api, handle a vacbot, basic control & battery features handled, a new box to control your bot 

MINOR  11-2023 v1.1.0 
- Handle unreachable vacbot (ie : when battery is empty or device off or out of network for any reason): 
    -> 2023-11-10T18:31:26+0100 <error> vacbot.poll.js:42 (EcovacsHandler.poll) Error 4200 occured : Robot not reachable.
- Do not poll device if service stopped
- Disconnect from mqtt when service stops


Todos
=====

1. Real life test (On going since 2023)

2. Videos to show this working (to be planned)

3. Documentation

4. Front tests (Cypress)


Known issues
============

* [ecovacs-deebot lib kown issues]


Improvments
===========

* Code review / refactoring :
    * Error / Loading have to be correctly managed in VacbotBox (if error display only the title, loading class ... like in ecowattbox)
* Deal with more features : map
* Deal with recognized device or less recognized (check lib documentation)
* Use lib disconnectAsync when deleting a vacbot or stoping service (analysis required)
    *  Test results using vacbot.disconnect() or vacbot.asyncDisconnect() :   error disconnecting: Cannot read properties of undefined (reading 'unsubscribe')

* Use isKnownDevice / isSupportedDevice from lib tools to give details on which vacbot and features are handled in integration UI


Devices compliance
==================

Check [ecovacs-deebot] dependency documentation



Technical informations
======================

service will be find here : /gladys_path/server/services/ecovacs

commands :

- ecovacs.start.js
- ecovacs.stop.js


*HANDLER*

Handler class name : EcovacsHandler
const ecovacs = new EcovacsHandler(gladys, serviceId);


*API*

controller class name : EcovacsController
const Ecovacs = require('./api/ecovacs.controller');

controllers: EcovacsController(ecovacs);

Entry points :

- 'get /api/v1/service/ecovacs/vacbots'
- 'get /api/v1/service/ecovacs/status'
- 'get /api/v1/service/ecovacs/:device_selector/status'
- 'get /api/v1/service/ecovacs/config'
- 'post /api/v1/service/ecovacs/config'
- 'get /api/v1/service/ecovacs/connect'
- 'get /api/v1/service/ecovacs/discover'


Dependencies
------------

- [ecovacs-deebot]



[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [ecovacs-deebot]: <https://www.npmjs.com/package/ecovacs-deebot>
   [ecovacs-deebot lib kown issues]: <https://github.com/mrbungle64/ecovacs-deebot.js#known-issues>
   