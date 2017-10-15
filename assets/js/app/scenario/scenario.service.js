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
           generateTemplate: generateTemplate,
           exportScenario: exportScenario,
           importScenario: importScenario,
           updateScenario: updateScenario
        };

        return service;
        
        function getOptions(path){
            return $http({method: 'GET', url: path});
        }

        function exportScenario(id){
            return $http({method: 'POST', url: '/scenario/' + id + '/export'});
        }

        function importScenario(data){
            return $http({method: 'POST', url: '/scenario', data: data});
        }

        function updateScenario(id, data){
            return $http({method: 'PATCH', url: '/scenario/' + id, data: data});
        }
        
        // will generate a templateString like
        // "devicetype == 1 && value > 12"
        // this template will be injected an ES6 template
        // evaluator
        function generateTemplate(params){
            
            if(!params || !(params instanceof Array)){
                return '';
            }
            
            // we initialize the template
            var template = '';
            
            // foreach param
            params.forEach(function(param){
                
                if(template !== ''){
                    template += ' && ';
                }
                
                if(!param.value){
                    template += ' true ';
                } else {
                    
                    // if value is not a number, we transform it into a string escaped
                    if(!isNumber(param.value)){
                        param.value = '"' + escapeDoubleQuotes(param.value) + '"';
                    }
                    
                    // we add the condition
                    template += param.variablename + ' ' + param.operator + ' ' + param.value; 
                }

            });
            
            return template;
        }
        
        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
        
        function escapeDoubleQuotes(str) {
            return str.replace(/\\([\s\S])|(")/g,"\\$1$2"); // thanks @slevithan!
        }
        
    }
})();