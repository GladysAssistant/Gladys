module.exports = checkAutoWakeUp;

function checkAutoWakeUp(alarm) {

    var firstEvent = null;
    var userPosition = null;
    var now = new Date();
    var travelTime = null;

    // first, we get the first event of the user
    return gladys.calendar.getFirstEventTodayUser(alarm.user)
        .then((result) => {

            firstEvent = result;

            // if we are in the middle of the day, no need anymore to wake up the user
            if(firstEvent.start < now) {
                sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}" (${firstEvent.start}) has already started.`);
                return Promise.reject(new Error('EVENT_ALREADY_STARTED'));
            }

            // then, we get the last known location of the user
            return gladys.location.getUser({id: alarm.user});
        })
        .then((result) => {
            userPosition = result;

            sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user} last known position is (${userPosition.latitude},${userPosition.longitude}).`);

            // if the event is not located, the duration to get there is 0
            if(!firstEvent.location) {
                sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}" has no location defined. Travel time is 0.`);
                return {duration: 0};
            }

            var options = {
                origin: `${userPosition.latitude},${userPosition.longitude}`,
                destination: firstEvent.location
            };

            sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}" location = ${firstEvent.location}. Calculating travel time.`);

            // we calculate the travel time to the event
            return gladys.direction.travelTime(options);
        })
        .then((travel) => {
            sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}". (${firstEvent.start}). Travel time = ${travel.duration} seconds.`);

            travelTime = travel.duration;

            // get user preferences
            return gladys.user.getById({id: alarm.user});
        })
        .then((user) => {

            sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}". (${firstEvent.start}). User Preferences, preparation time needed = ${user.preparationTimeAfterWakeUp} seconds.`);

            var neededTime = travelTime + user.preparationTimeAfterWakeUp;
            
            // get timestamp in seconds
            var startTimestamp = new Date(firstEvent.start).getTime()/1000;

            var wakeUpMomentEstimated = startTimestamp - neededTime;
            var wakeUpMomentEstimatedDate = new Date(wakeUpMomentEstimated*1000);

            sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}". Needed time = ${neededTime}. Wake Up moment estimated = ${wakeUpMomentEstimatedDate}.`);
            
            var nowPlus10Minutes = now.getTime()/1000 + 10*60;
            if(wakeUpMomentEstimated < nowPlus10Minutes) {
                sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}". Wake up needed !`);
                return ringAlarm(alarm);
            } else {
                sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}". Wake up not needed !`);
                
                var retryIn = null;

                // three case: 
                // - we are very far from the event => we check in two hours
                // - we are far from the event => so we check in one hour
                // - we are close from the event => so we check in 10 minutes
                var difference = wakeUpMomentEstimated - nowPlus10Minutes;
                if(difference > 3600*2){
                    retryIn = 3600*2;
                } else if(difference > 3600){
                    retryIn = 3600;
                } else {
                    retryIn = 600;
                }
                
                sails.log.debug(`Alarm.checkAutoWakeUp: User n°${alarm.user}, event "${firstEvent.name}". Scheduling another check in ${retryIn} seconds.`);

                setTimeout(function(){
                    gladys.alarm.checkAutoWakeUp(alarm);
                }, retryIn*1000);
            }
        });

}

function ringAlarm(alarm){
    var event = {
        code: 'alarm',
        value: alarm.id,
        scope: {
            alarm: alarm.id
        }
    };
    return gladys.event.create(event);
}