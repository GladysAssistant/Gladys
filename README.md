Gladys Project
=======================

[![Build Status](https://travis-ci.org/GladysProject/Gladys.svg?branch=v3)](https://travis-ci.org/GladysProject/Gladys)

![Alt](http://gladysproject.com/assets/images/presentation/facebook_share_gladys.jpg)

The Project
-------------

Gladys is an home automation assistant to help you in your everyday life.

Yes, like a kind of JARVIS!

When you see this kind of project, you say "Uhh, I'm sure this doesn't work, it's based on speech recognition, even Siri isn't capable of being JARVIS". But the goal of Gladys project is **completely different**. We believe that speech recognition is not working fine today, so we've tried a different approach : If instead of having an assistant waiting for your orders, we have an assistant analyzing all your environment ( analyzing your calendar, reading your emails ) and **predicting your needs**. Because in fact, with all the APIs which exists, we can gather all the information we want to optimize our life.

With this system, it's not the user who ask something to his assistant : it's the assistant which tells informations to the user, **at the right moment**.

**Website :** [http://gladysproject.com](http://gladysproject.com)

Specifications
-------------

Gladys is 100% written in Node.js, with the [sails.js](http://sailsjs.org/) framework on the server-side, and [AngularJS](https://angularjs.org/) client-side.

![Alt](http://gladysproject.com/assets/images/presentation/gladys_schema.jpg)


Prerequisites
-------------

- [Node.js](http://nodejs.org) ( >= v4.2.2, not compatible with v5 for now )
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

* For the Node.js part, follow [Felix's Node.js Style Guide](https://github.com/felixge/node-style-guide).
* For the AngularJS client code, follow [John Papa's Angular Style Guide](https://github.com/johnpapa/angular-styleguide).
* Use [JSHint](https://github.com/jshint/jshint).
* Try to Unit test your code as much as possible. No pull requests will be accepted without good unit tests.
 
If you want to develop a new functionality, develop a Gladys Module instead of modifying the core! More about modules on the [website](http://gladysproject.com).


Roadmap
-------------

All the work is listed on our [Trello](https://trello.com/b/cxtyidIH) !

Links
-------------

- [Website](http://gladysproject.com)
- [Developer Website](http://developer.gladysproject.com)
- [Trello](https://trello.com/b/cxtyidIH)
- [Twitter](https://twitter.com/gladysproject)
- [Instagram](https://www.instagram.com/gladysproject/)