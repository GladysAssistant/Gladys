
module.exports = {

    attributes: {

        name: {
            type: 'string'
        },
        
        uuid:{
            type:'uuid',
            required: true,
            unique: true
        },

        house: {
            model: 'House'
        },

        room: {
            model: 'Room'
        },

        me: {
            type: 'boolean',
            defaultsTo: false
        },

        lastSeen: {
            type: 'datetime'
        }

    }
};
