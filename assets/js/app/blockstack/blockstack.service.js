  
(function () {
  'use strict';

  angular
      .module('gladys')
      .factory('blockstackService', blockstackService);

  blockstackService.$inject = [];

  function blockstackService() {
      
      var service = {
        loadBlockstackIfNeeded: loadBlockstackIfNeeded,
        importData: importData,
        isBlockstackUsed: isBlockstackUsed
      };

      return service;

      function loadBlockstack (callback) {
        var script = document.createElement('script');
        script.src = '/js/dependencies/blockstack/blockstack-bundle.js';
        document.body.appendChild(script);
          
        script.onload = function () {
          callback();
        };
      };
      
      function loadBlockstackIfNeeded() {
        if (window.localStorage.getItem('blockstack-session')) {
          loadBlockstack(function() {
            sync();
          });
        }
      }
      
      function isBlockstackUsed () {
        if (window.localStorage.getItem('blockstack-session')) {
          return true;
        } else {
          return false;
        }
      }

      function sync () {
        var savedParams;
        var localParams;
        fetch(window.location.origin + '/param')
          .then(function (response) {
            return response.json();
          })
          .then(function(params){
            localParams = params;
            return window.blockstack.getFile('params.json');
          })
          .then(function(data) {
            savedParams = JSON.parse(data);
            mergeArray(localParams, savedParams);
            console.log(savedParams);
            return window.blockstack.putFile('params.json', JSON.stringify(savedParams));
          });
      }

      function importData () {
        return window.blockstack.getFile('params.json')
          .then((function(paramsJson) {
            var blockStackParams = JSON.parse(paramsJson);
            var promises = [];
            blockStackParams.forEach(function (blockStackParam) {
              promises.push(fetch(window.location.origin + '/param', {
                method: 'post',
                body: JSON.stringify({
                  name: blockStackParam.name,
                  value: blockStackParam.value
                })
              }));
            });
            return Promise.all(promises);
          }));
      }

      function mergeArray (localParams, savedParams) {
        localParams.forEach(function(itemIn1) {
          var itemIn2 = savedParams.find(function(i){
            return i.name === itemIn1.name;
          });
          if(!itemIn2) {
            savedParams.push(itemIn1);
          }
        });
      }
  }
})();