(function() {
  'use strict';

  angular
    .module('gladys')
    .controller('TelevisionCtrl', TelevisionCtrl);

  TelevisionCtrl.$inject = ['televisionService', 'deviceService', 'boxService', 'moduleService', '$scope'];

  function TelevisionCtrl(televisionService, deviceService, boxService, moduleService, $scope) {
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
    vm.allSources = '';
    vm.currentSource = '';
    vm.currentDeviceName = '';
    vm.availableMethods = '';

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
    vm.openSource = openSource;
    vm.openMenu = openMenu;
    vm.rec = rec;
    vm.customCommand = customCommand;
    vm.openInfo = openInfo;
    vm.programVod = programVod;

    vm.thisChannel = null;

    vm.init = init;

    var getMethods = {
      'module': '',
      'service': 'television',
      'methods': ['play', 'pause', 'stop', 'rewind', 'fastForward', 'switchState', 'getState', 'setChannel', 'getChannel', 'setMuted', 'getMuted', 'volumeUp', 'volumeDown', 'pressKey', 'getSources', 'openSource', 'openMenu', 'rec', 'customCommand', 'programPlus', 'programMinus', 'openInfo', 'programVod']
    };

    function init(id) {
      vm.boxId = id;

      boxService.getById(id)
        .then(function(data) {
          vm.box = data.data;
          getDevices();
        });
      waitForNewValue();
    }

    function setBoxInformation(deviceId, deviceName, deviceService) {
      vm.displayAskDeviceForm = false;
      vm.deviceId = deviceId;
      vm.currentDeviceName = deviceName;
      vm.currentPowerState = null;
      vm.currentSoundState = null;
      vm.currentChannel = null;
      vm.currentMuteState = null;
      getMethods.module = deviceService;
      moduleService.getMethods(getMethods)
        .then(function(data) {
          vm.availableMethods = data.data;
          getData(deviceId);
          if (vm.availableMethods.getSources) {
            getSources();
          }
        });
    }

    function getDevices() {
      deviceService.getDeviceTypeByCategory({ category: 'television' })
        .then(function(res) {
          var tempDevices = [];
          res.data.forEach(function(deviceType) {
            if (!tempDevices.includes(deviceType.deviceName + ':' + deviceType.device)) {
              tempDevices.push(deviceType.deviceName + ':' + deviceType.device);
              vm.devicetypes[deviceType.device] = new Array();
            }
            vm.devicetypes[deviceType.device].push(deviceType);
          });
          tempDevices.forEach(function(tempDevice) {
            var deviceId = tempDevice.split(':');
            vm.devices.push({ id: deviceId[1], name: deviceId[0] });
          });
          if (vm.box.params && vm.box.params.deviceId) {
            setBoxInformation(vm.box.params.deviceId, vm.box.params.name, vm.box.params.service);
          } else {
            vm.displayAskDeviceForm = true;
          }

        });
    }

    function selectDevice(device) {
      if (typeof(device) === 'string') {
        device = JSON.parse(device);
      }
      // recovers the available services from the selected device 
      deviceService.get()
        .then(function(res) {
          var deviceSelected = res.data.filter(function(r) {
            return r.id === parseInt(device.id);
          });
          device.service = deviceSelected[0].service;
        })
        .then(function() {
          // save box parameters
          boxService.update(vm.boxId, { params: { deviceId: device.id, name: device.name, service: device.service } });
          // update box
          setBoxInformation(device.id, device.name, device.service);
        });
    }

    function getData(deviceId) {
      vm.devicetypes[deviceId].forEach(function(devicetype) {
        switch (devicetype.identifier) {
        case 'Power':
          vm.currentPowerState = devicetype.lastValue;
          vm.devicePowerId = devicetype.id;
          break;
        case 'Sound':
          vm.currentSoundState = devicetype.lastValue;
          vm.deviceSoundId = devicetype.id;
          break;
        case 'Channel':
          vm.currentChannel = devicetype.lastValue;
          vm.thisChannel = devicetype.lastValue;
          vm.deviceChannelId = devicetype.id;
          break;
        case 'Mute':
          vm.currentMuteState = devicetype.lastValue;
          vm.deviceMuteId = devicetype.id;
          break;
        }
      });
    }

    function pressKey(key) {
      return televisionService.pressKey({ device: vm.deviceId, key: key })
        .then(function() {

        });
    }

    function getSources() {
      return televisionService.getSources({ device: vm.deviceId })
        .then(function(data) {
          if (data.status === 200) {
            if (data.data !== undefined || data.data != 0) {
              vm.allSources = data.data;
            }
          } else {
            vm.availableMethods.getSources = false;
          }
        })
        .catch(function(data) {
          vm.availableMethods.getSources = false;
        });
    }

    function openSource(source) {
      return televisionService.openSource({ device: vm.deviceId, id: source })
        .then(function(data) {
          vm.currentSource = source;
        });
    }

    function openMenu() {
      return televisionService.openMenu({ device: vm.deviceId })
        .then(function(data) {

        });
    }

    function rec() {
      return televisionService.rec({ device: vm.deviceId })
        .then(function(data) {

        });
    }

    function play() {
      return televisionService.play({ device: vm.deviceId, controlType: 'play' })
        .then(function() {

        });
    }

    function pause() {
      return televisionService.pause({ device: vm.deviceId, controlType: 'pause' })
        .then(function() {

        });
    }

    function stop() {
      return televisionService.stop({ device: vm.deviceId, controlType: 'stop' })
        .then(function() {

        });
    }

    function rewind() {
      return televisionService.rewind({ device: vm.deviceId, controlType: 'rewind' })
        .then(function() {

        });
    }

    function fastForward() {
      return televisionService.fastForward({ device: vm.deviceId, controlType: 'fastForward' })
        .then(function() {

        });
    }

    function switchState() {
      return televisionService.switchState({ device: vm.deviceId, state: !vm.currentPowerState, deviceTypeId: vm.devicePowerId })
        .then(function() {

        });
    }

    function getState() {
      return televisionService.getState({ device: vm.deviceId })
        .then(function() {

        });
    }

    function programPlus() {
      return televisionService.programPlus({ device: vm.deviceId, controlType: 'programPlus' })
        .then(function() {

        });
    }

    function programMinus() {
      return televisionService.programMinus({ device: vm.deviceId, controlType: 'programMinus' })
        .then(function() {

        });
    }

    function setChannel(channel) {
      return televisionService.setChannel({ device: vm.deviceId, channel: channel, deviceTypeId: vm.deviceChannelId })
        .then(function(data) {
          if (data.status === 200) {
            vm.currentChannel = channel;
          }
        });
    }

    function volumeDown() {
      return televisionService.volumeDown({ device: vm.deviceId, deviceTypeId: vm.deviceSoundId })
        .then(function(data) {
          if (data.status === 200) {
            vm.currentSoundState = parseInt(vm.currentSoundState) - parseInt(1);
          }
        });
    }

    function volumeUp() {
      return televisionService.volumeUp({ device: vm.deviceId, deviceTypeId: vm.deviceSoundId })
        .then(function(data) {
          if (data.status === 200) {
            vm.currentSoundState = parseInt(vm.currentSoundState) + parseInt(1);
          }
        });
    }

    function setMuted() {
      return televisionService.setMuted({ device: vm.deviceId, state: !vm.currentMuteState, deviceTypeId: vm.deviceMuteId })
        .then(function(data) {
          if (data.status === 200) {
            vm.currentMuteState = !vm.currentMuteState;
          }
        });
    }

    function customCommand(color) {
      return televisionService.customCommand({ device: vm.deviceId, color: color })
        .then(function() {

        });
    }

    function openInfo() {
      return televisionService.openInfo({ device: vm.deviceId, controlType: 'openInfo' })
        .then(function() {

        });
    }

    function programVod() {
      return televisionService.programVod({ device: vm.deviceId, controlType: 'programVod' })
        .then(function() {

        });
    }

    // waiting for websocket message
    function waitForNewValue() {
      io.socket.on('newDeviceState', function(deviceState) {
        if (deviceState.devicetype === vm.devicePowerId) {
          vm.currentPowerState = deviceState.value;
          $scope.$apply();
        }
      });
    }
  }
})();