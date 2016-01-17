/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */


var google = require('googleapis');
var calendar = google.calendar('v3');
var OAuth2Client = google.auth.OAuth2;
var oauth2Client = new OAuth2Client( sails.config.googleapi.consumer_key , sails.config.googleapi.consumer_secret , sails.getBaseurl() + '/googleapi/create');

/**
 * Description
 * @method getGoogleCalendar
 * @param {} access_token
 * @param {} refresh_token
 * @param {} userId
 * @param {} callback
 * @return 
 */
function getGoogleCalendar(access_token,refresh_token,userId, callback){

	oauth2Client.setCredentials({
		access_token: access_token,
		refresh_token: refresh_token
	});

	var params = {auth: oauth2Client};

	calendar.calendarList.list(params, function calendarListFound(err, calendarList){
		if(err) return callback('getGoogleCalendar : calendarListFound : ' + JSON.stringify(err));

		for(var i = 0;i<calendarList.items.length;i++){

				var CalendarList = calendarList.items[i];
				saveOrUpdateCalendarList(CalendarList,userId, function (err, Calendar){
						if(err) sails.log.warn(err);
						
						// if calendar need to be downloaded
						if(Calendar && Calendar.active){
							
							var params2 =  { auth: oauth2Client,calendarId: Calendar.externalid };
							calendar.events.list(params2, function calendarEventsFound(err,EventList){
								if(err) return callback('getGoogleCalendar : calendarEventsFound : ' + err);

								for(var j = 0;j<EventList.items.length;j++){
									EventList.items[j].calendar = Calendar.id;
									saveorUpdateEvent(userId, EventList.items[j], function(err){
										if(err) sails.log.warn(err);
									});
								}
								callback(null);
							});

						}
				});
				
		}
	
	});

}

/**
 * Description
 * @method saveorUpdateEvent
 * @param {} userId
 * @param {} Event
 * @param {} callback
 * @return 
 */
function saveorUpdateEvent(userId, Event,callback) {

	// transform all
	if(Event.start){
        if(Event.start.dateTime){
            Event.start = Event.start.dateTime;
        }else if(Event.start.date){
            Event.start = Event.start.date;
        }
    }
    if(!Event.start){
        return callback('saveorUpdateEvent : No start date for the event.');
    }

    if(Event.end){
        if(Event.end.dateTime){
            Event.end = Event.end.dateTime;
        }else if(Event.end.date){
            Event.end = Event.end.date;
        }
    }
    if(!Event.end){
        return callback('saveorUpdateEvent : No end date for the event.');
    }

	Event.externalid = Event.id;
	delete Event.id;

	CalendarEvent.findOne({ externalid : Event.externalid})
				 .exec(function(err, calendarEvent){
				 		if(err) return callback('saveorUpdateEvent : ' + err);

				 		if(calendarEvent){
				 			CalendarEvent.update({id:calendarEvent.id}, Event, function(err, Event){
				 				 if(err) return callback('saveorUpdateEvent  : CalendarEvent.update : ' + err);
								  
								  callback(null);
				 			});

				 		}else{
				 			CalendarEvent.create(Event, function(err, Event){
								if(err) return callback('saveorUpdateEvent  : CalendarEvent.create : ' +err);

								callback(null);
							});
				 		}
				 });

	

}

/**
 * Description
 * @method saveOrUpdateCalendarList
 * @param {} Calendar
 * @param {} userId
 * @param {} callback
 * @return 
 */
function saveOrUpdateCalendarList(Calendar,userId,callback){

	Calendar.externalid = Calendar.id;
	delete Calendar.id;

	Calendar.user = userId;

	CalendarList.findOne({ externalid : Calendar.externalid})
				 .exec(function(err, CalendarFound){
				 		if(err) return callback('saveOrUpdateCalendarList : ' + err);

				 		if(CalendarFound){
				 			CalendarList.update({id:CalendarFound.id}, Calendar, function(err, Calendar){
				 				 if(err) return callback('saveOrUpdateCalendarList  : CalendarList.update : ' + err);
				 				 if(callback)
				 				 	callback(null, CalendarFound);
				 			});

				 		}else{
				 			CalendarList.create(Calendar, function(err, Calendar){
								if(err) return callback('saveOrUpdateCalendarList  : CalendarList.create : ' +err);
								
								if(callback)
				 				 	callback(null,CalendarFound);
							});
				 		}
				 });
}

module.exports = {

	/**
	 * Description
	 * @method syncCalendar
	 * @param {} callback
	 * @return 
	 */
	syncCalendar : function(callback){
			GoogleApi.find()
					 .exec(function foundGoogleApi(err, GoogleApis){
					 	if(err) return callback('SyncCalendar : foundGoogleApi : ' +  err);
						
						var downloaded = 0;
					 	for(var i = 0;i<GoogleApis.length;i++){
					 		getGoogleCalendar(GoogleApis[i].access_token,GoogleApis[i].refresh_token, GoogleApis[i].user, function(err){
								 downloaded++;
								 if(downloaded == GoogleApis.length){
									 callback(null);
								 }
							 });
					 	}
				
				});	
	},

};