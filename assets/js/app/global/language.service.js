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
        .factory('languageService', languageService);

    languageService.$inject = ['userService','amMoment', '$translate'];

    function languageService(userService,amMoment, $translate) {
        
        var service = {
            initialize:initialize
        };

        return service;

        function initialize(){
            
            // get User Language
			return userService.whoAmI()
                .then(function(user){
                    if(user.language){
                        // set the language of the moment library
                        amMoment.changeLocale(user.language.substring(0,2));
                        $translate.use(user.language.substring(0,2));
                    }
                });
		}
		
    }
})();