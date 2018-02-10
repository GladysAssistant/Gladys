/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
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