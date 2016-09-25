
module.exports = {
  delete: 'DELETE FROM machine WHERE id = ?;'  ,
  get: 'SELECT * FROM machine;',
  getMyHouse: `
    SELECT house.* FROM house 
    JOIN machine ON machine.house = house.id
    WHERE machine.me = true;
    `
};