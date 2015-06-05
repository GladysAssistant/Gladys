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