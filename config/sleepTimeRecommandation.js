
// config/sleepTimeRecommandation.js

/* Sleep Time recommandation 
StartAge and EndAge in YEARS
minSleepTime and maxSleepTime in HOURS

based on : http://sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need
*/

var newborns = { startAge : 0, endAge : 0.25, minSleepTime : 12 , maxSleepTime: 18};
var infants = { startAge : 0.25, endAge : 1, minSleepTime : 14 , maxSleepTime: 15};
var toddlers = { startAge : 1, endAge : 3, minSleepTime : 12 , maxSleepTime: 14};
var preschoolers = { startAge : 3, endAge : 5, minSleepTime : 11 , maxSleepTime: 13};
var schoolagechildren = { startAge : 5, endAge : 11, minSleepTime : 10 , maxSleepTime: 11};
var teens = { startAge : 11, endAge : 18, minSleepTime : 8.5 , maxSleepTime: 9.5};
// adults, endAge = 200 because we suppose nobody has an age > 200 
var adults = { startAge : 18, endAge : 200, minSleepTime : 7 , maxSleepTime: 9};

var recommandation = [newborns, infants, toddlers, preschoolers, schoolagechildren, teens, adults];


module.exports.sleepTimeRecommandation = {

	recommandation : recommandation
};