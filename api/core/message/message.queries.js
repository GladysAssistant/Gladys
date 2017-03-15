module.exports = {
    getConversation: `
        SELECT * FROM message WHERE conversation = ?
        ORDER BY datetime;
    `,
    getByUser: `
        SELECT * FROM message 
        WHERE ( sender = ? AND receiver = ?)
        OR (receiver = ? AND sender = ?)
        ORDER BY datetime
        LIMIT ?
        OFFSET ?;
    `,
    getGladysMessages: `
        SELECT * FROM message
        WHERE ( sender = ? AND receiver IS NULL)
        OR (receiver = ? AND sender IS NULL)
        ORDER BY datetime
        LIMIT ?
        OFFSET ?;
    `
};