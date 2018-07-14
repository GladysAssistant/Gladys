  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('stateTypeService', stateTypeService);

    stateTypeService.$inject = ['$http'];

    function stateTypeService($http) {
        
        var service = {
            get: get,
            getTemplateParams: getTemplateParams,
            getParams: getParams
        };

        return service;

        function get(){
            return $http({method: 'GET', url: '/statetype' });
        }
        
        function getParams(stateTypeId){
            return $http({method: 'GET', url: '/statetype/' + stateTypeId + '/param' })
               .then(function(data){
                   return addAllOptions(data.data);
               });
        }
        
        function getTemplateParams(stateTypeId){
            return $http({method: 'GET', url: '/statetype/' + stateTypeId + '/templateparam' })
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
            stateParam.operator = '==';
            
            if(!stateParam.path || stateParam.path.length === 0){
                return Promise.resolve(stateParam);
            }
            
            // we download the options
            return $http({method: 'GET', url: stateParam.path })
              .then(function(data){

                 // and add them to the stateParam
                 stateParam.options = data.data;
                 return Promise.resolve(stateParam); 
              });
        }
        
    }
})();