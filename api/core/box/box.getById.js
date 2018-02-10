
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