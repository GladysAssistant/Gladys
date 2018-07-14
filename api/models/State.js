
module.exports = {

    attributes: {

        state: {
            model: 'StateType',
            required: true
        },

        condition_template: {
            type: 'string'
        },

        active: {
            type: 'boolean',
            defaultsTo: true
        },

        launcher: {
            model: 'Launcher',
            required: true
        }

    }
};
