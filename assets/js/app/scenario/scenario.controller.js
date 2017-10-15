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

    scenarioCtrl.$inject = ['scenarioService', 'categoryService', 'eventTypeService', 'stateTypeService', 'launcherService',  'stateService', 'actionTypeService', 'actionService', 'notificationService', '$scope'];

    function scenarioCtrl(scenarioService, categoryService, eventTypeService, stateTypeService, launcherService, stateService, actionTypeService, actionService, notificationService, $scope) {
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
        vm.initialiseVar = initialiseVar;
        vm.nextStep = nextStep;
        vm.editScenario = editScenario;
        vm.updateScenario = updateScenario;
        vm.startCreateScenarioTextModal = startCreateScenarioTextModal;
        
        vm.actionTypes = [];
        vm.launchers = [];
        
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
            vm.newState = {};
            vm.newAction = {};
            vm.states = [];
            vm.actions = [];
            vm.step = 1;
        }
        
        var editor;

        $scope.$watch('vm.currentScenario', function(newValue, oldValue){
            if(editor) {
                editor.setValue(vm.currentScenario.yaml);
            }
        });

        $('#modalUpdateScenario').on('shown.bs.modal', function () {
            if(!editor) {
                activateEditor();
            }
        });
        
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
        
        function selectCategory(service){
            return categoryService.getEventTypes(service)
              .then(function(data){
                 vm.eventTypes = data.data; 
                 vm.step++;
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
        
        function addState(index, stateType){
            var newState = {
                launcher: vm.newLauncher.id,
                state: stateType.id,
                name: stateType.name
            };
            
            // first, we add the params 
            return stateTypeService.getParams(stateType.id)
              .then(function(params){
                  
                  // foreach parameter, we transform the argument 
                  params.forEach(function(param){
                     param.statetypeparam = param.id; 
                     delete param.id;
                  });
                  
                  newState.params = params;
                  
                  // then, we get all the templateParams
                  return stateTypeService.getTemplateParams(stateType.id);
              })
              .then(function(templateParams){
                  
                 
                 newState.templateParams = templateParams;
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

        function activateEditor(){
            editor = ace.edit("scenario-editor");
            ace.config.set("basePath", "/js/dependencies/ace");
			editor.setTheme("ace/theme/xcode");
			editor.getSession().setMode("ace/mode/yaml");
			editor.setOptions({
				minLines:5,
				maxLines: 25
            });
        } 


        function startCreateScenarioTextModal(){
            vm.currentScenario = {
                yaml: jsyaml.safeDump({
                    trigger: {
                        title: '',
                        condition_template: 'true',
                        active: 1,
                        code: '',
                        user: ''
                    }, 
                    conditions: [], 
                    actions: []
                })
            };
            $('#modalUpdateScenario').modal('show');
        }
        

        function editScenario(index, id){
            
            // if editor already exist, clean data
            if(editor) {
                editor.setValue('');
            }

            scenarioService.exportScenario(id)
                .then(function (data) {
                    vm.currentScenario = {
                        yaml: jsyaml.safeDump(data.data),
                        index: index,
                        id: id
                    };
                    if(editor) {
                        editor.setValue('');
                    }
                    $('#modalUpdateScenario').modal('show');
                })
                .catch(function (err) {
                    notificationService.errorNotificationTranslated('DEFAULT.ERROR')
                });
        }

        function updateScenario(currentScenario) {
           
            // if we are updating an existing scenario
            if(currentScenario.id) {
                scenarioService.updateScenario(currentScenario.id, jsyaml.safeLoad(editor.getValue()))
                    .then(function (data) {
                        vm.launchers[vm.currentScenario.index] = data.data.trigger;
                        $('#modalUpdateScenario').modal('hide');
                    })
                    .catch(function () {
                        notificationService.errorNotificationTranslated('SCENARIO.UPDATE_ERROR')
                    });
            } 
            
            // creating a new scenario
            else {
                scenarioService.importScenario(jsyaml.safeLoad(editor.getValue()))
                    .then(function(data){
                        vm.launchers.push(data.data.trigger);
                        $('#modalUpdateScenario').modal('hide');
                    })
                    .catch(function () {
                        notificationService.errorNotificationTranslated('SCENARIO.CREATE_ERROR')
                    });
            }
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
            console.log(vm.step);
            switch(vm.step){
                case 1: 
                    vm.step++;
                break;

                case 3:
                    createLauncher(vm.newLauncher, vm.launcherParams)
                      .then(function(){
                            vm.step++;
                      });
                break;
                    
                case 4:
                    vm.step++;
                break;
                
                case 5: 
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