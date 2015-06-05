/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/**
 * EXPERIMENTAL
 */


var ical = require('ical');

/**
 * Description
 * @method downloadIcal
 * @param {} url
 * @param {} callback
 * @return 
 */
function downloadIcal (url,callback){
    ical.fromURL(url, {}, function(err, data) {
      if(err) return sails.log.warn('iCalService : downloadIcal : '+ err);

      for (var k in data){
        if (data.hasOwnProperty(k)) {
          var ev = data[k]
          if(callback){
          	callback(ev);
          }
        }
      }
    });
};

module.exports = {

	/**
	 * Description
	 * @method downloadAll
	 * @return 
	 */
	downloadAll : function(){
		ICal.find()
			.exec(function(err, ICals){
				if(ICals){
					// foreach iCal
					for(var i=0; i<ICals.length;i++){
						// download the calendar
						downloadIcal(ICals[i].url, function(event){

						});
					}
				}
			});

	}


};