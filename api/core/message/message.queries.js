module.exports = {
  getConversation: `
        SELECT * FROM message WHERE conversation = ?
        ORDER BY datetime;
    `,
  getByUser: `
        SELECT message.*, user_sender.firstname AS sender_name, 
        user_receiver.firstname AS receiver_name
        FROM message 
        LEFT JOIN user AS user_sender ON message.sender = user_sender.id 
        LEFT JOIN user AS user_receiver ON message.receiver = user_receiver.id 
        WHERE ( sender = ? AND receiver = ?)
        OR (receiver = ? AND sender = ?)
        ORDER BY datetime
        LIMIT ?
        OFFSET ?;
    `,
  getGladysMessages: `
        SELECT * FROM 
            (SELECT message.*, CASE  
            WHEN user_sender.id IS NOT NULL THEN user_sender.firstname
            ELSE user_receiver.assistantname 
            END as senderName
        FROM message 
        LEFT JOIN user AS user_sender ON message.sender = user_sender.id 
        LEFT JOIN user AS user_receiver ON message.receiver = user_receiver.id 
        WHERE ( sender = ? AND receiver IS NULL)
        OR (receiver = ? AND sender IS NULL)
        ORDER BY datetime DESC
        LIMIT ?
        OFFSET ?) as messages 
        ORDER BY datetime;
    `
};