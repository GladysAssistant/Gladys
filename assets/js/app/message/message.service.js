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