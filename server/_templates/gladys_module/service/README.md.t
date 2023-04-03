---
to: ./services/<%= module %>/README.md
---

===============
Technical infos
===============

Folder
------

Service will be find here : /gladys_path/server/services/<%= module %>

Commands
--------

<%= module %>.start.js
<%= module %>.stop.js


HANDLER
-------

Handler : <%= className %>Handler
const <%= attributeName %> = new <%= className %>Handler(gladys, serviceId);


API
---

Controller : <%= className %>Controller
const <%= className %>Controller = require('./api/<%= module %>.controller');

controllers: <%= className %>Controller(<%= attributeName %>Handler);


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
