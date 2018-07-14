
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('socketService', socketService);

    socketService.$inject = ['$http'];

    function socketService($http) {
        var service = {
            subscribe: subscribe
        };

        return service;

        function subscribe() {
            return new Promise(function(resolve, reject){
				io.socket.post('/socket/subscribe', {}, function (data, jwres){
				    resolve();
				});
			});
        }
    }
})();