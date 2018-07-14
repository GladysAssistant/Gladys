
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('recognitionService', recognitionService);

    recognitionService.$inject = ['userService', 'brainService'];

    function recognitionService(userService, brainService) {
        
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
                var final_transcript = '';
                
                recognition.lang = user.language;
                
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onstart = function() {
                    console.log('Voice recognition started');
                }
                
                recognition.onresult = function(event) { 
                    var interim_transcript = '';

                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final_transcript += event.results[i][0].transcript;
                            console.log('Final transcript : ');
                            console.log(final_transcript);
                            brainService.classify(final_transcript);
                            final_transcript = '';
                        } else {
                            interim_transcript += event.results[i][0].transcript;
                            console.log(interim_transcript);
                            //brainService.classify(interim_transcript);
                        }
                     }
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