
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('nowCtrl', nowCtrl);

    nowCtrl.$inject = ['calendarService'];

    function nowCtrl(calendarService) {
        /* jshint validthis: true */
        var vm = this;
        vm.nextEvents = [];
        activate();

        function activate() {
            return getNextEvents();
        }

        function getNextEvents() {
            return calendarService.getNextEvents()
                .then(function(data){
                    vm.nextEvents = data.data;
                });
        }
    }
})();