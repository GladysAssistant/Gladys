
module.exports = function createNotificationType(){
  return gladys.notification.install({service: 'socket', name: 'Websocket'});
};