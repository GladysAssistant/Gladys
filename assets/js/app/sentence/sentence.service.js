
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('sentenceService', sentenceService);

    sentenceService.$inject = ['$http'];

    function sentenceService($http) {
        
        var service = {
            get: get,
            update: update,
            reject: reject,
            approve: approve,
            getLabels: getLabels
        };

        return service;
        
        // all about sentences 
        
        function get(options, take, skip) {
            return $http({method: 'GET', url: '/sentence', params: { status: options.status, take: take, skip: skip}});
        }
        
        function update(sentence){
            return $http({method: 'PATCH', url: '/sentence/' + sentence.id, data: sentence});
        }
        
        function reject(id){
            return $http({method: 'PATCH', url: '/sentence/' + id, data: { status: 'rejected' } });
        }
        
        function approve(id){
            return $http({method: 'PATCH', url: '/sentence/' + id, data: { status: 'approved' } });
        }

        function getLabels() {
            return $http({method: 'GET', url: '/sentence/label' });
        }
    }
})();