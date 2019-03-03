<p align="center"><img width=60% src="https://gladysassistant.com/assets/images/external/gladys-logo-main-horizontal-01@2x.png"></p>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![GitHub release](https://img.shields.io/github/release/gladysassistant/gladys.svg)
[![Build Status](https://travis-ci.org/GladysAssistant/Gladys.svg?branch=master)](https://travis-ci.org/GladysAssistant/Gladys)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
![Discourse posts](https://img.shields.io/discourse/https/community.gladysassistant.com/posts.svg)
![GitHub](https://img.shields.io/github/license/GladysAssistant/Gladys.svg)
![Twitter Follow](https://img.shields.io/twitter/follow/gladysassistant.svg?style=social)
![GitHub stars](https://img.shields.io/github/stars/gladysassistant/gladys.svg?style=social)

What it does
-------------

Gladys is an home automation assistant to help you in your everyday life.

Yes, like a kind of **JARVIS**!

Gladys is connected to all your devices in your home, she is connected to your calendar, to a lots of API to help you. But let's pick an example :

- It's 8 AM. Gladys wakes you up automatically because she knows that you need to be at work at 9 AM, and that according to the traffic, you'll need 30min to go to work with your car. She knows that you like 30 min to get ready.
She wakes you up with a soft progressive warm light thanks to your Philips Hue, and puts a nice music in your room.
- It's 8.10 AM, Gladys detects thanks to a motion sensor that you are getting out of bed. She immediately starts the wake-up scenario : she tells the coffee machine to prepare the coffee, and opens the blinds.
- At 8.30 AM, you leave the house. Gladys detects thanks to your smartphone that you are not at home anymore, and shuts down everything inside.
- At 6.30 PM, you are getting back home : Everything is ready when you arrive.
- You are going to sleep, so you simply put your phone on your nightstand where a NFC tag is sticked. It immediately sends a request to Gladys to tell here you are going to sleep. She starts the "Going to sleep" scenario, and turns off all lights.

This is just a simple scenario, possibilities with Gladys are just endless ! Don't hesitate to propose yours :)

Interested in Gladys ? Try it at home, it's free and Open-Source !

**Website :** [https://gladysassistant.com](https://gladysassistant.com) <br>
**Community :** [https://community.gladysassistant.com/](https://community.gladysassistant.com/)

Gladys Raspbian image has **more than 32 000 downloads**, and Gladys community has more than **2 000 members** ! 

Who Am I?
-------------

My name is [Pierre-Gilles Leymarie](https://twitter.com/pierregillesl), I'm an indie maker, and recently I decided to move part-time on this open-source project Gladys!

As I'm working completely for free for the community, you can support this open-source project by subscribing to the [Gladys Community Package](https://gladysassistant.com/gladys-community-package)!

Thanks a lot for your support 🙏

Current development
---------------

**Mars 2019:** We are currently working on the next major relase of Gladys, Gladys 4.

It'll be built on top of Node.js + [preact](https://github.com/developit/preact/).

If you want to help, join us on the repository [GladysAssistant/gladys-4-playground](https://github.com/GladysAssistant/gladys-4-playground).


Prerequisites
-------------

- [Node.js](http://nodejs.org) ( >= v8.x.x )
- [MySQL / MariaDB](http://www.mysql.com/)
- Command Line Tools
 - <img src="http://deluge-torrent.org/images/apple-logo.gif" height="17">&nbsp;**Mac OS X**: [Xcode](https://itunes.apple.com/us/app/xcode/id497799835?mt=12) (or **OS X 10.9 Mavericks**: `xcode-select --install`)
 - <img src="http://dc942d419843af05523b-ff74ae13537a01be6cfec5927837dcfe.r14.cf1.rackcdn.com/wp-content/uploads/windows-8-50x50.jpg" height="17">&nbsp;**Windows**: [Visual Studio](http://www.visualstudio.com/downloads/download-visual-studio-vs#d-express-windows-8)
 - <img src="https://lh5.googleusercontent.com/-2YS1ceHWyys/AAAAAAAAAAI/AAAAAAAAAAc/0LCb_tsTvmU/s46-c-k/photo.jpg" height="17">&nbsp;**Ubuntu**, **Debian**: `sudo apt-get install build-essential`
 
Getting Started
---------------

### Installing Gladys on a Raspberry Pi

The easiest way to get started is to install on a Raspberry Pi Gladys with the Raspbian image. See [https://gladysassistant.com](https://gladysassistant.com) for more informations.

### Installing Gladys manually

First, clone this repository:

```bash
git clone https://github.com/gladysassistant/gladys gladys && cd gladys
```

Then install a few global dependencies:

```bash
npm install -g grunt-cli yarn
```

Install this project dependencies:

```bash
yarn
```

Now let's build the frontend: 

```bash
grunt buildProd
```

#### Connect Gladys to MySQL

To connect Gladys to your database, you will need to set some environment variables.
To do so, you'll have to create a `.env` file at the root of this project with the following content:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=YOUR_MYSQL_USER
MYSQL_PASSWORD=YOUR_MYSQL_PASSWORD
MYSQL_DATABASE=YOUR_GLADYS_DBNAME
```

**Note :** You will need to create the database as well in MySQL:

```sql
CREATE DATABASE gladys CHARACTER SET utf8 COLLATE utf8_general_ci; -- or whatever name you've set in your .env file.`
```

#### Create tables

Gladys create automatically all the tables it needs.

You need to execute the init script:

```bash
node init.js
```

#### Start Gladys 

```
node app.js
```

#### Visit Gladys dashboard

If you are on localhost, visit: `http://localhost:8080`, or `http://localhost:1337` if you are in development mode.

If you want to access Gladys anywhere on your local network, just replace localhost by the ip of your machine.

### Starting Gladys in development mode

Install sails globally:

```bash
npm install -g sails
```

Then run:

```
sails lift
```

## Upgrading Gladys inside the Raspbian image

Connect in command line to your Raspberry Pi, and execute the following command:

```
/home/pi/rpi-update.sh
```

This will download new upgrades, stop Gladys and restart Gladys with the new version.

Contributing
-------------

Pull requests are welcomed!

See [Contributing.md](https://github.com/gladysassistant/Gladys/blob/master/.github/CONTRIBUTING.md).

Links
-------------

- [Website](https://gladysassistant.com)
- [Community](https://community.gladysassistant.com/)
- [Patreon](https://www.patreon.com/gladysassistant/overview)
- [Twitter](https://twitter.com/gladysassistant)
- [Instagram](https://www.instagram.com/gladysassistant/)
- [Facebook](https://www.facebook.com/gladysassistant)
- [Developer Website](https://developer.gladysassistant.com)

Copyright & License
-------------

Copyright (c) 2013-2019 Gladys Assistant - Released under the [MIT license](https://github.com/gladysassistant/Gladys/blob/master/LICENSE).
