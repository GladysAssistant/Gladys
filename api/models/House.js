
module.exports = {

    attributes: {

        uuid: {
            type: 'uuid',
            required: true,
            unique: true
        },

        name: {
            type: 'string',
            required: true
        },

        address: {
            type: 'string',
            required: true
        },

        city: {
            type: 'string',
            required: true
        },

        postcode: {
            type: 'string',
            required: true
        },

        country: {
            type: 'string',
            required: true
        },

        latitude: {
            type: 'float',
            required: true
        },

        longitude: {
            type: 'float',
            required: true
        }

    }

};
