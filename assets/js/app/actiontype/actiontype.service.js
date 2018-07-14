
  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('actionTypeService', actionTypeService);

    actionTypeService.$inject = ['$http'];

    function actionTypeService($http) {
        
        var service = {
            get: get, 
            getParams: getParams 
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/actiontype' });
        }
        
        function getParams(id) {
            return $http({method: 'GET', url: '/actiontype/' + id + '/params' })
              .then(function(data){
                  return addAllOptions(data.data);
              });
        }
        
        function addAllOptions(actionParams){
            var promises = [];
            
            actionParams.forEach(function(actionParam, index){
                promises.push(getOptions(actionParam));
            });

            return Promise.all(promises);
        }
        
        function getOptions(actionParam){
            
            // default operator
            actionParam.operator = '==';
            
            if(!actionParam.path || actionParam.path.length === 0){
                return Promise.resolve(actionParam);
            }
            
            // we download the options
            return $http({method: 'GET', url: actionParam.path })
              .then(function(data){

                 // and add them to the stateParam
                 actionParam.options = data.data;
                 return Promise.resolve(actionParam); 
              });
        }

    }
})();
