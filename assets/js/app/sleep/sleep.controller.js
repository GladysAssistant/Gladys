
(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('sleepCtrl', sleepCtrl);

  sleepCtrl.$inject = ['sleepService'];

  function sleepCtrl(sleepService) {
    /* jshint validthis: true */
    var vm = this;
    vm.recommended = null;
    vm.lastSleep = null;
    vm.getSleep = getSleep;
    vm.userSleep = [];


    activate();

    function activate() {
      getSleep();
      return ;
    }

    function getSleep() {
      return sleepService.getSleep()
        .then(function(data){
          vm.recommended = data.data.recommended;
          if(data.data.userSleep.length === 0){
            return;
          }
          vm.lastSleep = data.data.userSleep[data.data.userSleep.length-1].duration;
          
          vm.userSleep = data.data.userSleep;
          var line = new Morris.Line({
                element: 'line-chart',
                resize: true,
                data: data.data.userSleep,
                xkey: 'start',
                ykeys: ['duration'],
                labels: ['Sleep time'],
                lineColors: ['#efefef'],
                lineWidth: 2,
                hideHover: 'auto',
                gridTextColor: "#fff",
                gridStrokeWidth: 0.4,
                pointSize: 4,
                pointStrokeColors: ["#efefef"],
                gridLineColor: "#efefef",
                gridTextFamily: "Open Sans",
                gridTextSize: 10
            });
        });
    }
  }
})();