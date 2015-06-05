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
        .module('app')
        .controller('ScriptCtrl', ScriptCtrl);

    ScriptCtrl.$inject = ['$scope','scriptservice'];

    function ScriptCtrl($scope, scriptservice) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.createScript = createScript;
    	vm.currentScript = '';
        vm.destroy = destroy;
        vm.error = false;
        vm.newFileWarning = false;
        vm.refresh = refresh;
        vm.runScript = runScript;
        vm.scriptError = false;
        vm.scriptErrorMessage = {};
        vm.script = {};
        vm.scripts = [];  
        vm.save = save;
        vm.savingState = '';
        
        
        var editor;

        activate();

        function activate() {
            activateEditor();
            return getAllScripts();
        }
        
        /**
         * Activate the AceEditor
         */
        function activateEditor(){
            editor = ace.edit("editor");
			editor.setTheme("ace/theme/xcode");
			editor.getSession().setMode("ace/mode/javascript");
			editor.setOptions({
				minLines:5,
				maxLines: 25
            });
        } 
        
        function validFileName(name){
        	var reg = /[a-zA-Z0-9]+\.js$/;
        	if(!reg.test(name))
                return false;
            
            var alreadyExist = false;
            var i = 0;
            while(!alreadyExist && i < vm.scripts.length){
                alreadyExist = (vm.scripts[i].name == name);
                i++;
            }
            return !alreadyExist;     
        }
        
        function createScript(){
            if(validFileName(vm.newName)){
                var newScript = {
                    name: vm.newName,
                    id:vm.newName
                };
                vm.scripts.push(newScript);
                vm.currentScript = vm.newName;
                vm.script.name = vm.newName;
                vm.script.content = "";
                vm.newName = "";
                $('#NewFileModal').modal('hide');
                // reseting new File Form
                vm.newFileWarning = false;
            }else{
                vm.newFileWarning = true;
            }
            
        }
        
        function removeFromSelect(name){
            var i=0;
            var find = false;
            while(!find && i < vm.scripts.length){
                if(vm.scripts[i].name == name){
                    vm.scripts.splice(i, 1);
                    find = true;
                }
                i++;
            }
        }
        
        function destroy(name){
            return scriptservice.destroyScript(name)
                .then(function(data){
                    if(data.data == '"ok"' || (data.data.code && data.data.code == 'ENOENT') ){
                        vm.currentScript = '';
        		  		editor.setValue('');
          				vm.script.name= '';
                        removeFromSelect(name);
                        vm.script.index = null;
                    }else{
                        vm.error = true;
                        setTimeout(removeError, 3000);
                        console.log(data.data);
                    }
                   
                });
        }

        function getAllScripts() {
            return scriptservice.getAllScripts()
                .then(function(data){
                    vm.scripts = data.data;
                });
        }
        
        function refresh(){
            vm.scriptError = false;
            if(vm.currentScript != 'newScript'){
                return scriptservice.getScript(vm.currentScript)
                    .then(function(data){
                        editor.setValue(data.data.content);
        				vm.script = data.data;
                    });
      		}
      		else{
      			editor.setValue('');
      			vm.script.name= '';
                $('#NewFileModal').modal('show');
      		}
        }
        
        function resetSavingState(){
            $scope.$apply(function () {
                  vm.savingState = '';
            });
        }
        
        function removeError(){
             $scope.$apply(function () {
                  vm.error = false;
            });
        }
        
        function runScript(name){
           vm.scriptError = false;
           return save(name)
            .then(function(){
               return scriptservice.runScript(name)
                 .then(function(data){
                       if(data.data != '"ok"'){
                           vm.scriptErrorMessage = data.data;
                           vm.scriptError = true;
                       }
                 });
           });
        }
        
        function save(name){
            vm.savingState = 'saving';
            return scriptservice.saveScript({name: name, content: editor.getValue()})
                .then(function(data){
                    return new Promise(function(resolve, reject){
                        if(data.data == '"ok"'){
                            vm.savingState = 'saved';
                            setTimeout(resetSavingState, 3000);
                            resolve();
                        }else{
                            vm.error = true;
                            setTimeout(removeError, 3000);
                            console.log(data.data);
                            reject();
                        } 
                    });
                    
                });   
        }
    }
})();