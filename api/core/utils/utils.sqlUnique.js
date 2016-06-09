
// this function is useful to update one row,
// delete one row, and see if the update worked ( or if the row was not found )
module.exports = function(query, params){
    return gladys.utils.sql(query, params)
        .then(function(result){
            if(result.length === 0){
                return Promise.reject(new Error('NotFound'));
            } else {
                return Promise.resolve(result[0]);
            }
        });
};