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
    .controller('AreaCtrl', AreaCtrl);

  AreaCtrl.$inject = ['areaService'];

  function AreaCtrl(areaService) {
    /* jshint validthis: true */
    var vm = this;
    vm.areas = [];
    vm.createArea = createArea;
    vm.deleteArea = deleteArea;
    vm.updateArea = updateArea;
    vm.saving = false;
    vm.newArea = {};

    activate();

    function activate() {
        getArea();
    }
    
   function getArea(){
       return areaService.get()
         .then(function(data){
             vm.areas = data.data;
         });
   }
   
   function createArea(area){
       return areaService.create(area)
         .then(function(data){
             vm.areas.push(data.data);
             vm.newArea = {};
         });
   }
   
   function deleteArea(index, id){
       return areaService.destroy(id)
         .then(function(){
            vm.areas.splice(index, 1); 
         });
   }
   
   function updateArea(id, area){
       vm.saving = true;
       return areaService.update(id, area)
         .then(function(area){
             vm.saving = false;
         });
   }

  }
})();