/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
// config/googlevoice.js
module.exports.googlevoice = {
	  url: 'http://translate.google.com/translate_tts',
	  langParametre : 'tl',
	  defaultsLang : 'fr',
	  queryParametre: 'q',
	  cacheDirectory : 'voicecache',
	  charsetParametre : 'ie',
	  charsetValue : 'UTF-8'
};