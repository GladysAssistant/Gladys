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
      .controller('ChartBoxCtrl', ChartBoxCtrl);
  
    ChartBoxCtrl.$inject = ['deviceService', 'boxService', '$scope'];
  
    function ChartBoxCtrl(deviceService, boxService, $scope) {
      /* jshint validthis: true */
      var vm = this;
      
      vm.init = init;

      vm.getStatesDevice = getStatesDevice;
      vm.previousStates = previousStates;
      vm.nextStates = nextStates;
      vm.saveCurrentDeviceType = saveCurrentDeviceType;
    
      vm.options;

      vm.box = null;
      vm.deviceTypes =[];
      vm.chart = {}
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
                    vm.currentDeviceType.unit = vm.box.params.unit;
                    getStatesDevice(vm.currentDeviceType);
                    activate();
                }
            });
        getDeviceTypes();
      }
  
      function activate() {
  
        vm.options = {
            scales: {
                xAxes: [{
                    display: true,
                    ticks: {
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0
                    }
                }]
            },
            legend: {
                display: true,
                onClick: null
            }
        }
        waitForNewValue();
        return ;
      }
      
      $scope.$watch('vm.currentDeviceType', function(){
         saveCurrentDeviceType()
         refreshChart();
      });
      
      function previousStates(){
          vm.currentDeviceType.skip += 5;
          refreshChart();   
      }
      
       function nextStates(){
          vm.currentDeviceType.skip -= 5;
          if(vm.currentDeviceType.skip < 0){
              vm.currentDeviceType.skip = 0;
          }
          refreshChart();   
      }
      
      function refreshChart(){
          if(vm.currentDeviceType && vm.currentDeviceType.id){
              getStatesDevice(vm.currentDeviceType);   
          }  
      }

      function saveCurrentDeviceType(){
        if(vm.currentDeviceType && vm.currentDeviceType.id){
            boxService.update(vm.boxId, {params: {device: vm.currentDeviceType.id, name: vm.currentDeviceType.name, unit: vm.currentDeviceType.unit}})
        }  
      }
      
      function getDeviceTypes(){
          return deviceService.getTypes()
            .then(function(data){
               vm.deviceTypes = data.data;
            });
      }
      
      function getStatesDevice(deviceType){
          if(!deviceType.take){
              deviceType.take = 5;
          }
          if(!deviceType.skip){
              deviceType.skip = 0;
          }        
          return deviceService.getStates(deviceType.id, deviceType.skip, deviceType.take)
            .then(function(data){
                  if(data.data.length > 0 || vm.currentDeviceType.id != deviceType.id){
                      var chartData = formatDataChartjs(data.data);
                      vm.chart.data = [chartData.data];
                      vm.chart.labels = chartData.labels; 
                      vm.chart.series = [deviceType.name];
                      if(deviceType.unit) vm.chart.series[0] += ' ' + deviceType.unit;
                  }else{
                      vm.currentDeviceType.skip -= 5;
                      if(vm.currentDeviceType.skip < 0){
                          vm.currentDeviceType.skip = 0;
                      }
                  }
                  vm.currentDeviceType = deviceType
            });
      }
      
      // waiting for websocket message
      function waitForNewValue(){
          
          io.socket.on('newDeviceState', function (deviceState) {
              
              // if the device is the current device, push the value in the graph
              if(vm.currentDeviceType && deviceState.devicetype == vm.currentDeviceType.id){
                  $scope.$apply(function(){
                      vm.chart.labels.push(deviceState.datetime);
                      vm.chart.data[0].push(deviceState.value);  
                  });
              }
          });
      }
      
      function formatDataChartjs(rows){
          var labels = [];
          var data = [];
          rows.forEach(function(row){
             labels.unshift(row.dateFormat);
             data.unshift(row.value);
          });
          return {labels: labels, data:data};
      }
      
    }
  })();
