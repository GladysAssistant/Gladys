
module.exports = {

    attributes: {

        name: {
           type:'string',
           required: true,
           unique: true 
        },

        description: {
            type:'string'
        },

        type: {
            type: 'string',
            enum: ['visible', 'hidden', 'secret'],
            defaultsTo: 'visible'
        },

        module: {
            model: 'Module'
        },
        
        value: {
            type:'string',
            required: true
        }

    }
};
