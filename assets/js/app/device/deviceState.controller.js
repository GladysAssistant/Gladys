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
    .controller('DeviceStateCtrl', DeviceStateCtrl);

  DeviceStateCtrl.$inject = ['deviceService', '$scope'];

  function DeviceStateCtrl(deviceService, $scope) {
    /* jshint validthis: true */
    var vm = this;
    
    vm.previousStates = previousStates;
    vm.nextStates = nextStates;
    vm.options;

    activate();

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

      getDeviceTypes();
      waitForNewValue();
      return ;
    }
    
    $scope.$watch('vm.currentDeviceType', function(){
       refreshChart();
    });
    
    function previousStates(){
        vm.currentDeviceType.skip += 25;
        refreshChart();   
    }
    
     function nextStates(){
        vm.currentDeviceType.skip -= 25;
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
    
    function getDeviceTypes(){
        return deviceService.getTypes()
          .then(function(data){
             vm.deviceTypes = data.data;
          });
    }
    
    function getStatesDevice(deviceType){
        if(!deviceType.skip){
            deviceType.skip = 0;
        }        
        return deviceService.getStates(deviceType.id, deviceType.skip)
          .then(function(data){
                if(data.data.length > 0 || vm.currentDeviceType.id != deviceType.id){
                    var chartData = formatDataChartjs(data.data);                
                    chartData.series = [deviceType.name + ' ' + deviceType.unit];
                    chartData.data = [chartData.data];
                    vm.chart = chartData;
                }else{
                    vm.currentDeviceType.skip -= 25;
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