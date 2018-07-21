  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('messageService', messageService);

    messageService.$inject = ['$http'];

    function messageService($http) {
        
        var service = {
            getByUser: getByUser,
            send: send
        };

        return service;

        function getByUser(idUser) {
            return $http({method: 'GET', url: '/message/user/' + idUser});
        }
		
		function send(message) {
            return $http({method: 'POST', url: '/message', data: message});
        }
	
    }
})();