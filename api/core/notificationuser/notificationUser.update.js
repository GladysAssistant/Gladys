
module.exports = function(notificationUser){
   var id = notificationUser.id;    
   delete notificationUser.id;
   // update the notificationUser
  return NotificationUser.update({id}, notificationUser)
    .then(function(notificationUsers){
        
        // if the notificationUser has been found
        if(notificationUsers.length){
            return Promise.resolve(notificationUsers[0]);
        } else {
            return Promise.reject(new Error('NotFound'));
        }
    });
};