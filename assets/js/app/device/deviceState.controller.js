
(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('DeviceStateCtrl', DeviceStateCtrl);

  DeviceStateCtrl.$inject = ['deviceService', 'userService', '$scope', '$translate', 'notificationService'];

  function DeviceStateCtrl(deviceService, userService, $scope, $translate, notificationService) {
    /* jshint validthis: true */
    var vm = this;

    vm.previousStates = previousStates;
    vm.nextStates = nextStates;
    vm.refreshData = refreshData;
    vm.getMinMax = getMinMax;
    vm.chart;
    vm.threshold = 90;
    vm.ready = false;
    vm.displayMinMax = false;
    vm.steppedline = false;

    var minY = null;
    var maxY = null;
    var gapGrap = 0.02;

    var dataDt = [];
    var dataMin = [];
    var dataMax = [];

    var labelDt = '';
    var globalTime = 1;
    var globalTimeRange = 'days';

    var filter = {
      start: moment().subtract(globalTime, globalTimeRange).format('YYYY-MM-DD HH:mm:ss'),
      end: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    // Configuring the dateRangePicker
    var config = {
      ranges: {
        'Last day': [moment().subtract(1, 'days'), moment()],
        'Yesterday': [moment().subtract(1, 'days').startOf('days'), moment().subtract(1, 'days').endOf('days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      },
      timePicker: true,
      timePicker24Hour: true,
      startDate: moment(filter.start),
      endDate: moment(filter.end),
      opens: 'right',
      drops: 'down',
      buttonClasses: 'btn btn-sm btn-flat',
      alwaysShowCalendars: false,
      locale: {
        applyLabel: '',
        cancelLabel: '',
        customRangeLabel: '',
        format: 'l[, ]LT'
      }
    };

    activate();

    function activate() {
      getDeviceTypes();
      waitForNewValue();
      activateCharts();

      /**
       * Get user language
       * Set the local time
       * and translate buttons text for date range picker
       */
      getLanguageCurrentUser()
        .then(function (language) {
          moment.locale(language);
          localDateRangePickers()
            .then(function () {
              activateDateRangePicker();
            });
        });
    }



    function activateCharts() {         // Activating the graph

      if (vm.chart != null) {         // Destroys the graph if there is already one
        vm.chart.destroy();
      }

      if (!vm.displayMinMax) {         // Enables/disables min/max curves
        dataMin = [];
        dataMax = [];
      }

      vm.chart = new Chart('deviceChart', {
        type: 'line',
        data: {
          datasets: [{
            data: dataMin,         // Configuration of the min curve
            label: (vm.displayMinMax ? 'min' : ''),
            borderColor: (vm.displayMinMax ? 'rgba(14,135,73,1)' : 'rgba(14,135,73,0)'),
            backgroundColor: 'rgba(255,255,255,0)',
            borderWidth: 1,
            pointRadius: 2,
            cubicInterpolationMode: 'monotone',
            fill: false
          }, {
            data: dataDt,         // Configuration of the main curve
            label: labelDt,
            borderColor: 'rgba(98,166,205,1)',
            backgroundColor: 'rgba(98,166,205,0.1)',
            borderWidth: 1,
            pointRadius: (dataDt.length > 100 ? 0 : 2),
            cubicInterpolationMode: 'monotone',
            fill: 'start',
            steppedLine: (vm.steppedline ? 'after' : false)
          },
          {
            data: dataMax,         // Configuration of the min curve
            label: (vm.displayMinMax ? 'max' : ''),
            borderColor: (vm.displayMinMax ? 'rgba(221,75,57,1)' : 'rgba(221,75,57,0)'),
            backgroundColor: 'rgba(255,255,255,0)',
            borderWidth: 1,
            pointRadius: 2,
            cubicInterpolationMode: 'monotone',
            fill: false
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
                  hour: 'l[, ]LT',
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
            intersect: (vm.displayMinMax ? true : false),
            mode: (vm.displayMinMax ? 'nearest' : 'index'),
            callbacks: {
              title: function (tooltipItem, data) {
                if (tooltipItem[0].datasetIndex === 1) {
                  return moment(tooltipItem[0].xLabel).format('ll[, ]LTS');
                } else {
                  return moment(tooltipItem[0].xLabel).format('ll');
                }
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Activating the dateRangePicker and action on value change
    function activateDateRangePicker() {
      $('#daterangepickerFilter').addClass('disabled-picker');
      $('#daterangepicker').daterangepicker(config,
        function (start, end) {
          if (vm.currentDeviceType) {
            globalTime = moment(end).diff(moment(start), 'days'); // Recording the time period for navigation buttons
            filter.start = moment(start).format('YYYY-MM-DD HH:mm:ss');
            filter.end = moment(end).format('YYYY-MM-DD HH:mm:ss');
            getFilteredDeviceState(vm.currentDeviceType, filter.start, filter.end);
          }
        }
      );
    }

    // Enabling the dateRangePicker when changing the DT and refreshing the graph data
    $scope.$watch('vm.currentDeviceType', function () {
      $('#daterangepickerFilter').removeClass('disabled-picker');
      refreshData();
    });

    // Navigation button, period to period
    function previousStates() {
      filter.end = filter.start;
      filter.start = moment(filter.start).subtract(globalTime, globalTimeRange).format('YYYY-MM-DD HH:mm:ss');
      $('#daterangepicker').data('daterangepicker').setStartDate(moment(filter.start).format('l[, ]LTS'));
      $('#daterangepicker').data('daterangepicker').setEndDate(moment(filter.end).format('l[, ]LTS'));
      refreshData();
    }

    // Navigation button, period to period
    function nextStates() {
      filter.start = filter.end;
      filter.end = moment(filter.end).add(globalTime, globalTimeRange).format('YYYY-MM-DD HH:mm:ss');
      $('#daterangepicker').data('daterangepicker').setStartDate(moment(filter.start).format('l[, ]LTS'));
      $('#daterangepicker').data('daterangepicker').setEndDate(moment(filter.end).format('l[, ]LTS'));
      refreshData();
    }

    // Updates the graph data
    function refreshData() {
      vm.ready = true;
      if (vm.currentDeviceType && vm.currentDeviceType.id) {
        getFilteredDeviceState(vm.currentDeviceType, filter.start, filter.end);
      }
    }

    // Updates the list of DTs in the drop-down menu
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
          vm.chart.update();
        }
      });
    }

    // Retrieves data from the selected DT on the selected dates
    function getFilteredDeviceState(deviceType, startDate, endDate) {

      return deviceService.getFilteredStates(deviceType.id, startDate, endDate, 100 - vm.threshold)
        .then(function (data) {
          if (data.data.length !== 0) {
            formatData(deviceType, data);
          } else {
            notificationService.errorNotificationTranslated('CHART.NO_VALUES');
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
      if (vm.displayMinMax) {
        getMinMax();
      } else {
        console.log('je suis passé par là!');
        activateCharts();
      }
    }

    // Enables the display of the min and max curves
    function getMinMax() {
      if (vm.currentDeviceType && vm.currentDeviceType.id) {
        var dateStart = moment(filter.start).format('YYYY-MM-DD HH:mm:ss');
        var dateEnd = moment(filter.end).format('YYYY-MM-DD HH:mm:ss');
        return getFilteredDeviceStateMinMax(vm.currentDeviceType, dateStart, dateEnd);
      }
    }

    // Construct min and max curves
    function getFilteredDeviceStateMinMax(deviceType, startDate, endDate) {

      return deviceService.getFilteredStatesMinMax(deviceType.id, startDate, endDate)
        .then(function (data) {
          if (data.data.length !== 0) {
            formatDataMinMax(deviceType, data);
          } else {
            notificationService.errorNotificationTranslated('CHART.NO_VALUES');
          }
        });
    }

    function formatDataMinMax(deviceType, data) {
      if (data.data.length > 0 || vm.currentDeviceType.id !== deviceType.id) {
        var minXY = data.data.map(dataMinXY);
        var maxXY = data.data.map(dataMaxXY);
        dataMin = minXY.map(jsonXY);
        dataMax = maxXY.map(jsonXY);
        activateCharts();
      }
    }

    function dataMinXY(item) {
      var minX = moment(item.datetime).format('YYYY-MM-DD 03:00:00');
      minX = (moment(item.datetime).isAfter(moment(filter.start))) ? minX : moment(filter.start);
      minX = (moment(minX).endOf('day').isBefore(moment(filter.end))) ? minX : moment(filter.end);
      return [minX, item.min];
    }

    function dataMaxXY(item) {
      var maxX = moment(item.datetime).format('YYYY-MM-DD 15:00:00');
      maxX = (moment(item.datetime).isAfter(moment(filter.start))) ? maxX : moment(filter.start);
      maxX = (moment(maxX).endOf('day').isBefore(moment(filter.end))) ? maxX : moment(filter.end);
      return [maxX, item.max];
    }

    function jsonXY(item) {
      return { 'x': item[0], 'y': item[1] };
    }

    function getLanguageCurrentUser() {
      return userService.whoAmI()
        .then(function (user) {
          vm.language = user.language.substring(0, 2).toLowerCase();
          return vm.language;
        });
    }

    // Translates the dateRangePicker into the user's language
    function localDateRangePickers() {
      return new Promise(function (resolve, reject) {
        $translate('APPLY')
          .then(function (text) {
            config.locale.applyLabel = text;
          });
        $translate('CANCEL')
          .then(function (text) {
            config.locale.cancelLabel = text;
          });
        $translate('CHART.CUSTOM_RANGE_LABEL')
          .then(function (text) {
            config.locale.customRangeLabel = text;
          });

        // Translates the dateRangePicker's range into the user's language
        Object.getOwnPropertyNames(config.ranges).forEach(function (labelRange) {
          var label = labelRange.replace(RegExp(' ', 'g'), '_');
          label = label.toUpperCase();
          $translate('CHART.' + label.toUpperCase())
            .then(function (text) {
              config.ranges[text] = config.ranges[labelRange];
              delete config.ranges[labelRange];
            });
        });
        resolve();
      });
    }
  }
})();
