
module.exports.update = {
    getLastVersionUrl: 'https://developer.gladysproject.com/api/gladys/version',
    icon: 'fa fa-refresh',
    iconColor: 'bg-light-blue',
    link: '/dashboard/parameters',
    checkUpdateInterval: process.env.CHECK_UPDATE_INTERVAL || 24*60*60*1000
};