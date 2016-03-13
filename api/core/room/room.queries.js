
module.exports = {
    delete: 'DELETE FROM room WHERE id = ?;'  ,
    getRoomsInHouse: `
    SELECT room.* FROM house
    INNER JOIN userhouserelation ON userhouserelation.house = house.id
    INNER JOIN room ON room.house = house.id
    WHERE user = ?
    AND room.house = ?
    LIMIT ?
    OFFSET ?;
  
  `,
   getAll: 'SELECT * FROM room;'
};