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
  Action : ['checkToken', 'Human'],
  ActionType : ['checkToken', 'Human'],
  Alarm : ['checkToken', 'Human'],
  Brain: [ 'authenticated', 'Human'],
  Box: [ 'authenticated', 'Human'],
  CalendarEvent : ['checkToken', 'Human'],
  CalendarList : ['checkToken', 'Human'],
  ChromeNotification : ['checkToken', 'Human'],
  Dashboard: [ 'authenticated', 'Human'],
  Event: ['checkToken', 'Human'], 
  Device: ['checkToken', 'Human'],
  DeviceState: ['checkToken', 'Human'],
  DeviceType: ['checkToken', 'Human'],
  GoogleApi : ['checkToken', 'Human'],
  House : ['checkToken', 'Human'],
  Launcher :['checkToken', 'Human'],
  LauncherType : ['checkToken', 'Human'],
  LifeEvent : ['checkToken', 'Human'],
  Location : ['checkToken', 'Human'],
  Lock : ['checkToken', 'Human'],
  Machine : ['checkToken', 'Human'],
  Message : ['checkToken', 'Human'],
  Module : ['checkToken', 'Human'],
  Motion : ['checkToken', 'Human'],
  MotionSensor : ['checkToken', 'Human'],
  Music : ['checkToken', 'Human'],
  Notification : ['checkToken', 'Human'],
  Parametre : ['checkToken', 'Human'],
  PhenixElectricDevice : ['checkToken', 'Human'],
  ProfilePicture : ['checkToken', 'Human'],
  Room : ['checkToken', 'Human'],
  Scenario : ['checkToken', 'Human'],
  Script : ['checkToken', 'Human'],
  Session : {
    newUser: ['signupAllowed'],
    createUser: ['signupAllowed'],
    create: true,
    destroy: ['checkToken', 'Human']
  },
  Socket : ['checkToken', 'Human'],
  Speak : ['checkToken', 'Human'],
  State : ['checkToken', 'Human'],
  StateType : ['checkToken', 'Human'],
  Timer: ['checkToken', 'Human'],
  Token : ['checkToken', 'Human'],
  Update: ['checkToken', 'Human'],
  User : {
    index: ['checkToken', 'Human'],
    create: ['canCreateUser'],
    login: [],
    delete: ['checkToken', 'Human'],
    update: ['checkToken', 'Human'],
    whoami: ['checkToken', 'Human']
  },
  Welcome : [],
  Weather : ['checkToken', 'Human'],


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
