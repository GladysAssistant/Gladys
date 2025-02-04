===============
Technical infos
===============

Folder
------

Service will be find here : /gladys_path/server/services/nuki

Commands
--------

nuki.start.js
nuki.stop.js


HANDLER
-------

Handler : NukiHandler
const nuki = new NukiHandler(gladys, serviceId);


API
---

Controller : NukiController
const NukiController = require('./api/nuki.controller');

controllers: NukiController(nukiHandler);

'get /api/v1/service/nuki/status'
'get /api/v1/service/nuki/config'
'post /api/v1/service/nuki/config'
'get /api/v1/service/nuki/discover/:protocol'
'post /api/v1/service/nuki/discover/:protocol'

==========
How To
==========



==========
Todos
==========

1. Documentation

2. Real life test

3. Videos to show this working


============
Known issues
============

Issue N°1
---------

Issue description ...

===========
Improvments
===========

* Improvment 1
* Improvment 2
