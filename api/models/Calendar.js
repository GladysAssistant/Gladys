
module.exports = {

    attributes: {

        externalid: {
            type: 'string',
            required: true,
            unique: true
        },

        name: {
            type: 'string'
        },

        description: {
            type: 'string'
        },

        service: {
            type: 'string'
        },

        active: {
            type: 'boolean',
            defaultsTo: true
        },

        user: {
            model: 'User',
            required: true
        }

    }
};
