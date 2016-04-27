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
        .module('gladys')
        .factory('recognitionService', recognitionService);

    recognitionService.$inject = ['userService'];

    function recognitionService(userService) {
        
        var service = {
            start: start
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
        
        function start(){
            if (!('webkitSpeechRecognition' in window)) {
                console.log('webkitSpeechRecognition not supported');
                return ;
            }
            
            userService.whoAmI()
              .then(function(user){
            
                var recognition = new webkitSpeechRecognition();
                
                recognition.lang = user.language;
                
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onstart = function() {
                    console.log('Voice recognition started');
                }
                
                recognition.onresult = function(event) { 
                    console.log(event);
                }
                
                recognition.onerror = function(event) { 
                    console.log(event);
                }
                
                recognition.onend = function() {
                    console.log('Voice recognition ended');    
                }
                
                recognition.start();
            });
        }
    }
})();