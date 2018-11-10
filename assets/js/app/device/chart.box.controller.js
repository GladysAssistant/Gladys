
(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('ChartBoxCtrl', ChartBoxCtrl);

  ChartBoxCtrl.$inject = ['deviceService', 'boxService', '$scope', 'notificationService'];

  function ChartBoxCtrl(deviceService, boxService, $scope, notificationService) {
    /* jshint validthis: true */
    var vm = this;

    vm.init = init;

    vm.previousStates = previousStates;
    vm.nextStates = nextStates;
    vm.saveCurrentDeviceType = saveCurrentDeviceType;

    vm.box = null;
    vm.deviceTypes = [];
    vm.chart;
    var minY = null;
    var maxY = null;
    var gapGrap = 0.02;

    var dataDt = [];
    vm.threshold = 90;

    var labelDt = "";
    var globalTime = 1;
    var globalTimeRange = "days";

    var filter = {
      start: moment().subtract(globalTime, globalTimeRange).format('YYYY-MM-DD HH:mm:ss'),
      end: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    vm.currentDeviceType = null;

    function init(id) {
      vm.boxId = id;
      boxService.getById(id)
        .then(function (data) {
          vm.box = data.data;
          if (vm.box.params && vm.box.params.device) {
            vm.currentDeviceType = {};
            vm.currentDeviceType.id = vm.box.params.device;
            vm.currentDeviceType.name = vm.box.params.name;
            vm.currentDeviceType.unit = vm.box.params.unit;
            vm.currentDeviceType.roomName = vm.box.params.roomName;
            getFilteredDeviceState(vm.currentDeviceType,filter.start,filter.end);
            activate();
          } else {
            $(document.getElementById('chartMenu')).dropdown("toggle");
          }
        });
      getDeviceTypes();
    }

    function activate() {
      activateCharts();
      waitForNewValue();
    }

    function activateCharts() {         // Activating the graph
      if (vm.chart != null) {         // Destroys the graph if there is already one
        vm.chart.destroy();
      }

      vm.chart = new Chart('deviceChart', {
        type: 'line',
        data: {
          datasets: [{
            data: dataDt,         // Configuration of the main curve
            label: labelDt,
            borderColor: 'rgba(98,166,205,1)',
            backgroundColor: 'rgba(98,166,205,0.1)',
            borderWidth: 1,
            pointRadius: (dataDt.length > 25 ? 0 : 2),
            cubicInterpolationMode: 'default',
            fill: 'start',
            steppedLine: (vm.currentDeviceType.type === 'binary' ? true : false)
          }],
        },
        options: {         // Configuring the axes of the graph
          scales: {
            xAxes: [{
              display: true,
              type: 'time',
              time: {
                displayFormats: {
                  second: 'LT',
                  minute: 'LT',
                  hour: 'LT',
                  day: 'l',
                  week: 'l',
                  month: 'l'
                }
              },
              distribution: 'linear',
              ticks: {
                autoSkip: true,
                maxRotation: 0,
                minRotation: 0,
                source: 'auto',
                maxTicksLimit: 8
              }

            }],
            yAxes: [{
              ticks: {
                suggestedMin: minY - ((maxY - minY) * gapGrap),
                suggestedMax: maxY + ((maxY - minY) * gapGrap),
              }
            }]
          },
          legend: {
            display: true,
            onClick: null
          },
          tooltips: {
            intersect: false,
            mode: 'index',
            callbacks: {
              title: function (tooltipItem) {
                return moment(tooltipItem[0].xLabel).format('ll[, ]LTS')
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      });
    }

    $scope.$watch('vm.currentDeviceType', function () {
      saveCurrentDeviceType()
      refreshData();
    });

    function saveCurrentDeviceType() {
      if (vm.currentDeviceType && vm.currentDeviceType.id) {
        boxService.update(vm.boxId, { params: { device: vm.currentDeviceType.id, name: vm.currentDeviceType.name, unit: vm.currentDeviceType.unit, roomName: vm.currentDeviceType.roomName } })
      }
    }

    // Navigation button, period to period
    function previousStates() {
      filter.end = filter.start;
      filter.start = moment(filter.start).subtract(globalTime, globalTimeRange).format('YYYY-MM-DD HH:mm:ss');
      refreshData();
    }

    // Navigation button, period to period
    function nextStates() {
      filter.start = filter.end;
      filter.end = moment(filter.end).add(globalTime, globalTimeRange).format('YYYY-MM-DD HH:mm:ss');
      refreshData();
    }

    // Updates the graph data
    function refreshData() {
      if (vm.currentDeviceType && vm.currentDeviceType.id) {
        getFilteredDeviceState(vm.currentDeviceType, filter.start, filter.end)
      }
    }

    // Retrieves data from the selected DT on the selected dates
    function getFilteredDeviceState(deviceType, startDate, endDate) {

      return deviceService.getFilteredStates(deviceType.id, startDate, endDate, 100 - vm.threshold)
        .then(function (data) {
          if (data.data.length !== 0) {
            formatData(deviceType, data)
          } else {
            notificationService.errorNotificationTranslated('CHART.NO_VALUES')
          }
        });
    }

    // Format the data in (x,y) format
    function formatData(deviceType, data) {
      if (data.data.length > 0 || vm.currentDeviceType.id !== deviceType.id) {
        dataDt = data.data;
        
        // Logs the min and max values of the deviceState, to increase the Y axis
        minY = data.data.reduce(function (prev, current) {
          return (prev.y < current.y ? prev : current);
        }).y;
        maxY = data.data.reduce(function (prev, current) {
          return (prev.y > current.y ? prev : current);
        }).y;
        filter.start = data.data.reduce(function (prev, current) {
          return (moment(prev.x).isBefore(moment(current.x)) ? prev : current);
        }).x;
        filter.end = data.data.reduce(function (prev, current) {
          return (moment(prev.x).isAfter(moment(current.x)) ? prev : current);
        }).x;
        
        // Update the graph title
        labelDt = (deviceType.unit ? [deviceType.name + ' (' + deviceType.unit] + ')' : [deviceType.name]);
      }
      vm.currentDeviceType = deviceType;
      activateCharts();
    }

    function getDeviceTypes() {
      return deviceService.getTypes()
        .then(function (data) {
          vm.deviceTypes = data.data;
        });
    }

    // waiting for websocket message
    function waitForNewValue() {
      io.socket.on('newDeviceState', function (deviceState) {
        // if the device is the current device, push the value in the graph
        if (vm.currentDeviceType && deviceState.devicetype === vm.currentDeviceType.id) {
          dataDt.push({ x: deviceState.datetime, y: deviceState.value });
          vm.chart.update()
        }
      });
    }


  }
})();
