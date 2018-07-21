
module.exports = {

    attributes: {

        name: {
            type: 'string'
        },

        value: {
            type: 'string',
            required: true,
            unique: true
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
