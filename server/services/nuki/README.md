Description
===========

This service is handling Nuki lock for Gladys Assistant (using MQTT and HTTP for now) : battery, lock state, lock / unlock action.

How To
======

MQTT
----

1. Configure mqtt in Nuki app (use IP, not domain name) [Configure Nuki with MQTT](https://help.nuki.io/hc/fr/articles/14052016143249-Activation-et-configuration-via-l-App-Nuki "Configure Nuki with MQTT")
2. Go in Gladys and configure service (mqtt, then nuki)

HTTP
----

1. Activate and configure your Nuki Web account [Configure Nuki Web](https://help.nuki.io/hc/fr/articles/360016485718-Activer-et-d%C3%A9sactiver-un-compte-Nuki-Web#:~:text=Activez%20Nuki%20Web%20dans%20l,dans%20l'App%20de%20Nuki.  "Configure Nuki Web")
2. Go in Gladys and configure service : API key then HTTP discovering

Technical infos
===============

Folder
------

Base structure generated using [hygen](https://github.com/jondot/hygen#readme hygen) :

https://github.com/ngeissel/Gladys/tree/gladys-hygen

Service will be find here : /gladys_path/server/services/nuki

Resources
---------
[Nuki MQTT API](https://developer.nuki.io/uploads/short-url/ysgxlVRSHb9qAFIDQP6eeXr78QF.pdf "Nuki MQTT API")

Infos
-----

Structure and design similar to Tasmota service : choose the right handler depending on which protocol is used.


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

HTTPHandler : NukiMqttHandler
```
const nukiHTTPHandler = new NukiHTTPHandler(nukiHandler);
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

2. Real life test (Used since March 2025)

3. Videos to show this working



Known issues
============

Issue N°1
---------

Issue description ...


Improvments
===========

* Matter implementation (from v4 locks)
* Get the username using the nuki device (lock logs)
