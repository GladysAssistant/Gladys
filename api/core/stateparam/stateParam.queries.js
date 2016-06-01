
module.exports = {
  getByState: `
      SELECT * FROM stateparam 
      JOIN statetypeparam ON stateparam.statetypeparam = statetypeparam.id
      WHERE state = ?;
    `
};