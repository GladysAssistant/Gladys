
module.exports = function(module){
   
   // test if config function exist
   if (typeof gladys.modules[module.slug].config !== "function") {
     
     return Promise.resolve();
   } else {
       return gladys.modules[module.slug].config();
   }
};