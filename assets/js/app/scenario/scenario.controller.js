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

    scenarioCtrl.$inject = ['scenarioService', 'categoryService', 'eventTypeService', 'stateTypeService', 'launcherService',  'stateService', 'actionTypeService', 'actionService'];

    function scenarioCtrl(scenarioService, categoryService, eventTypeService, stateTypeService, launcherService, stateService, actionTypeService, actionService) {
        /* jshint validthis: true */
        var vm = this;
        
        
        vm.selectCategory = selectCategory;
    	vm.selectEventType = selectEventType;
        vm.addState = addState;
        vm.addAction = addAction;
        vm.insertAll = insertAll;
        vm.deleteLauncher = deleteLauncher;
        vm.createLauncher = createLauncher;
        vm.removeState = removeState;
        vm.removeAction = removeAction;
        vm.nextStep = nextStep;
        
        vm.actionTypes = [];
        vm.launchers = [];
        vm.states = [];
        vm.actions = [];
        
        activate();

        function activate() {
            getLaunchers();
            getCategory();
            getStateTypes();
            initialiseVar();
            getActionTypes();
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
        
        
        
        function getLaunchers(){
           return launcherService.get()
             .then(function(data){
                vm.launchers = data.data; 
             });
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
        
        function getActionTypes(){
            return actionTypeService.get()
              .then(function(data){
                 vm.actionTypes = data.data; 
              });
        }
        
        
        
        /**
         * When user select an eventType in scenario panel
         * The system get all launcherParams
         */
        function selectEventType(index, id){
            
            // we set the eventtype selected
            vm.newLauncher.eventtype = id;
            return eventTypeService.getLauncherParams(id)
              .then(function(launcherParams){
                 vm.launcherParams = launcherParams;
              });
        }
        
        function getStateTypes(){
            return stateTypeService.get()
              .then(function(data){
                 vm.stateTypes = data.data; 
              });
        }
        
        
        function createLauncher(newLauncher, launcherParams){
            var template = scenarioService.generateTemplate(launcherParams);
            newLauncher.condition_template = template;
            var func;
            
            // if we insert or update the launcher
            if(newLauncher.id){
                func = launcherService.update(newLauncher.id, newLauncher);
            } else {
                func = launcherService.create(newLauncher);
            }
            
            return func
                .then(function(data){
                    vm.newLauncher = data.data;
                    console.log('Created/Updated Launcher : ');
                    console.log(vm.newLauncher); 
                });
        }
        
        function addState(index, stateTypeId){
            var newState = {
                launcher: vm.newLauncher.id,
                state: stateTypeId
            };
            
            return stateTypeService.getParams(stateTypeId)
              .then(function(params){
                  
                  newState.params = params;
                  vm.states.push(newState);
              });
        }
        
        function addAction(index, actionType){
            
            var newAction = {
                launcher: vm.newLauncher.id,
                action: actionType.id,
                name: actionType.name
            };
            
            return actionTypeService.getParams(actionType.id)
              .then(function(params){
                  
                  
                  // foreach parameter, we transform the argument 
                  params.forEach(function(param){
                     param.actiontypeparam = param.id; 
                     delete param.id;
                  });
                  
                  newAction.params = params;
                  vm.actions.push(newAction);
              });
            
        }
        
        function removeState(index, id){
            vm.states.splice(index, 1);
        }
        
        function removeAction(index, id){
            vm.actions.splice(index, 1);
        }
        
        function deleteLauncher(index, id){
            return launcherService.destroy(id)
              .then(function(){
                  vm.launchers.splice(index, 1);
              });
        }
       
       
       function insertAll(){
           return actionService.insertActions(vm.actions)
             .then(function(result){
                 return stateService.insertOrUpdateStates(vm.states);
             })
             .then(function(){
                 finishScenario();
             });
       }
       
        
        
        function nextStep(){
            switch(vm.step){
                case 2:
                    createLauncher(vm.newLauncher, vm.launcherParams)
                      .then(function(){
                            vm.step++;
                      });
                break;
                    
                case 3:
                    vm.step++;
                break;
                
                case 4: 
                    // save everything
                break;
            }
        }
       
        
        	
        function finishScenario() {
          initialiseVar();
          getLaunchers();
          $('#modalNewScenario').modal('hide');
        }
       
    }
})();