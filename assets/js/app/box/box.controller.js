  
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('BoxCtrl', BoxCtrl);

    BoxCtrl.$inject = ['boxService', 'boxTypeService'];

    function BoxCtrl(boxService, boxTypeService) {
        /* jshint validthis: true */
        var vm = this;
        vm.create = create;
        vm.destroy = destroy;
        vm.newBox = {};
        vm.boxs = [];
        vm.boxTypes = [];

        activate();

        function activate() {
            get();
            getTypes();
        }
        
        function get(){
            return boxService.get()
              .then(function(data){
                 vm.boxs = data.data; 
              });
        }
        
        function getTypes(){
            return boxTypeService.get()
              .then(function(data){
                  vm.boxTypes = data.data;
              });
        }
        
        function create(box){
            return boxService.create(box)
              .then(function(){
                  get();
              });
        }
        
        function destroy(index, id){
            return boxService.destroy(id)
              .then(function(){
                  vm.boxs.splice(index, 1);
              });
        }
        
       
    }
})();