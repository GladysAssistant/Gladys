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

    TelevisionCtrl.$inject = ['televisionService', 'deviceService', 'boxService'];

    function TelevisionCtrl(televisionService, deviceService, boxService) {
        /* jshint validthis: true */
        var vm = this;
        vm.deviceId = null;
        vm.displayAskDeviceForm = false;
        vm.currentPowerState = '';
        vm.currentSoundState = '';
        vm.currentChannel = '';
        vm.currentMuteState = '';
        vm.defaultSource = [{ label: 'TV' }];
        vm.allSources = vm.defaultSource;
        vm.currentSource = vm.defaultSource[0].label;
        vm.currentDeviceName = '';

        vm.selectDevice = selectDevice;

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
        vm.customCommand = customCommand;

        vm.thisChannel = null;

        vm.init = init;


        function init(id) {
            vm.boxId = id;
            getDevices();
            boxService.getById(id)
                .then(function (data) {
                    vm.box = data.data;
                    if (vm.box.params && vm.box.params.deviceId) {
                        setBoxInformation(vm.box.params.deviceId, vm.box.params.name)
                    } else {
                        vm.displayAskDeviceForm = true;
                    }
                });
        }

        function setBoxInformation(deviceId, deviceName){
            vm.displayAskDeviceForm = false;
            vm.deviceId = deviceId;
            vm.currentDeviceName = deviceName;
            getData(deviceId);
            getSources();
        }

        function getDevices() {
            deviceService.get()
                .then(function(data) {
                    vm.devices = data.data;
                })
        }

        function selectDevice(device) {
            if(typeof(device)==="string") {
                device = JSON.parse(device);
            }
            boxService.update(vm.boxId, { params: { deviceId: device.id, name: device.name } });
            setBoxInformation(device.id, device.name)
        }

        function getData() {
            deviceService.getDeviceTypesDevice(vm.deviceId)
                .then(function (devicesTypes) {
                    devicesTypes = devicesTypes.data;
                    devicesTypes.forEach(function(deviceType) {
                        if(deviceType.device === vm.deviceId && deviceType.category === "tv") {
                            switch(deviceType.identifier){
                                case 'Power':
                                    vm.currentPowerState = deviceType.lastValue
                                    vm.devicePowerId = deviceType.id
                                    break;
                                case 'Sound':
                                    vm.currentSoundState = deviceType.lastValue
                                    vm.deviceSoundId = deviceType.id
                                    break;
                                case 'Channel':
                                    vm.currentChannel = deviceType.lastValue
                                    vm.thisChannel = deviceType.lastValue
                                    vm.deviceChannelId = deviceType.id
                                    break;
                                case 'Mute':
                                    vm.currentMuteState = deviceType.lastValue
                                    vm.deviceMuteId = deviceType.id
                                    break;
                            }
                        }                        
                    });
                })
                .catch(() => {
                    console.log('No deviceType found on this room with type Power, Sound, Channel and Mute !')
                    vm.deviceMuteId = null;
                    vm.deviceChannelId = null;
                    vm.deviceSoundId = null;
                    vm.devicePowerId = null;
                })
        }

        function pressKey(key) {
            return televisionService.pressKey({ device: vm.deviceId, key: key })
                .then(function () {

                });
        }

        function getSources() {
            return televisionService.getSources({ device: vm.deviceId })
                .then(function (data) {
                    if(data.status === 200){
                        if (data.data !== undefined || data.data != 0) {
                            vm.allSources = data.data;
                        }
                    } else {
                        vm.allSources = vm.defaultSource;
                    }
                })
                .catch((data) => {
                    vm.allSources = vm.defaultSource;
                })
        }

        function openSources(source) {
            return televisionService.openSources({ device: vm.deviceId, id: source })
                .then(function (data) {
                    vm.currentSource = source;
                })
        }

        function openMenu() {
            return televisionService.openMenu({ device: vm.deviceId })
                .then(function (data) {

                })
        }

        function rec() {
            return televisionService.rec({ device: vm.deviceId })
                .then(function (data) {

                })
        }

        function play() {
            return televisionService.play({ device: vm.deviceId, controlType: 'play' })
                .then(function () {

                });
        }

        function pause() {
            return televisionService.pause({ device: vm.deviceId, controlType: 'pause' })
                .then(function () {

                });
        }

        function stop() {
            return televisionService.stop({ device: vm.deviceId, controlType: 'stop' })
                .then(function () {

                });
        }

        function rewind() {
            return televisionService.rewind({ device: vm.deviceId, controlType: 'rewind' })
                .then(function () {

                });
        }

        function fastForward() {
            return televisionService.fastForward({ device: vm.deviceId, controlType: 'fastForward' })
                .then(function () {

                });
        }

        function switchState() {
            return televisionService.switchState({ device: vm.deviceId, state: !vm.currentPowerState, deviceTypeId: vm.devicePowerId })
                .then(function (data) {
                    if (data.status === 200) {
                        vm.currentPowerState = !vm.currentPowerState
                    }
                });
        }

        function getState() {
            return televisionService.getState({ device: vm.deviceId })
                .then(function (data) {

                });
        }

        function programPlus() {
            if (!vm.currentChannel) {
                vm.currentChannel = 0;
            }
            vm.thisChannel = parseInt(vm.currentChannel) + parseInt(1)
            setChannel(vm.thisChannel)
        }

        function programMinus() {
            if (!vm.currentChannel) {
                vm.currentChannel = 0;
            }
            if (vm.thisChannel > 0) {
                vm.thisChannel = parseInt(vm.currentChannel) - parseInt(1)
                setChannel(vm.thisChannel)
            }
        }

        function setChannel(channel) {
            return televisionService.setChannel({ device: vm.deviceId, channel: channel, deviceTypeId: vm.deviceChannelId })
                .then(function (data) {
                    if (data.status === 200) {
                        vm.currentChannel = channel
                    }
                });
        }

        function volumeDown() {
            return televisionService.volumeDown({ device: vm.deviceId, deviceTypeId: vm.deviceSoundId })
                .then(function (data) {
                    if (data.status === 200) {
                        vm.currentSoundState = parseInt(vm.currentSoundState) - parseInt(1)
                    }
                });
        }

        function volumeUp() {
            return televisionService.volumeUp({ device: vm.deviceId, deviceTypeId: vm.deviceSoundId })
                .then(function (data) {
                    if (data.status === 200) {
                        vm.currentSoundState = parseInt(vm.currentSoundState) + parseInt(1)
                    }
                });
        }

        function setMuted() {
            return televisionService.setMuted({ device: vm.deviceId, state: !vm.currentMuteState, deviceTypeId: vm.deviceMuteId })
                .then(function (data) {
                    if (data.status === 200) {
                        vm.currentMuteState = !vm.currentMuteState
                    }
                });
        }

        function customCommand(color) {
            return televisionService.customCommand({ device: vm.deviceId, color: color})
                .then(function() {

                })
        }
    }
})();
