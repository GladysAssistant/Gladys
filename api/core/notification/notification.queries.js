module.exports = {
    getNotificationTypes: `
    SELECT * FROM notificationtype nt
    JOIN notificationuser nu ON (nt.id = nu.notificationtype)
    WHERE nu.user = ?
    ORDER BY nu.priority; 
  `,
   get: 'SELECT * FROM notification WHERE user = ? ORDER BY createdat DESC LIMIT ? OFFSET ?;',
   checkIfExist: `
   SELECT * FROM notification 
   WHERE user = ?
   AND title = ? 
   AND text = ?;
   `

};
