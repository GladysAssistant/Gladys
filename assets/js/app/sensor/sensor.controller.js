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
        .controller('SensorCtrl', SensorCtrl);

    SensorCtrl.$inject = ['$scope','sensorService', 'houseService'];

    function SensorCtrl($scope, sensorService, houseService) {
        /* jshint validthis: true */
        var vm = this;

        vm.countDown = countDown;
        vm.displayForm = false;
        vm.getRooms = getRooms;
        vm.getSensors = getSensors;
        vm.newSensor = { code : '' };
        vm.rooms = [];
        vm.sensors = [];
        vm.switchDiscoveryMode = switchDiscoveryMode;
        vm.timeLeft = null;
        vm.timerActive = false;
        vm.waitForSignal = waitForSignal;

        activate();

        function activate() {
            return getSensors();
        }

        function countDown() {
            if(vm.timerActive && vm.timeLeft > 0){
               $scope.$apply(function () {
                  vm.timeLeft--;
                });
                setTimeout(countDown, 1000); 
            }else if(vm.timeLeft == 0){
                $scope.$apply(function () {
                  vm.timeLeft = null;
                });
            }
        }

        function createSensor() {
            return sensorService.createSensor(vm.newSensor)
                .then(function(data){
                    if(!data.data.error){
                        resetForm();
                        getSensors();
                    }
                });
        }

        function deleteSensor(index, id) {
            return sensorService.deleteSensor(id)
                .then(function(data){
                    vm.sensors.splice(index, 1);  
                });
        }

        function getRooms() {
            return houseService.getRooms()
                .then(function(data){
                    vm.rooms = data.data;
                });
        }

        function getSensors() {
            return sensorService.getSensors()
                .then(function(data){
                    vm.sensors = data.data;
                });
        }

        function resetForm() {
            vm.newSensor.name = "";
            vm.newSensor.code = "";
            vm.displayForm = false;
            $('#modalNewSensor').modal('hide');
        }

        function switchDiscoveryMode() {
            return sensorService.switchDiscoveryMode()
                .then(function(data){
                    // set the wait time given by the server
                    vm.timeLeft = data.waitTime;
                    // active the timer
                    vm.timerActive = true;
                    // start waiting for signal
                    waitForSignal();
                    // start the coutdown
                    countDown();
                });
        }

        function waitForSignal() {
            return sensorService.waitForSignal()
                .then(function(data){
                    // fill the form with the sensor code
                    vm.newSensor.code = data.code;
                    // display the form
                    vm.displayForm = true;

                });
        }

    }
})();