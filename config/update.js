
module.exports.update = {
    eventsBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/events/',
    boxTypesBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/boxs/',
    modesBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/modes/',
    sentencesBaseUrl: 'https://raw.githubusercontent.com/GladysProject/gladys-data/master/sentences/',
    getLastVersionUrl: 'https://developer.gladysproject.com/api/gladys/version',
    icon: 'fa fa-refresh',
    iconColor: 'bg-light-blue',
    link: '/dashboard/parameters',
    checkUpdateInterval: process.env.CHECK_UPDATE_INTERVAL || 24*60*60*1000
};