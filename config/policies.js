/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': false,
  Action : ['checkToken'],
  ActionType : ['checkToken'],
  Alarm : ['checkToken'],
  Area : ['checkToken'],
  Brain: [ 'checkToken'],
  Box: ['checkToken'],
  BoxType: [ 'authenticated'],
  CalendarEvent : ['checkToken'],
  CalendarList : ['checkToken'],
  Category: ['checkToken'],
  ChromeNotification : ['checkToken'],
  Dashboard: [ 'authenticated'],
  Event: ['checkToken'], 
  EventType: ['checkToken'], 
  Device: ['checkToken'],
  DeviceState: ['checkToken'],
  DeviceType: ['checkToken'],
  GoogleApi : ['checkToken'],
  House : ['checkToken'],
  Launcher :['checkToken'],
  LauncherType : ['checkToken'],
  LifeEvent : ['checkToken'],
  Location : ['checkToken'],
  Lock : ['checkIfLocked'],
  Machine : ['checkToken'],
  Message : ['checkToken'],
  Mode: ['checkToken'],
  Module : ['checkToken'],
  Motion : ['checkToken'],
  MotionSensor : ['checkToken'],
  Music : ['checkToken'],
  Notification : ['checkToken'],
  NotificationType : ['checkToken'],
  NotificationUser : ['checkToken'],
  Param : ['checkToken'],
  ParamUser : ['checkToken'],
  Parametre : ['checkToken'],
  PhenixElectricDevice : ['checkToken'],
  ProfilePicture : ['checkToken'],
  Room : ['checkToken'],
  Scenario : ['checkToken'],
  Script : ['checkToken'],
  Sentence : ['checkToken'],
  Session : {
    newUser: ['signupAllowed'],
    createUser: ['signupAllowed'],
    create: ['rateLimit'],
    destroy: ['checkToken']
  },
  Socket : ['checkToken'],
  Speak : ['checkToken'],
  State : ['checkToken'],
  StateType : ['checkToken'],
  System : {
    index: ['checkToken'],
    shutdown: ['checkToken', 'isAdmin'],
    update: ['checkToken', 'isAdmin'],
    healthCheck: true
  },
  Timer: ['checkToken'],
  Token : ['checkToken'],
  Update: ['checkToken'],
  User : {
    index: ['checkToken'],
    create: ['canCreateUser'],
    login: ['rateLimit'],
    delete: ['checkToken', 'isAdmin'],
    update: ['checkToken'],
    whoami: ['checkToken'],
    seen: ['checkToken']
  },
  Welcome : {
    index: [],
    login: [],
    installation: ['signupAllowed']
  },
  Weather : ['checkToken'],


  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
	// RabbitController: {

		// Apply the `false` policy as the default for all of RabbitController's actions
		// (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
		// '*': false,

		// For the action `nurture`, apply the 'isRabbitMother' policy
		// (this overrides `false` above)
		// nurture	: 'isRabbitMother',

		// Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
		// before letting any users feed our rabbits
		// feed : ['isNiceToAnimals', 'hasRabbitFood']
	// }
};
