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
        .factory('alarmService', alarmService);

    alarmService.$inject = ['$http'];

    function alarmService($http) {
        var service = {
            createAlarm: createAlarm,
            destroyAlarm: destroyAlarm,
            getAlarms: getAlarms, 
        };

        return service;

        function createAlarm(Alarm) {
            return $http({method: 'POST', url: '/Alarm/create', data: Alarm }).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

        function getAlarms() {
            return $http({method: 'POST', url: '/Alarm/index' }).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

        function destroyAlarm(id) {
            return $http({method: 'POST', url: '/Alarm/destroy', data: {id: id} }).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }
    }
})();
/*
var language = 'fr';

document.addEventListener("DOMContentLoaded", function(event) {
  $('#datetimepicker2').datetimepicker({
    locale: language
  });
  $('#datetimepicker3').datetimepicker({
    format: 'LT',
    locale: language
  });
});

mainApp.controller('alarmCtrl', function($scope, $http) {

  // Get the Alarms

  $scope.newAlarm = {};
  $scope.newAlarmReccuring = {};

  $http.get('/Alarm/index').success(function(data) {
    for (var i = 0; i < data.length; i++) {

      if (data[i].recurring == -1) {
        data[i].moment = moment(data[i].datetime).format('LLL');
      } else {

        data[i].moment = moment().day(data[i].recurring).fromNow();
      }
    }
    $scope.alarms = data;
  });

  $scope.destroyAlarm = function(index, id) {

    $http.post('/Alarm/destroy', {
      id: id
    }).success(function(data) {
      $scope.alarms.splice(index, 1);
    });
  };

  $scope.defineSleepIn = function() {
    $http.post('/Room/defineSleepIn', $scope.newSleepIn).success(function(data) {

      refreshSleepIn();
    });
  };

  $scope.addRelation = function() {
    $http.post('/House/addrelation', $scope.newRelation).success(function(data) {

      //$scope.rooms.push(data);
      refreshRelation();
    });
  };

  var frenchDateToDate = function(frenchDate) {
    var day = frenchDate.substring(0, 2);
    var month = frenchDate.substring(3, 5);
    var year = frenchDate.substring(6, 10);
    var hour = frenchDate.substring(11, 16);
    return year + '-' + month + '-' + day + 'T' + hour + ':00';
  };

  $scope.createAlarm = function() {
    // Dirty check... Because of datetimepicker boostrap who manually set datetime without applying it
    var element = document.getElementById('NewAlarmDatetime');
    $scope.newAlarm.datetime = element.value;

    var datetime;
    switch (language) {
      case 'fr':
        datetime = frenchDateToDate($scope.newAlarm.datetime);
        break;

      case 'en':

        break;
    }

    var Alarmobj = {
      datetime: moment(datetime).format(),
      time: null,
      name: $scope.newAlarm.name,
      recurring: -1
    };
    console.log(Alarmobj);
    $http.post('/Alarm/create', Alarmobj).success(function(data) {
    });
  };

  $scope.createAlarmRecurring = function() {
    // Dirty check... Because of datetimepicker boostrap who manually set datetime without applying it
    var element = document.getElementById('NewAlarmTime');
    $scope.newAlarmReccuring.time = element.value;

    var Alarmobj = {
      datetime: null,
      time: $scope.newAlarmReccuring.time,
      name: $scope.newAlarmReccuring.name,
      recurring: $scope.newAlarmReccuring.recurring
    };
    console.log(Alarmobj);
    $http.post('/Alarm/create', Alarmobj).success(function(data) {



    });
  };

});*/