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
  Action : ['isMachineMaster','checkToken', 'Human'],
  ActionType : ['isMachineMaster','checkToken', 'Human'],
  Alarm : ['isMachineMaster','checkToken', 'Human'],
  CalendarEvent : ['isMachineMaster','checkToken', 'Human'],
  CalendarList : ['isMachineMaster','checkToken', 'Human'],
  ChromeNotification : ['isMachineMaster','checkToken', 'Human'],
  Contact : ['isMachineMaster','checkToken', 'Human'],
  Dashboard: ['isMachineMaster', 'authenticated', 'Human', 'sameNetwork'],
  GoogleApi : ['isMachineMaster','checkToken', 'Human'],
  House : ['isMachineMaster','checkToken', 'Human'],
  Launcher :['isMachineMaster','checkToken', 'Human'],
  LauncherType : ['isMachineMaster','checkToken', 'Human'],
  LifeEvent : ['isMachineMaster','checkToken', 'Human'],
  Location : ['isMachineMaster','checkToken', 'Human'],
  Lock : ['isMachineMaster','checkToken', 'Human'],
  Machine : ['isMachineMaster','checkToken', 'Human'],
  Message : ['isMachineMaster','checkToken', 'Human'],
  MilightLamp : ['isMachineMaster','checkToken', 'Human'],
  MilightWifi : ['isMachineMaster','checkToken', 'Human'],
  Motion : ['isMachineMaster','checkToken', 'Human'],
  MotionSensor : ['isMachineMaster','checkToken', 'Human'],
  Music : ['isMachineMaster','checkToken', 'Human'],
  Notification : ['isMachineMaster','checkToken', 'Human'],
  Parametre : ['isMachineMaster','checkToken', 'Human'],
  PhenixElectricDevice : ['isMachineMaster','checkToken', 'Human'],
  ProfilePicture : ['isMachineMaster','checkToken', 'Human'],
  PushBullet : ['isMachineMaster','checkToken', 'Human'],
  Room : ['isMachineMaster','checkToken', 'Human'],
  Scenario : ['isMachineMaster','checkToken', 'Human'],
  Script : ['isMachineMaster','checkToken', 'Human'],
  Session : true,
  Socket : ['isMachineMaster','checkToken', 'Human'],
  Speak : ['isMachineMaster','checkToken', 'Human'],
  State : ['isMachineMaster','checkToken', 'Human'],
  StateType : ['isMachineMaster','checkToken', 'Human'],
  Temperature : ['isMachineMaster','checkToken', 'Human'],
  TemperatureSensor : ['isMachineMaster','checkToken', 'Human'],
  Timer: ['isMachineMaster','checkToken', 'Human'],
  Token : ['isMachineMaster','checkToken', 'Human'],
  User : ['isMachineMaster','checkToken', 'Human'],
  UserHouseRelationType : ['isMachineMaster','checkToken', 'Human'],
  Welcome : ['isMachineMaster'],


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
