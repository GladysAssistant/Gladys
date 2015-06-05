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
        .factory('languageService', languageService);

    languageService.$inject = ['userService','amMoment'];

    function languageService(userService,amMoment) {
        var service = {
            initialize:initialize
        };

        return service;

        function initialize(){
            // get User Language
			return userService.whoAmI()
                .then(function(data){
                    if(data.data.language){
                        // set the language of the moment library
                        amMoment.changeLocale(data.data.language.substring(0,2));
                    }
                });
		}
		
    }
})();