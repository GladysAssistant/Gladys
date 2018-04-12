/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Mathieu Andrade
  */
  
  
(function () {
'use strict';

    angular
        .module('gladys')
        .controller('DeviceValueBoxCtrl', DeviceValueBoxCtrl);

    DeviceValueBoxCtrl.$inject = ['deviceService', 'boxService', '$scope'];

    function DeviceValueBoxCtrl(deviceService, boxService, $scope) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.init = init;
        vm.saveCurrentDeviceType = saveCurrentDeviceType;
        
        vm.box = null;
        vm.deviceTypes =[];
        vm.currentDeviceType = null;

        function init(id){
            vm.boxId = id;
            boxService.getById(id)
                .then(function(data) {
                    vm.box = data.data;
                    if(vm.box.params && vm.box.params.device) {
                        vm.currentDeviceType = {};
                        vm.currentDeviceType.id = vm.box.params.device;
                        vm.currentDeviceType.name = vm.box.params.name;
                        vm.currentDeviceType.roomName = vm.box.params.roomName;
                        vm.currentDeviceType.unit = vm.box.params.unit;
                        vm.currentDeviceType.type = vm.box.params.type;
                        getStatesDevice();
                        activate();
                    }
                });
            getDeviceTypes();
        }

        function activate() {
            waitForNewValue();
            return;
        }        

        function saveCurrentDeviceType(){
            if(vm.currentDeviceType && vm.currentDeviceType.id){
                boxService.update(vm.boxId, {params: {
                    device: vm.currentDeviceType.id, 
                    name: vm.currentDeviceType.name,
                    roomName: vm.currentDeviceType.roomName,  
                    unit: vm.currentDeviceType.unit,
                    type: vm.currentDeviceType.type
                }})
                .then(function(data){
                    getStatesDevice();
                })
            }  
        }
        
        function getDeviceTypes(){
            return deviceService.getTypes()
                .then(function(data){
                    vm.deviceTypes = data.data;
                });
        }
        
        // waiting for websocket message
        function waitForNewValue(){
            io.socket.on('newDeviceState', function (deviceState) {
                // if the device is the current device, push the value in the graph
                if(vm.currentDeviceType && deviceState.devicetype == vm.currentDeviceType.id){
                    $scope.$apply(function(){
                        vm.currentDeviceType.value = deviceState.value;
                        if(vm.currentDeviceType.type == 'binary'){
                            if(vm.currentDeviceType.value == 1) {
                                vm.currentDeviceType.value = "ON"
                            }else{
                                vm.currentDeviceType.value = "OFF"
                            }
                            // if is binary, change icon
                            getIcon()                
                        }
                    });
                }
            });
        }

        function getStatesDevice(){   
            return deviceService.getStates(vm.currentDeviceType.id, 0, 1)
              .then(function(data){
                    if(data.data[0]){
                        vm.currentDeviceType.value = data.data[0].value
                    }
                    if(vm.currentDeviceType.type == 'binary'){
                        if(vm.currentDeviceType.value == 1) {
                            vm.currentDeviceType.value = "ON"
                        }else{
                            vm.currentDeviceType.value = "OFF"
                        }                
                    }
              })
              .then(function(){
                  getIcon()
              })
        }

        function getIcon(){
            switch(vm.currentDeviceType.type){
                case "temperature":
                    vm.currentDeviceType.icon = "fa-thermometer"
                    break;
                case "humidity":
                    vm.currentDeviceType.icon = "fa-tint"
                    break;
                case "binary":
                    if(vm.currentDeviceType.value == "ON"){
                        vm.currentDeviceType.icon = "fa-toggle-on"
                    } else{
                        vm.currentDeviceType.icon = "fa-toggle-off"
                    }
                    break;
                case "multilevel":
                    vm.currentDeviceType.icon = "fa-sliders"
                    break;
                default:
                    vm.currentDeviceType.icon = "fa-circle-thin"
                    break;
            }
        }
        
    }
})();
