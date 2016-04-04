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
        .factory('stateTypeService', stateTypeService);

    stateTypeService.$inject = ['$http'];

    function stateTypeService($http) {
        
        var service = {
            get: get,
            getParams: getParams
        };

        return service;

        function get(){
            return $http({method: 'GET', url: '/statetype' });
        }
        
        function getParams(stateTypeId){
            return $http({method: 'GET', url: '/statetype/' + stateTypeId + '/stateparam' })
               .then(function(data){
                   return addAllOptions(data.data);
               });
        }
        
        function addAllOptions(stateParams){
            var promises = [];
            
            stateParams.forEach(function(stateParam, index){
                promises.push(getOptions(stateParam));
            });

            return Promise.all(promises);
        }
        
        function getOptions(stateParam){
            
            // default operator
            launcherParam.operator = '==';
            
            if(!stateParam.path || stateParam.path.length === 0){
                return Promise.resolve(stateParam);
            }
            
            // we download the options
            return $http({method: 'GET', url: stateParam.path })
              .then(function(data){

                 // and add them to the launcherParam
                 stateParam.options = data.data;
                 return Promise.resolve(stateParam); 
              });
        }
        
    }
})();