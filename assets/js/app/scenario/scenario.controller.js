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
        .controller('scenarioCtrl', scenarioCtrl);

    scenarioCtrl.$inject = ['scenarioService', 'categoryService', 'eventTypeService', 'stateTypeService', 'launcherService', 'stateService'];

    function scenarioCtrl(scenarioService, categoryService, eventTypeService, stateTypeService, launcherService, stateService) {
        /* jshint validthis: true */
        var vm = this;
        
        
        vm.selectCategory = selectCategory;
    	vm.selectEventType = selectEventType;
        vm.selectStateType = selectStateType;
        vm.createLauncher = createLauncher;
        
        vm.scenarios = [];
        
        activate();

        function activate() {
            getCategory();
            getStateTypes();
            initialiseVar();
            return;
        }
        
        function initialiseVar(){
            vm.newLauncher = {};
            vm.newLauncher.parametre = '';
            vm.newState = {};
            vm.newState.parametre = '';
            vm.newAction = {};
            vm.newAction.parametre = '';
            vm.savedStates = []; 
            vm.savedActions = [];
            vm.step = 1;
        }
        
        
        function getCategory(){
            return categoryService.get()
              .then(function(data){
                 vm.categories = data.data;
              });
        }
        
        function selectCategory(id){
            return categoryService.getEventTypes(id)
              .then(function(data){
                 vm.eventTypes = data.data; 
                 vm.step = 2;
              });
        }
        
        /**
         * When user select an eventType in scenario panel
         * The system get all launcherParams
         */
        function selectEventType(index, id){
            return eventTypeService.getLauncherParams(id)
              .then(function(launcherParams){
                 vm.launcherParams = launcherParams;
                 console.log(launcherParams);
                  
              })
              .catch(console.log);
        }
        
        function getStateTypes(){
            return stateTypeService.get()
              .then(function(data){
                 vm.stateTypes = data.data; 
              });
        }
        
        
        function createLauncher(){
            var template = scenarioService.generateTemplate(vm.launcherParams);
            vm.newLauncher.condition_template = template;
            return launcherService.create(vm.newLauncher);
        }
        
        function createState(){
            var template = scenarioService.generateTemplate(vm.stateParams);
            vm.newState.condition_template = template;
            return stateService.create(vm.newLauncher);
        }
        
        function selectStateType(index, id){
            return stateTypeService.getParams(id)
              .then(function(stateParams){
                  console.log(stateParams);
                  vm.stateParams = stateParams;
              });
        }
        
        function createAction() {
            return scenarioService.createAction(vm.newAction)
                .then(function(data){
                    vm.newAction.id = data.data.id;
                    data.data.name = vm.newAction.name;
                    vm.savedActions.push(data.data);
                });
        }
       
        
        function destroyAction(index,array, id) {
            return scenarioService.destroyAction(id)
                .then(function(data){
                    array.splice(index, 1); 
                });
        }
        
        function destroyLauncher(index, id) {
    	   return scenarioService.destroyLauncher(id)
                .then(function(data){
                    vm.scenarios.splice(index, 1); 
                });
        } 
        
        function destroyState(index, array,  id) {
            return scenarioService.destroyState(id)
                .then(function(data){
                    array.splice(index, 1);
                });
        }
        	
        function finishScenario() {
          initialiseVar();
          getScenarios();
          $('#modalNewScenario').modal('hide');
        }
        
        function getActionTypes() {
            return scenarioService.getActionTypes()
                .then(function(data){
                    return new Promise(function(resolve, reject){
                        vm.actionTypes = data.data;
                        resolve();
                    });
                });
        }
       
        
        function skipState(){
            if(vm.step < 3){
               vm.step++; 
            }
        }   
    }
})();