  
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