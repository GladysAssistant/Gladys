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
        .factory('eventTypeService', eventTypeService);

    eventTypeService.$inject = ['$http'];

    function eventTypeService($http) {
        
        var service = {
            getLauncherParams: getLauncherParams,
            get: get
        };

        return service;


        function get(){
            return $http({method: 'GET', url: '/eventtype' });
        }

        function getLauncherParams(id) {
            return $http({method: 'GET', url: '/eventtype/' + id + '/launcherparam' })
              .then(function(data){
                 return addAllOptions(data.data); 
              });
        }
        
        function addAllOptions(launcherParams){
            var promises = [];
            
            launcherParams.forEach(function(launcherParam, index){
                promises.push(getOptions(launcherParam));
            });

            return Promise.all(promises);
        }
        
        function getOptions(launcherParam){
            
            // default operator
            launcherParam.operator = '==';
            
            if(!launcherParam.path || launcherParam.path.length === 0){
                return Promise.resolve(launcherParam);
            }
            
            // we download the options
            return $http({method: 'GET', url: launcherParam.path })
              .then(function(data){

                 // and add them to the launcherParam
                 launcherParam.options = data.data;
                 return Promise.resolve(launcherParam); 
              });
        }
        
    }
})();