
/**
 * CalendarEventController
 *
 * @description :: Server-side logic for managing Calendarevents
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    /**
     * Get event by day
    */

   index: function(req, res, next){
     var options = req.query;
     options.user = req.session.User;

      gladys.calendar.getEventsDates(options)
        .then((calendarEvents) =>  res.json(calendarEvents))
        .catch(next);
    },

    /**
     * Get all event
    */

   get: function(req, res, next){
    var options = req.query;
    options.user = req.session.User;

     gladys.calendar.getAllEvents(options)
       .then((calendarEvents) =>  res.json(calendarEvents))
       .catch(next);
    },

};