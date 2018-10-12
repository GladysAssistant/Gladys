
module.exports = function (user){
  return Notification.update({user: user.id}, {isRead: true});
};