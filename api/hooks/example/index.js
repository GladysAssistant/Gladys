/**
 * Example Hooks
 * @description :: Gladys module example
 * @help :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = function exampleHooks(sails) {
   
   sails.config.Event.on('sailsReady', function(){
      //SpeakService.say("Hi, this is a test !");
      
   });
  
   // This var will be private
   var foo = 'bar';
   // This var will be public
   this.abc = 123;
   
   
   
   var loader = require("sails-util-mvcsloader")(sails);
    loader.injectAll({
        policies: __dirname + '/policies',// Path to your hook's policies
        config: __dirname + '/config'// Path to your hook's config
    });
    
   return {
      defaults: require('./lib/defaults'),
      configure: require('./lib/configure')(sails),
      initialize: require('./lib/initialize')(sails),
      routes: require('./lib/routes')(sails),
    };

};