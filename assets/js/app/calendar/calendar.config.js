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
      .config(['calendarConfig', function(calendarConfig) {
    
        // Use either moment or angular to format dates on the calendar. Default angular. Setting this will override any date formats you have already set.
        calendarConfig.dateFormatter = 'moment';

        // Set 24 hours format
        calendarConfig.dateFormats.hour = 'HH:mm';
    }]);
    
  })();