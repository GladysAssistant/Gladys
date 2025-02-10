#Description

This service is handling Nuki lock for Gladys Assistant (using MQTT for now) : battery, lock state, lock / unlock action.

How To
=====

1. Configure mqtt in Nuki app (use IP, not domain name)
2. Go in Gladys and configure service (mqtt, then nuki)

Technical infos
=========

Folder
------

Base structure generated using [hygen](https://github.com/jondot/hygen#readme hygen) :

https://github.com/ngeissel/Gladys/tree/gladys-hygen

Service will be find here : /gladys_path/server/services/nuki

Resources
---------
[Nuki MQTT API](https://developer.nuki.io/uploads/short-url/ysgxlVRSHb9qAFIDQP6eeXr78QF.pdf "Nuki MQTT API")

Commands
--------

nuki.start.js

nuki.stop.js


HANDLER
-------

Handler : NukiHandler
```
const nukiHandler = new NukiHandler(gladys, serviceId);
```
MQTTHandler : NukiMqttHandler
```
const nukiMQTTHandler = new NukiMQTTHandler(nukiHandler);
```

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





Todos
=====

1. Documentation

2. Real life test

3. Videos to show this working



Known issues
============

Issue N°1
---------

Issue description ...


Improvments
===========

* NukiHttp implementation
* Get the username using the nuki device
