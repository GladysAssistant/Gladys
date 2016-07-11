(function () {
'use strict';

angular
.module('gladys')
.filter('errorToString', errorToString);

  function errorToString(){
    return function(error){
      if(!error)return;
  
      var errorString = '';
  
      if(error.error == 'E_VALIDATION'){
        var errorString = error.summary || '';
        if(error.invalidAttributes){
          var invalidAttributes = [];
          angular.forEach(error.invalidAttributes, function(value, key){
            this.push(key);
          }, invalidAttributes);
          errorString += ' ('+ invalidAttributes.join(', ') +')';
        }
      }
  
      return errorString;
    };
  }
})();
