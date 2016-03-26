
module.exports = {
    delete: 'DELETE FROM room WHERE id = ?;'  ,
    get: `
    SELECT room.*, house.name AS houseName, house.id as houseId 
    FROM room
    JOIN house ON (room.house = house.id)
    ORDER BY house.id
    LIMIT ?
    OFFSET ?;
   `,
   getAll: 'SELECT * FROM room;'
};