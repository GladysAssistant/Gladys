
module.exports = {
  get: `
    SELECT notificationuser.*, notificationtype.name, notificationtype.service FROM notificationuser 
    JOIN notificationtype ON notificationuser.notificationtype = notificationtype.id
    WHERE user = ? 
    ORDER BY priority;
    `,
  delete: 'DELETE FROM notificationuser WHERE id = ?;',  
};