
module.exports.update = {
    answersUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/answers/',
    eventsBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/events/',
    modesBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/modes/',
    sentencesBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/sentences/v2/',
    actionTypeUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/actions/',
    categoryBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/categories/',
    stateBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/states/',
    getLastVersionUrl: 'https://developer.gladysproject.com/api/gladys/version',
    icon: 'fa fa-refresh',
    iconColor: 'bg-light-blue',
    link: '/dashboard/parameters',
    updateScript: process.env.UPDATE_SCRIPT_PATH || `${__dirname}/../rpi-update.sh`,
    checkUpdateInterval: process.env.CHECK_UPDATE_INTERVAL || 24*60*60*1000
};