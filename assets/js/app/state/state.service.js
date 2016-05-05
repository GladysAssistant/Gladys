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
        
        function create(state){
            return $http({method: 'POST', url: '/state', data: state });
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
                newState.condition_template = scenarioService.generateTemplate(state.params);
                
                // we insert or update the state
                if(state.id){
                    tabStates.push(update(state.id, newState));
                } else {
                    tabStates.push(create(newState));
                }
            });
            
            return Promise.all(tabStates);
        }
        
    }
})();