
module.exports = {

    attributes: {

        title: {
            type: 'string'
        },

        condition_template: {
            type: 'string'
        },

        active: {
            type: 'boolean',
            defaultsTo: true
        },
        
        eventtype: {
            model: 'EventType',
            required: true
        },

        user: {
            model: 'User',
            required: true
        },

    }
};
