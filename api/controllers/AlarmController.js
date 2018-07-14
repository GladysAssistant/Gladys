
/**
 * @apiDefine AlarmSuccess
 * @apiSuccess {String} name Name of the alarm.
 * @apiSuccess {datetime} datetime Datetime of the alarm when the alarm is at a specific date
 * @apiSuccess {time} time Time of the alarm when it's a reccurring alarm
 * @apiSuccess {integer} dayofweek The day the alarm should ring (reccurring alarm)
 * @apiSuccess {boolean} active If the alarm is active or not
 */
  
module.exports = {


  /**
   * @api {get} /alarm get all alarms
   * @apiName getAlarm
   * @apiGroup Alarm
   * @apiPermission authenticated
   *
   * @apiUse AlarmSuccess
   */
  index: function(req, res, next){
    gladys.alarm.get(req.session.User)
      .then(function(alarms){
        return res.json(alarms);
      })
      .catch(next);
  },
  
    /**
   * @api {post} /alarm create an alarm
   * @apiName createAlarm
   * @apiGroup Alarm
   * @apiPermission authenticated
   * 
   * @apiParam {String} name Name of the alarm.
   * @apiParam {datetime} datetime Datetime of the alarm when the alarm is at a specific date
   * @apiParam {time} time Time of the alarm when it's a reccurring alarm
   * @apiParam {integer} dayofweek The day the alarm should ring (reccurring alarm)
   * @apiParam {boolean} active If the alarm is active or not
   * 
   * @apiUse AlarmSuccess
   */
  create: function(req, res, next){
    req.body.user = req.session.User.id;
    gladys.alarm.create(req.body)
      .then(function(alarm){
        return res.status(201).json(alarm);
      })
      .catch(next);
  },
  
  timer: function(req, res, next){
     req.body.user = req.session.User.id;
     gladys.alarm.timer(req.body)
       .then(function(alarm){
         return res.status(201).json(alarm);
       })
       .catch(next);
  },
  
  /**
   * @api {delete} /alarm/:id delete an alarm
   * @apiName deleteAlarm
   * @apiGroup Alarm
   * @apiPermission authenticated
   *
   * @apiSuccess {boolean} success 
   */
  delete: function(req, res, next){
    gladys.alarm.delete({id: req.params.id})
      .then(function(){
        return res.json({success: true});
      })
      .catch(next);
  }
	
};