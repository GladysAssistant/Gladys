
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('ModeCtrl', ModeCtrl);

    ModeCtrl.$inject = ['modeService'];

    function ModeCtrl(modeService) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.modes = [];
    	vm.createMode = createMode;
		vm.destroyMode = destroyMode;
        
        activate();

        function activate() {
            getModes();
            return ;
        }
        
        function getModes(){
            return modeService.get()
              .then(function(data){
                  vm.modes = data.data;
              });
        }
        
        function createMode(mode){
            return modeService.create(mode)
              .then(function(data){
                  vm.modes.push(data.data);
              });
        }
        
        function destroyMode(index, modeId){
            return modeService.destroy(modeId)
              .then(function(){
                  vm.modes.splice(index, 1);
              });
        }
    }
})();
