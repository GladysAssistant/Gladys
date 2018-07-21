
module.exports = {

    attributes: {

        name: {
            type: 'string',
            required: true
        },

        house: {
            model: 'House',
            required: true
        },

        permission: {
            type: 'integer'
        },
        
        zones: {
          collection: 'Zone',
          via: 'rooms'
        }
    }

};
