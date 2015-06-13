Gladys Project
=======================


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

![Alt](http://gladysproject.com/img/gladysschemalight.jpg)


Prerequisites
-------------

- [Node.js](http://nodejs.org) ( = v.0.10.xx, some troubles appears with node.js 0.12.x )
- [MySQL](http://www.mysql.com/)
- Command Line Tools
 - <img src="http://deluge-torrent.org/images/apple-logo.gif" height="17">&nbsp;**Mac OS X**: [Xcode](https://itunes.apple.com/us/app/xcode/id497799835?mt=12) (or **OS X 10.9 Mavericks**: `xcode-select --install`)
 - <img src="http://dc942d419843af05523b-ff74ae13537a01be6cfec5927837dcfe.r14.cf1.rackcdn.com/wp-content/uploads/windows-8-50x50.jpg" height="17">&nbsp;**Windows**: [Visual Studio](http://www.visualstudio.com/downloads/download-visual-studio-vs#d-express-windows-8)
 - <img src="https://lh5.googleusercontent.com/-2YS1ceHWyys/AAAAAAAAAAI/AAAAAAAAAAc/0LCb_tsTvmU/s46-c-k/photo.jpg" height="17">&nbsp;**Ubuntu**, **Debian**: `sudo apt-get install build-essential`



 
Getting Started
---------------

The easiest way to get started is to clone the Gladys repository:

```bash
# Clone the repository
$ git clone https://github.com/GladysProject/Gladys.git gladys
$ cd gladys

# Install NPM dependencies
$ npm install
```

#### Connect Gladys to MySQL

To connect Gladys to your database, you need to enter your connections informations in the `config/connections.js` file.

Modify the following lines with your own informations :

```
 sailsmysql: {
    adapter: 'sails-mysql',
    host: 'localhost', 
    port: 8889, 
    user: 'root', 
    password: 'root',
    database: 'gladys'
  },
```

**Note :** You need to create the database first in MySQL :

`CREATE DATABASE gladys;`

#### Create tables

Gladys create automatically all the tables it needs. (only in development mode, not in production, so be sure to start Gladys one time in development mode before trying production mode).

#### Start Gladys 

```
$ node app.js
```

#### Visit Gladys dashboard

If you are on localhost, visit : `http://localhost:1337` (in development mode), or`http://localhost` (in production).

If you want to access Gladys anywhere on your local network, just visit : `http://ip_of_your_machine:1337`.

#### Gladys on a server

If you are trying to install Gladys on a VPS or a dedicated server, or any device which don't have an audio card ( a server can't play music, can't speak ), that's possible !

You need to change the file `config/machine.js`. 
Go to line 21 and change the line `soundCapable : true` to `soundCapable : false`.

When you install the NPM dependencies, you can remove package linked to audio playing, because they won't be able to install on you server ( module lame, speaker and player ).


Getting Google API KEY
------------------

If you want Gladys to be connected to your Google account ( to read your calendar for example ), you need to register in Gladys config file your Google API Key.

- Visit [Google Developpers Console](https://console.developers.google.com/project)
- Click **CREATE PROJECT**
- Enter a *Project Name* (for example "Gladys") , then click **CREATE**
- Then select *APIs & auth* from the sidebar and click on *Credentials* tab
- Click **CREATE NEW CLIENT ID** button :
 - **Application Type**: Web Application
 - **Authorized Javascript origins**: http://localhost:1337
 - **Authorized redirect URI**: http://localhost:1337/googleapi/create
- Copy and paste *Client ID* and *Client secret* keys into `config/googleapis.js`


FAQ
-------------

### `npm install` returns me a lot of errors !

Make sure that node-gyp is working fine. Wait, what is node-gyp ?
>Node-gyp is a cross-platform command-line tool written in Node.js for compiling native addon modules for Node.js.

To be sure that you're doing that good, check [node-gyp installation guide](https://github.com/TooTallNate/node-gyp#installation).

### Can't install npm package speaker

On Debian/Ubuntu, the ALSA backend is selected by default, so be sure to have the alsa.h header file in place :

`$ sudo apt-get install libasound2-dev`

For more informations, check [node-speaker repository](https://github.com/TooTallNate/node-speaker).




