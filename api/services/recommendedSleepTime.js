/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

module.exports = {

	/**
	 * Get the recommended sleep time for a given age
	 * @method get
	 * @param {} age
	 * @return ObjectExpression
	 */
	get: function(age) {

		var i = 0;
		var found = false;
		// searching the right category of the user depending of his age (ex : teens, adults)
		while (i < sails.config.sleepTimeRecommandation.recommandation.length && !found) {
			// if its age is between start and end age of a category, we found it!
			if (sails.config.sleepTimeRecommandation.recommandation[i].startAge <= age && sails.config.sleepTimeRecommandation.recommandation.endAge > age)
				found = true;
			i++;
		}
		// return his recommended max sleep time, and min sleep time
		return {
			minSleepTime: sails.config.sleepTimeRecommandation.recommandation[i - 1].minSleepTime,
			maxSleepTime: sails.config.sleepTimeRecommandation.recommandation[i - 1].maxSleepTime
		};
	}

};