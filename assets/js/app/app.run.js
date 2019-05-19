  
(function() {
  'use strict';

  angular
    .module('gladys')
    .run(runBlock);

  runBlock.$inject = ['languageService', 'socketService', 'recognitionService', 'blockstackService'];

  function runBlock(languageService,socketService, recognitionService, blockstackService) {
    languageService.initialize();
    socketService.subscribe();
    blockstackService.loadBlockstackIfNeeded();
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })
    //recognitionService.start();
  }
  
})();