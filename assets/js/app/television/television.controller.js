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
        .controller('TelevisionCtrl', TelevisionCtrl);

    TelevisionCtrl.$inject = ['televisionService', 'deviceService', 'roomService'];

    function TelevisionCtrl(televisionService,  deviceService, roomService) {
        /* jshint validthis: true */
        var vm = this;
        vm.roomId = null;
        vm.displayAskRoomForm = false;
        vm.hideBan = 'hidden'
        vm.DefaultValue = true;
        vm.currentPowerState = '';
        vm.currentSoundState = '';
        vm.currentChannel = '';
        vm.currentMuteState = '';
        vm.allSources = [{label:'TV'}];
        vm.currentSource = 'TV';

        vm.selectRoomId = selectRoomId;

        vm.play = play;
        vm.pause = pause;
        vm.stop = stop;
        vm.rewind = rewind;
        vm.fastForward = fastForward;
        vm.switchState = switchState;
        vm.getState = getState;
        vm.programPlus = programPlus;
        vm.programMinus = programMinus;
        vm.setChannel = setChannel;
        vm.setMuted = setMuted;
        vm.volumeUp = volumeUp;
        vm.volumeDown = volumeDown;
        vm.pressKey = pressKey;
        vm.getSources = getSources;
        vm.openSources = openSources;
        vm.openMenu = openMenu;
        vm.rec = rec;

        vm.thisChannel = null;

        vm.init = init;
        
        function activate(){
            getRoomId();
            //if(vm.displayAskRoomForm) getRooms();
            getRooms();
        }

        function init(boxId){
            vm.boxId = boxId;
            activate();
            getData(vm.roomId)
            getSources()
        }
        
        function getRoomId() {
            vm.roomId =  televisionService.getSavedRoomBox(vm.boxId);
            if(vm.roomId) vm.displayAskRoomForm = false;
            else vm.displayAskRoomForm = true;
        }

        function getRooms(){
            roomService.get()
              .then(function(data){
                  vm.rooms = data.data;
              });
        }

        function selectRoomId(roomId){
            televisionService.saveRoomBox(vm.boxId, roomId);
            vm.displayAskRoomForm = false;
            vm.roomId = roomId;
            getData(vm.roomId);
        }

        function getData(roomId){
            deviceService.getDeviceTypeInRoom(roomId)
            .then(function(devicesTypes) {
                devicesTypes = devicesTypes.data.deviceTypes;
                for(var i = 0; i < devicesTypes.length; i++) {
                    if(devicesTypes[i].category === "tv") {
                        if(devicesTypes[i].tag === 'Power') {
                            vm.currentPowerState = devicesTypes[i].lastValue
                        }
                        if(devicesTypes[i].tag === 'Sound') {
                            vm.currentSoundState = devicesTypes[i].lastValue
                        }
                        if(devicesTypes[i].tag === 'Channel') {
                            vm.currentChannel = devicesTypes[i].lastValue
                            vm.thisChannel = devicesTypes[i].lastValue
                        }
                        if(devicesTypes[i].tag === 'Mute') {
                            vm.currentMuteState = devicesTypes[i].lastValue
                        }
                    }
                }
            })
        }

        function pressKey(key){
            return televisionService.pressKey({room: vm.roomId, key: key})
            .then(function(){
                
            });
        }

        function getSources(){
            return televisionService.getSources({room: vm.roomId})
            .then(function(data){
                if (data.data !== undefined || data.data != 0) {
                    vm.allSources=data.data;
                } 
            })
        }

        function openSources(source){
            return televisionService.openSources({room: vm.roomId, id:source})
            .then(function(data){
                vm.currentSource=source;
            })
        }

        function openMenu() {
            return televisionService.openMenu({room: vm.roomId})
            .then(function(data){

            })
        }

        function rec() {
            return televisionService.rec({room: vm.roomId})
            .then(function(data){

            })
        }

        function play(){
            return televisionService.play({room: vm.roomId, controlType:'play'})
                .then(function(){
                    
                });
        }

        function pause(){
            return televisionService.pause({room: vm.roomId, controlType:'pause'})
                .then(function(){
                    
                });
        }

        function stop(){
            return televisionService.stop({room: vm.roomId, controlType:'stop'})
                .then(function(){
                    
                });
        }

        function rewind(){
            return televisionService.rewind({room: vm.roomId, controlType:'rewind'})
                .then(function(){

                });
        }

        function fastForward(){
            return televisionService.fastForward({room: vm.roomId, controlType:'fastForward'})
                .then(function(){

                });
        }

        function switchState(){
            return televisionService.switchState({room: vm.roomId, state: !vm.currentPowerState})
                .then(function(data){
                    if(data.status === 200){
                        updateDeviceType('Power', vm.currentPowerState, vm.roomId)
                        .then(function(data){
                            if(data.status === 201){
                                vm.currentPowerState=!vm.currentPowerState
                            }
                        })
                    }
                });
        }

        function getState(){
            return televisionService.getState({room: vm.roomId})
                .then(function(data){
                    
                });
        }

        function programPlus() {
            if(!vm.currentChannel) {
                vm.currentChannel=0;
            }
            vm.thisChannel=parseInt(vm.currentChannel)+parseInt(1)
            setChannel()
        }

        function programMinus() {
            if(!vm.currentChannel) {
                vm.currentChannel=0;
            }
            if(vm.thisChannel > 0) {
                vm.thisChannel=parseInt(vm.currentChannel)-parseInt(1)
                setChannel()
            }
        }

        function setChannel(channel) {
            return televisionService.setChannel({room: vm.roomId, channel: channel})
                .then(function(data){
                    console.log(data)
                });
        }

        function volumeDown() {
            return televisionService.volumeDown({room: vm.roomId})
                .then(function(data){

                });
        }

        function volumeUp() {
            return televisionService.volumeUp({room: vm.roomId})
                .then(function(data){

                });
        }

        function setMuted() {
            return televisionService.setMuted({room: vm.roomId, state: !vm.currentMuteState})
                .then(function(data){
                    if(data.status === 200){
                        if(vm.currentMuteState) {
                            vm.hideBan = ''
                        } else {
                            vm.hideBan = 'hidden'
                        }
                        updateDeviceType('Mute', vm.currentMuteState, vm.roomId)
                        .then(function(data){
                            if(data.status === 201){
                                vm.currentMuteState=!vm.currentMuteState
                            }
                        })
                    }
                });
        }

        function updateDeviceType(deviceType,state, roomId) {
            return deviceService.getDeviceTypeInRoom(roomId)
            .then(function(devicesTypes) {
                devicesTypes = devicesTypes.data.deviceTypes;
                for(var i = 0; i < devicesTypes.length; i++) {
                    if(devicesTypes[i].category === "tv" && devicesTypes[i].tag === deviceType) {
                        return televisionService.updateDeviceType({value:state,devicetype:devicesTypes[i].id})
                    }
                }
            })
        }
    }
})();
