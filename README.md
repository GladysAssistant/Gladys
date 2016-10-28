Gladys Project
=======================

[![Build Status](https://travis-ci.org/GladysProject/Gladys.svg?branch=v3)](https://travis-ci.org/GladysProject/Gladys) [![Code Climate](https://codeclimate.com/github/GladysProject/Gladys/badges/gpa.svg)](https://codeclimate.com/github/GladysProject/Gladys)

![Alt](http://gladysproject.com/assets/images/presentation/facebook_share_gladys.jpg)

The Project
-------------

Gladys is an home automation assistant to help you in your everyday life.

Yes, like a kind of **JARVIS**!

Gladys is connected to all your devices in your home, she is connected to your calendar, to a lots of API to help you. But let's pick an example :

- It's 8 AM. Gladys wakes you up automatically because she knows that you need to be at work at 9 PM, and that according to the traffic, you'll need 30min to go to work with your car. She knows that you like 30 min to get ready.
She wakes you up with a soft progressive warm light thanks to your Philips Hue, and puts a nice music in your room.
- It's 8.10 AM, Gladys detects thanks to a motion sensor that you are getting out of bed. She immediately starts the wake-up scenario : she tells the coffee machine to prepare the coffee, and opens the blinds.
- At 8.30 AM, you leave the house. Gladys detects thanks to your smartphone that you are not at home anymore, and shuts down everything inside.
- At 6.30 PM, you are getting back home : Everything is ready when you arrive.
- You are going to sleep, so you simply put your phone on your nightstand where a NFC tag is sticked. It immediately sends a request to Gladys to tell here you are going to sleep. She starts the "Going to sleep" scenario, and turns off all lights.

This is just a simple scenario, possibilities with Gladys are just endless ! Don't hesitate to propose yours :)

Interested in Gladys ? [Try it at home](http://gladysproject.com/en/installation), it's free and Open Source !

**Website :** [https://gladysproject.com](http://gladysproject.com)

Specifications
-------------

Gladys is 100% written in Node.js, with the [sails.js](http://sailsjs.org/) framework on the server-side, and [AngularJS](https://angularjs.org/) client-side.

![Alt](http://gladysproject.com/assets/images/presentation/gladys_schema.jpg)


Prerequisites
-------------

- [Node.js](http://nodejs.org) ( >= v4.x.x )
- [MySQL](http://www.mysql.com/)
- Command Line Tools
 - <img src="http://deluge-torrent.org/images/apple-logo.gif" height="17">&nbsp;**Mac OS X**: [Xcode](https://itunes.apple.com/us/app/xcode/id497799835?mt=12) (or **OS X 10.9 Mavericks**: `xcode-select --install`)
 - <img src="http://dc942d419843af05523b-ff74ae13537a01be6cfec5927837dcfe.r14.cf1.rackcdn.com/wp-content/uploads/windows-8-50x50.jpg" height="17">&nbsp;**Windows**: [Visual Studio](http://www.visualstudio.com/downloads/download-visual-studio-vs#d-express-windows-8)
 - <img src="https://lh5.googleusercontent.com/-2YS1ceHWyys/AAAAAAAAAAI/AAAAAAAAAAc/0LCb_tsTvmU/s46-c-k/photo.jpg" height="17">&nbsp;**Ubuntu**, **Debian**: `sudo apt-get install build-essential`



 
Getting Started
---------------

The easiest way to get started is to install Gladys with NPM :

```bash
npm install -g gladys
```

Gladys is now located where you global node_modules are.

For example on Raspbian or on a Mac, it's located in :
 
```
/usr/local/lib/node_modules/gladys
```

#### Connect Gladys to MySQL

To connect Gladys to your database, you need to modify environment variables. 

You can set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD` and `MYSQL_DATABASE`.



**Dirty way :**

If you are not able to modify environment variables, you can enter your connections informations in the `config/connections.js` file.

Modify the following lines with your own informations :

```
sailsmysql: {
    adapter: 'sails-mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'gladys'
  },
```

**Note :** You need to create the database first in MySQL :

`CREATE DATABASE gladys;`


#### Compile assets 

If you want to recompile assets and run all tasks, you can run :

```
grunt buildProd
```

#### Create tables

Gladys create automatically all the tables it needs.

You need to execute the init file :

```bash
node init.js
```

#### Start Gladys 

```
node app.js
```

#### Visit Gladys dashboard

If you are on localhost, visit : `http://localhost:1337` (in development mode), or`http://localhost:8080` (in production).

If you want to access Gladys anywhere on your local network, just replace localhost by the ip of your machine.

FAQ
-------------

### `npm install` returns me a lot of errors !

Make sure that node-gyp is working fine. Wait, what is node-gyp ?
>Node-gyp is a cross-platform command-line tool written in Node.js for compiling native addon modules for Node.js.

To be sure that you're doing that good, check [node-gyp installation guide](https://github.com/TooTallNate/node-gyp#installation).


Contributing
-------------

Pull request are welcome, but code must follow some guidelines.

* Use [JSHint](https://github.com/jshint/jshint).
* For the AngularJS client code, follow [John Papa's Angular Style Guide](https://github.com/johnpapa/angular-styleguide).
* Please Unit test your code. We use Mocha and Istanbul for code coverage. No pull requests will be accepted without good unit tests.
 
If you want to develop a new functionality, develop a Gladys Module instead of modifying the core! More about modules on the [website](http://gladysproject.com).

Links
-------------

- [Website](http://gladysproject.com)
- [Developer Website](http://developer.gladysproject.com)
- [Twitter](https://twitter.com/gladysproject)
- [Instagram](https://www.instagram.com/gladysproject/)
- [Trello](https://trello.com/b/cxtyidIH)
