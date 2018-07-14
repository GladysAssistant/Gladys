  
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