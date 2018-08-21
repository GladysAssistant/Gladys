
module.exports = {

    attributes: {

        title: {
            type: 'string',
            required: true
        },

        text: {
            type: 'string',
            required: true
        },

        link: {
            type: 'string'
        },

        priority: {
            type: 'integer',
            min: -2,
            max: 2,
            defaultsTo: 0
        },

        isRead: {
            type: 'boolean',
            defaultsTo: false
        },

        icon: {
            type: 'string',
            required: true
        },

        iconColor: {
            type: 'string',
            required: true
        },

        user: {
            model: 'User',
            required: true
        }

    }
};
