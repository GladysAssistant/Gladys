var queries = require('./boxType.queries.js');

module.exports = function create(boxType){
  
  return gladys.utils.sql(queries.getByUuid, [boxType.uuid])
    .then((result) => {

        // if boxType already exist, updating
        if(result.length > 0) return BoxType.update({id: result[0].id}, boxType);
        else return BoxType.create(boxType);
    });
};