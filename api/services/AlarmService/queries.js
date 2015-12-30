// All SQL queries can be found here

module.exports = {
  getAlarms:  `SELECT * FROM alarm
                WHERE (status = 1)
		        AND ( (recurring = -1 AND datetime > SYSDATE()) OR recurring <> -1 )`

};