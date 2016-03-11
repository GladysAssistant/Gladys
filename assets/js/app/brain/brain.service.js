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
        .factory('brainService', brainService);

    brainService.$inject = ['$http'];

    function brainService($http) {
        var service = {
            classify: classify
        };

        return service;

        function classify(text) {
            return $http({method: 'GET', url: '/brain/classify', params: {q: text} }).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }
    }
})();