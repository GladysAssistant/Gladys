/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
  
/**
 * LifeEventController
 *
 * @description :: Server-side logic for managing Lifeevents
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


var numberLifeEventToGet = 14;


function findEventType(EventName,callback){
  EventType.findOne({name:EventName}, function(err, Event){
      if(err) return callback(err);
      
      if(!Event){
        return callback('Event does not exist!');
      }
      
      callback(null, Event);
  });
}

/**
 * Get the interval between two lifeEvent
 * (Used to calculate sleepTime for example)
 * @method getIntervalBetweenLifeEvents
 * @param {} userId
 * @param {} startEventType
 * @param {} stopEventType
 * @param {} callback
 * @return 
 */
function getIntervalBetweenLifeEvents(userId,startEventType, stopEventType, callback)
{
	LifeEvent.find({
  		user : userId, 
  		or : [ { eventtype: startEventType }, { eventtype: stopEventType } ],
  		sort: 'datetime DESC',
  		limit: numberLifeEventToGet }, function(err, LifeEvents) {

            var Interval = [];
            var cpt = 0;
            var i = 0;
          
            if(!LifeEvents){
                return callback('No lifeEvents');
            }
 
            while(i < LifeEvents.length)
            {
                // while the current element is not the stop Event
                while(i<LifeEvents.length && LifeEvents[i].eventtype != stopEventType)
                    i++;

                var date1;
                // if we have found the stop Event
                if(i<LifeEvents.length) date1 = new Date(LifeEvents[i].datetime);
                    i++;

                // While the current element is not the start element
                while(i<LifeEvents.length && LifeEvents[i].eventtype != startEventType)
                    i++;

                var date2;
                if(i<LifeEvents.length) date2 = new Date(LifeEvents[i].datetime);
                    i++;
                if(date1 && date2)
                {
                    // Calculate interval between the two Events two by two
                    var duration = (date1.getTime() - date2.getTime())/ (1000*60*60);
                    // Round in the format :  8,2 Hours (for example)
                    duration = Math.round(duration*10)/10;
                    var month = date1.getMonth() + 1;
                    var day = date1.getDate();
                    var year = date1.getFullYear();
                    Interval[cpt] = {start : (year + "-" + month + "-" + day), duration : duration};
                    cpt++;
                }
                date1= false;
                date2= false;
  					
            }

            callback(Interval);
	
		});
}

module.exports = {
  
  
  index: function(req,res,next){
      if(typeof req.param('start') === 'undefined' || typeof req.param('end') === 'undefined') {
        return res.json('Wrong parameter');
      }
      
      var start = parseInt(req.param('start'));
      var end = parseInt(req.param('end'));
      
      if(isNaN(start) || isNaN(end)){
        return res.json('Must be a valid number');
      }
      
      var sql = "SELECT lifeevent.id, name, BeautifulName, FaIcon,iconColor, sentence, param, datetime ";
      sql += "FROM lifeevent ";
      sql += "JOIN eventtype ON (eventtype.id = lifeevent.eventtype) ";
      sql += "WHERE user = ? ";
      sql += "ORDER BY datetime DESC ";
      sql += "LIMIT ?, ? ";

      LifeEvent.query(sql, [parseInt(req.session.User.id), parseInt(req.param('start')) , parseInt(req.param('end')) ], function(err, lifeevents){
          	if(err) return res.json(err);
            
            for(var i = 0; i<lifeevents.length;i++){
              if(lifeevents[i].BeautifulName){
                lifeevents[i].BeautifulName = req.__(lifeevents[i].BeautifulName);
              }
            }
            
            return res.json(lifeevents);
      });
  },

	/**
	 * Create a new LifeEvent
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function (req, res, next){
    
    var event = {
        user: req.session.User.id,
        eventtype: req.param('eventtype')
    };
    
    if(req.param('room')){
      event.room = req.param('room');
    }
    
    if(req.param('param')){
      event.param = req.param('param');
    }
    
  	LifeEventService.saveEvent(event, function(err){
        	if(err) return res.status(500).json(err);
          
          return res.json("ok");
    });
  },

  /**
   * Get SleepTime
   * @method getSleep
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  getSleep: function (req, res, next){

  	User.findOne({ id: req.session.User.id }, function(err, user) {
        
        async.parallel([
            function(callback){
                findEventType(sails.config.lifeevent.wakeUp.name, callback);
            },
            function(callback){
                findEventType(sails.config.lifeevent.goingToSleep.name, callback);
            }
        ],
        function(err, results){
           if(err) return res.json(err);
           
           getIntervalBetweenLifeEvents(req.session.User.id, results[1].id, results[0].id, function(Interval) {
      		 var time = recommendedSleepTime.get(user.age());
      		 return res.json({ recommended: time, userSleep: Interval});
        });

  			
  		});
  	});

  } 
	
};

