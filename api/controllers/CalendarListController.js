/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
/**
 * CalendarListController
 *
 * @description :: Server-side logic for managing CalendarList
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	
	/**
	 * Get All calendars from connected user
	 */
	index: function(req, res,next){
		CalendarList.find({user:req.session.User.id})
			.exec(function(err, calendarList){
				if(err) return res.json(err);
				
				return res.json(calendarList);
			});
	},
	
	/**
	 * Set calendar to active or disabled 
	 */
	updateActiveCalendar: function(req,res,next){
		CalendarList.update({id:req.param('id')}, {active:req.param('active')}, function(err, calendar){
			if(err) return res.json(err);
			
			return res.json(calendar);
		});
	},
	
	syncCalendars: function(req,res,next){
		GoogleCalendarService.syncCalendar(function(err){
			if(err) return res.json(err);
			
			return res.json('ok');
		});
	}

};