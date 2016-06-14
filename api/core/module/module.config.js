
module.exports = function(module){
   
   // test if setup function exist
   if (typeof gladys.modules[module.slug].setup !== "function") {
     
     return Promise.resolve();
   } else {
       return gladys.modules[module.slug].setup();
   }
};