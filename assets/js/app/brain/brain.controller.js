  
(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('BrainCtrl', BrainCtrl);

  BrainCtrl.$inject = ['brainService'];

  function BrainCtrl(brainService) {
    /* jshint validthis: true */
    var vm = this;
    vm.classify = classify;
    vm.text = '';

    activate();

    function activate() {
      
      return ;
    }


    function classify(text){
       vm.text = '';
       return brainService.classify(text)
         .then(function(answer){
            
         });
    }

  }
})();