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
        .factory('scenarioService', scenarioService);

    scenarioService.$inject = ['$http'];

    function scenarioService($http) {
        
        var service = {           
           getOptions: getOptions,
           generateTemplate: generateTemplate
        };

        return service;
        
        function getOptions(path){
            return $http({method: 'GET', url: path});
        }
        
        // will generate a templateString like
        // "devicetype == 1 && value > 12"
        // this template will be injected an ES6 template
        // evaluator
        function generateTemplate(params){
            var template = '';
            
            // foreach param
            params.forEach(function(param){
                if(template !== ''){
                    template += ' && ';
                }
                
                // we add the condition
                template += param.variablename + ' ' + param.operator + ' ' + param.value;
            });
            
            return template;
        }
        
    }
})();