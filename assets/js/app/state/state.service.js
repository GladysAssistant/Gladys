  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('stateService', stateService);

    stateService.$inject = ['$http', 'scenarioService'];

    function stateService($http, scenarioService) {
        
        var service = {
            get: get,
            create: create,
            update: update, 
            destroy: destroy,
            insertOrUpdateStates: insertOrUpdateStates
        };

        return service;

        function get(){
            return $http({method: 'GET', url: '/state' });
        }
        
        function create(state, params){
            return $http({method: 'POST', url: '/state', data: state })
              .then(function(data){
                 if(params){
                     return insertAllParam(data.data.id, params);
                 } 
              });
        }
        
        function update(id, state){
            return $http({method: 'PATCH', url: '/state/' + id, data: state });
        }
        
        function destroy(id){
            return $http({method: 'DELETE', url: '/state/' + id });
        }
        
        function insertOrUpdateStates(states){
            
            var tabStates = [];
            
            states.forEach(function(state){
                
                var newState = {
                    state: state.state,
                    launcher: state.launcher
                };
                
                // we create the condition template
                newState.condition_template = scenarioService.generateTemplate(state.templateParams);
                
                // we insert or update the state
                if(state.id){
                    tabStates.push(update(state.id, newState));
                } else {
                    tabStates.push(create(newState, state.params));
                }
            });
            
            return Promise.all(tabStates);
        }
        
        function insertAllParam(id, params){
            var tabParams = [];
            
            params.forEach(function(param){
                tabParams.push(insertParam(id, param));
            });
            
            return Promise.all(tabParams);
        }
        
        
        function insertParam(id, param){
            return $http({method: 'POST', url: '/state/' + id + '/param', data: param });
        }
        
    }
})();