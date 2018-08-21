
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

        location: {
            type: 'string'
        },

        start: {
            type: 'datetime'
        },

        end: {
            type: 'datetime'
        },

        fullday: {
            type: 'boolean',
            defaultsTo: false
        },

        calendar: {
            model: 'Calendar',
            required: true
        }

    }
};
