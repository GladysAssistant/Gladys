
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('actionService', actionService);

    actionService.$inject = ['$http'];

    function actionService($http) {
        
        var service = {
            create: create,
            update: update, 
            destroy: destroy,
            addParam: addParam,
            insertActions: insertActions
        };

        return service;

        function create(action) {
            return $http({method: 'POST', url: '/action', data: action });
        }
        
        function update(id, action){
            return $http({method: 'PATCH', url: '/action/' + id, data: action });
        }
        
        function destroy(id){
            return $http({method: 'DELETE', url: '/action/' + id });
        }
        
        function addParam(actionId, param){
            return $http({method: 'POST', url: '/action/' + actionId + '/param', data: param })
              .then(function(data){
                  return data.data;
              });
        }
        
        function updateParam(paramId, param){
            return $http({method: 'PATCH', url: '/actionparam/' + paramId , data: param })
              .then(function(data){
                  return data.data;
              });
        }
        
        function insertActions(actions){
    
            var tabActions = [];
            actions.forEach(function(action){
                if(action.id){
                    tabActions.push(updateActionAndParams(action));
                } else {
                    tabActions.push(insertActionAndParams(action));
                }
            });
            
            return Promise.all(tabActions);    
        }
        
        function insertActionAndParams(action){
            
            var newAction = {
              action: action.action,
              launcher: action.launcher  
            };
            
            var params = action.params;
            
            // first we create the action
            return create(newAction)
              .then(function(data){
                  
                 newAction = data.data
                 
                 var tabParams = [];
                 params.forEach(function(param){
                     tabParams.push(addParam(newAction.id, param));
                 });
                  
                 // then we create all the actionParams
                 return Promise.all(tabParams)
                   .then(function(params){
                       
                      // an return the actions and all its params
                      newAction.params = params;
                      return newAction; 
                   });
              });
        }
        
        function updateActionAndParams(action){
            var newAction = {
              action: action.action,
              launcher: action.launcher  
            };
            
            var params = action.params;
            
            // first we create the action
            return update(action.id,newAction)
              .then(function(data){
                  
                 newAction = data.data
                 
                 var tabParams = [];
                 params.forEach(function(param){
                     tabParams.push(updateParam(param.id, param));
                 });
                  
                 // then we update all the actionParams
                 return Promise.all(tabParams)
                   .then(function(params){
                       
                      // an return the actions and all its params
                      newAction.params = params;
                      return newAction; 
                   });
              });
        }

    }
})();
