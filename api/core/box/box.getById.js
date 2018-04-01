/**
 * @public
 * @description This function return box
 * @name gladys.box.getById
 * @param {integer} id The id of the boxs
 * @returns {box} box
 * @example
 * var id = 1
 *
 * gladys.box.getById(id)
 *      .then(function(box){
 *         // do something  
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function getById(id){
    return gladys.utils.sqlUnique('SELECT * FROM box WHERE id = ?', [id])
        .then((box) => {
            try {
                box.params = JSON.parse(box.params);
            } catch(e){
                box.params = null;
            }
            return box;
        });
};