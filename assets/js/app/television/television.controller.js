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
        vm.devices = [];
        vm.devicetypes = [];
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

        getDevices();

        function init(id) {
            vm.boxId = id;
            
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
            vm.currentPowerState = null;
            vm.currentSoundState = null;
            vm.currentChannel = null;
            vm.currentMuteState = null;
            getData(deviceId);
            getSources();
        }

        function getDevices() {
            deviceService.getDeviceTypeByCategory({category:'TV'})
                .then(function(res) {
                    var tempDevices = [];
                    res.data.forEach(function(deviceType) {
                        if(!tempDevices.includes(deviceType.deviceName+':'+deviceType.device)) {
                            tempDevices.push(deviceType.deviceName+':'+deviceType.device)
                            vm.devicetypes[deviceType.device]=new Array()
                        }
                        vm.devicetypes[deviceType.device].push(deviceType);
                    })
                    tempDevices.forEach(function(tempDevice) {
                        var deviceId = tempDevice.split(":");
                        vm.devices.push({id:deviceId[1],name:deviceId[0]})
                    })
                })
        }

        function selectDevice(device) {
            if(typeof(device)==="string") {
                device = JSON.parse(device);
            }
            boxService.update(vm.boxId, { params: { deviceId: device.id, name: device.name } });
            setBoxInformation(device.id, device.name)
        }

        function getData(deviceId) {
            vm.devicetypes[deviceId].forEach(function(devicetype) {
                switch(devicetype.identifier){
                    case 'Power':
                        vm.currentPowerState = devicetype.lastValue
                        vm.devicePowerId = devicetype.id
                        break;
                    case 'Sound':
                        vm.currentSoundState = devicetype.lastValue
                        vm.deviceSoundId = devicetype.id
                        break;
                    case 'Channel':
                        vm.currentChannel = devicetype.lastValue
                        vm.thisChannel = devicetype.lastValue
                        vm.deviceChannelId = devicetype.id
                        break;
                    case 'Mute':
                        vm.currentMuteState = devicetype.lastValue
                        vm.deviceMuteId = devicetype.id
                        break;
                }
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
                .catch(function(data) {
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
