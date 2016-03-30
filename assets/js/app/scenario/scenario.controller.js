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

    scenarioCtrl.$inject = ['scenarioService', 'categoryService', 'eventTypeService'];

    function scenarioCtrl(scenarioService, categoryService, eventTypeService) {
        /* jshint validthis: true */
        var vm = this;
        
        
        vm.selectCategory = selectCategory;
    	vm.selectEventType = selectEventType;
        
        vm.createAction = createAction;
        vm.createLauncher = createLauncher;
        vm.createState = createState;
        vm.destroyAction = destroyAction;
        vm.destroyLauncher = destroyLauncher;
        vm.destroyState = destroyState;
        vm.finishScenario = finishScenario;
        vm.getActionsTypes = getActionTypes;
        vm.getStateTypes = getStateTypes;
        vm.getLauncherTypes = getLauncherTypes;
        vm.getOneOptionName = getOneOptionName;
        vm.getScenarios = getScenarios;
        //vm.getActionOptions = getActionOptions;
        //vm.getLauncherOptions = getLauncherOptions;
        vm.selectLauncher = selectLauncher;
        vm.selectState = selectState;
        vm.selectAction = selectAction;
        vm.skipState = skipState;
        vm.scenarios = [];
        
        activate();

        function activate() {
            getCategory();
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
        
        function selectEventType(index, id, optionsPath){
            
            // first we get
            return eventTypeService.getLauncherParams(id)
              .then(function(launcherParams){
                 vm.launcherParams = launcherParams;
                 console.log(launcherParams);
                  
              })
              .catch(console.log);
        }
        
        function createAction() {
            return scenarioService.createAction(vm.newAction)
                .then(function(data){
                    vm.newAction.id = data.data.id;
                    data.data.name = vm.newAction.name;
                    vm.savedActions.push(data.data);
                });
        }
        
        function createLauncher() {
    	   return scenarioService.createLauncher(vm.newLauncher)
                .then(function(data){
                    vm.newLauncher.id = data.data.id;
                    vm.newState.launcher = data.data.id;
                    vm.newAction.launcher = data.data.id;
                    vm.step = 2;
                });
        } 
        
        function createState() {
            return scenarioService.createState(vm.newState)
                .then(function(data){
                    vm.newState.id = data.data.id;
                    data.data.name = vm.newState.name;
                    vm.savedStates.push(data.data);
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
        
        function getStateTypes() {
             return scenarioService.getStateTypes()
                .then(function(data){
                    vm.stateTypes = data.data;
                });
        }
        
        function getLauncherTypes() {
             return scenarioService.getLauncherTypes()
                .then(function(data){
                    vm.launcherTypes = data.data;
                });
        }
        
        function getScenarios() {
            return scenarioService.getScenarios()
                .then(function(data){
                    for(var i = 0; i<data.data.length;i++){
                        if(data.data[i].launcher.optionspath){
                             getOneOptionName(data.data[i].launcher.optionspath, data.data[i].launcher, data.data[i].parametre);
                        }
                    }
                    vm.scenarios = data.data;
                });
        }
        
        function getActionOptions(path){
            return scenarioService.getActionOptions(path)
                .then(function(data){
                    console.log(data.data);
                    vm.actionOptions = data.data;
                });
        }
        
        function getLauncherOptions(path){
            return scenarioService.getLauncherOptions(path)
                .then(function(data){
                    vm.launcherOptions = data.data;
                });
        }
        /**
         * Give more information about the launcher (with his id)
         */
        function getOneOptionName(path, variable, id ){
            return scenarioService.getLauncherOptions(path)
                .then(function(data){
                    var i = 0;
                    var found = false;
                    while(!found && i<data.data.length){
                        if(data.data[i].id == id){
                            variable.option = data.data[i];
                            found = true;
                        }
                        i++;
                    }
                });
        }
        
        
        function selectLauncher(index,launcherId) {
            vm.selectedLauncher = vm.launcherTypes[index];
            vm.newLauncher.launcher = vm.launcherTypes[index].id;
            // if an OptionPath is provided, get all the options by making a request to
            // the specified URL
            if(vm.selectedLauncher.optionspath){

              vm.newLauncher.operator = '==';
              // Get the options
              getLauncherOptions(vm.selectedLauncher.optionspath);
            }
        }
        
        function selectState(index,stateId) {
            vm.selectedState = vm.stateTypes[index];
            vm.newState.state = vm.stateTypes[index].id;
            vm.newState.name = vm.stateTypes[index].name;
        }
        
        function selectAction(index, actionId) {
            vm.selectedAction = vm.actionTypes[index];
            vm.newAction.action = vm.actionTypes[index].id;
            vm.newAction.name = vm.actionTypes[index].name;
    	   
            // if an OptionPath is provided, get all the options by making a request to
            // the specified URL
            if(vm.selectedAction.optionspath){
                getActionOptions(vm.selectedAction.optionspath);
            }
        }
        
        function skipState(){
            if(vm.step < 3){
               vm.step++; 
            }
        }   
    }
})();