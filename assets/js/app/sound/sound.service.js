
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('soundService', soundService);

    soundService.$inject = ['$http'];

    function soundService($http) {
        var service = {
			addToQueue:addToQueue
        };
		
		var queue = [];
		var audio = new Audio();

        return service;
		
		function addToQueue(file){
			queue.push(file);
			if(queue.length > 1){
				// do nothing
			}else{
				playSound();
			}
		}

        function playSound(){
				//if (audio.duration > 0 && !audio.paused) {
			    // it's playing, we do nothing
			// it's not playing
			audio.src = queue[0];
		    audio.load();
			audio.play();
			console.log(queue[0]);
			audio.onended = function() {
				queue.shift();
				if(queue.length > 0){
					 playSound();
				}
			};
			
		}
    }
})();