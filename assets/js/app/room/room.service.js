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
        .factory('roomService', roomService);

    roomService.$inject = ['$http'];

    function roomService($http) {
        var service = {
            addRelation: addRelation,
            defineSleepIn: defineSleepIn,
            destroyRelation: destroyRelation,
            destroySleepin: destroySleepin,
            getRooms: getRooms,
            getRelationTypes: getRelationTypes,
            getRelations: getRelations,
            getSleepin: getSleepin,
        };

        return service;

        function addRelation(newRelation) {
            return $http({method: 'POST', url: '/House/addrelation', data: newRelation }).
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

        function defineSleepIn(newSleepIn) {
            return $http({method: 'POST', url: '/Room/defineSleepIn', data: newSleepIn }).
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

        function destroyRelation(id) {
            return $http({method: 'POST', url: '/house/destroyrelationhouse', data: {id:id} }).
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

        function destroySleepin(roomId, userId) {
            return $http({method: 'POST', url: '/room/destroySleepIn', data: {room:roomId, user:userId} }).
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

        function getRooms() {
            return $http({method: 'POST', url: '/Room/index' }).
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

        function getRelationTypes() {
            return $http({method: 'POST', url: '/userhouserelationtype/index' }).
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

        function getRelations() {
            return $http({method: 'POST', url: '/house/getrelationhouse' }).
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

        function getSleepin() {
            return $http({method: 'POST', url: '/room/getSleepin' }).
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