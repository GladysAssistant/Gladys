/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
// config/googlegeocoder.js
module.exports.googlegeocoder = {
	url : 'http://maps.googleapis.com/maps/api/geocode/json?address=',
	reverseGeocode : 'http://maps.googleapis.com/maps/api/geocode/json?latlng=',
	localisationValidityTime : 40,
	rangeMax: 10*1000,
	rangePrecision: 50,
	timeRatio : 0.33,
	accuracyRatio : 0.66
};