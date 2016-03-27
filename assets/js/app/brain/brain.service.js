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
        .factory('brainService', brainService);

    brainService.$inject = ['$http'];

    function brainService($http) {
        var service = {
            classify: classify,
            trainNew: trainNew
        };

        return service;

        function classify(text) {
            return $http({method: 'GET', url: '/brain/classify', params: {q: text} });
        }
        
        function trainNew(){
            return $http({method: 'POST', url: '/brain/trainnew'});
        }
    }
})();