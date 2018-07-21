  
(function() {
  'use strict';

  angular
    .module('gladys')
    .run(runBlock);

  runBlock.$inject = ['languageService', 'socketService', 'recognitionService'];

  function runBlock(languageService,socketService, recognitionService) {
    languageService.initialize();
    socketService.subscribe();
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })
    //recognitionService.start();
  }
  
})();