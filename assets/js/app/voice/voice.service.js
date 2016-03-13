/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
(function () {
    'use strict';

    angular
        .module('app')
        .factory('voiceService', voiceService);

    voiceService.$inject = ['userService'];

    function voiceService(userService) {
        
        var service = {
            say: say
        };

        return service;

        function say(text){
            if (window.SpeechSynthesisUtterance === undefined) {
               return Promise.reject(new Error('SpeechSynthesisUtterance is not supported in your browser.'));    
            }
            userService.whoAmI()
              .then(function(user){
                 var utterance = new SpeechSynthesisUtterance();
                 utterance.text = text;
                 utterance.lang = user.language;
                 utterance.rate = 1.2;
                 window.speechSynthesis.speak(utterance); 
              });
        }
    }
})();