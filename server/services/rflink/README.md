How To
======



Todos
=====

1. Real life test

2. Videos to show this working (in progress)

3. Documentation

4. Front tests (Cypress)

5.  Upgrading to "serialport": "10.x.x" & "@serialport/parser-readline": "10.x.x" (some code changes are required)




Known issues
============

At gladys server startup
------------------------

Should have no impact :

2021-06-28T15:09:46+0200 <error> index.js:15 (process.on) unhandledRejection catched: Promise {
  <rejected> TypeError: Cannot read property 'event' of undefined
      at SerialPort.returnOpenErr (../server/services/rflink/lib/commands/rflink.connect.js:36:21)
      at SerialPort._error (../server/services/rflink/node_modules/@serialport/stream/lib/index.js:198:14)
      at binding.open.then.err (../server/services/rflink/node_modules/@serialport/stream/lib/index.js:242:12) }
2021-06-28T15:09:46+0200 <error> index.js:16 (process.on) TypeError: Cannot read property 'event' of undefined
    at SerialPort.returnOpenErr (../server/services/rflink/lib/commands/rflink.connect.js:36:21)
    at SerialPort._error (../server/services/rflink/node_modules/@serialport/stream/lib/index.js:198:14)
    at binding.open.then.err (../server/services/rflink/node_modules/@serialport/stream/lib/index.js:242:12)


MiLight deviceFeature
---------------------

"Mode" and "Disco" are not handled yet.
MiLightv1;ID=9999;SWITCH=01;RGBW=dcb8;CMD=DISCO+;
20;62;MiLightv1;ID=9999;SWITCH=01;RGBW=dcb8;CMD=MODE1

Milight device control
----------------------

Color is not managed properly :

- solution 1 : find a better way to convert the color picker value to 8bits color  )

- solution 2 : replace the glady color picker by a 8bits palette color picker (https://codepen.io/kevinli/pen/GRpXOvo) )

Memory leak
-----------

On device setting page, error in front console :
debug.js?c91e:365 Can't call "this.setState" on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in the componentWillUnmount method.

  in RflinkDeviceBox
  in NodeTab
  in RflinkDevicePage
  ...
  RflinkDeviceBox._this.deleteDevice	@	Device.jsx?46ce:31


Improvments
===========

* Show RFLink gateway status
  10;status; => to display if RF and MiLight are ON on the RFLink gateway
