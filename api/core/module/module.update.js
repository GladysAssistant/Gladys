
module.exports = function(module){
    var id = module.id;
    delete module.id;
    return Module.update({id}, module)
      .then(function(modules){
         
         // if module has been found
         if(modules.length){
             return modules[0];
         } else {
             return Promise.reject(new Error('NotFound'));
         }
      });
};