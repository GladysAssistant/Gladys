var queries = require('./category.queries.js');

module.exports = function (category){
  return gladys.utils.sql(queries.getByService, [category.service])
    .then(function(categories){
         
      if(categories.length){
        return categories[0];
      } else {
             
        sails.log.info(`Category : create : Inserting category ${category.name}`);
        return Category.create(category);    
      }
    });
};