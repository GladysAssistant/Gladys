
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('cacheService', cacheService);

    cacheService.$inject = [];

    function cacheService() {
        
        var service = {
            get: get,
            set: set,
            clear: clear
        };

        return service;

        /**
         * Get value from localStorage
         */
        function get(key) {
            try{
                var value = null;
                if(localStorage){
                    
                    // get the item from the localstorage
                    var record = localStorage.getItem(key);
                    record = JSON.parse(record);
                    
                    // if the expiration date is not passed, retrieve value
                    if(record.expiration > new Date().getTime()){
                        value = record.value;
                    } else {
                        
                        // if note, delete value in storage
                        localStorage.removeItem(key);
                    }
                }
                return value;      
            } catch(e){
                console.log(e);
                return null;
            }
        }
        
        /**
         * Set value in the localStorage
         */
        function set(key, value, expiration){
            if(localStorage){
                var record = {
                    value: value, 
                    expiration: new Date().getTime() + expiration
                };
                localStorage.setItem(key, JSON.stringify(record));
            }
        }

        function clear(){
            if(localStorage) localStorage.clear();
        }
    }
})();