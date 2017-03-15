

module.exports = {

    attributes: {

        datetime: {
            type: 'datetime'
        },

        sender: {
            model: 'user'
        },

        receiver: {
            model: 'user'
        },

        text: {
            type: 'text'
        },

        conversation: {
            type: 'uuid'
        },

        isRead: {
            type: 'boolean',
            defaultsTo: false
        }
    }
};