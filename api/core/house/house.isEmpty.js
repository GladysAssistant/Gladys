
module.exports = function(options){
  
  // we get users in house
  return gladys.house.getUsers(options)  
    .then(function(users){
        
        // if there are user inside, return false
        if(users.length) return false;
        
        return true;
    });
};