/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	firstname:{
  		type:'string',
      required:true
  	},

    lastname:{
      type:'string',
      required:true
    },

    fullname: function() {
      return this.firstname + ' ' + this.lastname;
    },

  	email:{
  		type:'email',
  		required:true,
  		unique:true
  	},

    birthdate :{
      type:'date',
      required:true
    },

    age: function() {
        var birth = new Date(this.birthdate);
        var now = new Date();
        return (now.getTime() - birth.getTime())/ (1000*60*60*24*365);
    },

    gender :{
      type:'integer',
      required:true
    },

    language:{
      type:'string',
      maxLength: 5,
      required:true
    },

  	password:{
  		type:'string',
  		required:true
  	},

    online :{
      type:'boolean'
    },

    isSleeping:{
      type:'boolean',
      defaultsTo:false
    },

    assistantName:{
      type:'string',
      defaultsTo:'Gladys'
    },

    // type to prepare after waking up 
    // to go working for example
    preparationTimeAfterWakeUp:{
      type:'integer'
    },

    roomwheresleep:{
      collection: 'Room',
      via: 'sleepers',
      dominant:true
    },

    houserelation:{
      collection: 'UserHouseRelation',
      via: 'user'
    },

    locations:{
        collection: 'Location',
        via: 'user'
    },

    profilepicture:{
        collection: 'ProfilePicture',
        via: 'user'
    },

    pushoverparametres:{
        collection: 'PushoverParametres',
        via: 'user'
    },

    pushbulletparametres:{
        collection: 'PushBulletParametre',
        via: 'user'
    },

    alarms:{
        collection: 'Alarm',
        via: 'user'
    },

    sentMessage:{
        collection: 'Message',
        via: 'sender'
    },

    receivedMessage:{
        collection: 'Message',
        via: 'receiver'
    },

    tokens:{
        collection: 'Token',
        via: 'user'
    },

    actions:{
        collection: 'Action',
        via: 'user'
    },

    states:{
        collection: 'State',
        via: 'user'
    },

    launchers:{
        collection: 'Launcher',
        via: 'user'
    },

    speaks:{
        collection: 'Speak',
        via: 'user'
    },

    sockets:{
        collection: 'Socket',
        via: 'user'
    },

    parametres:{
        model:'Parametre'
    },

    // if null, user is outside
    // if value of a House, user is inside the house
    atHome: {
      model:'House'
    },

    menubaritems:{
        collection: 'MenuBarItem',
        via: 'user'
    },

    timers:{
        collection: 'Timer',
        via: 'user'
    },

    googleapi:{
        model:'GoogleApi'
    },

    calendarlist:{
        collection: 'CalendarList',
        via: 'user'
    },

    icals:{
        collection: 'ICal',
        via: 'user'
    },

    contacts:{
        collection: 'Contact',
        via: 'user'
    },

    RFDevices:{
        collection: 'RFDevice',
        via: 'user'
    },

  },

   beforeCreate: function (values, next) {

    // This checks to make sure the password and password confirmation match before creating record
    if (!values.password || values.password != values.confirmation) {
      return next({error: ["Password doesn't match password confirmation."]});
    }

    delete values.confirmation;

      require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
        if (err) return next(err);
        values.password = encryptedPassword;
        // values.online= true;
        next();
      });
  }

};

