  
  module.exports = function(options){
  
    // we get users in house
    return gladys.house.getUsers(options)  
      .then(function(users){

          // If users is empty, nobody is at home, return true
          if(!users.length) return true;
          // If user is provided, is this user at home after event, is so, it means nobody was at home before the user came back, return true
          if( options.user &&  users.length == 1 && users[0].id == options.user) return true;
          return false;
      });
};
