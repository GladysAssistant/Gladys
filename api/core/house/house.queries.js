

module.exports = {
  delete: 'DELETE FROM house WHERE id = ?;',
  get: `
    SELECT house.* FROM house
    INNER JOIN userhouserelation ON userhouserelation.house = house.id
    WHERE user = ?
    LIMIT ?
    OFFSET ?;
  `
};