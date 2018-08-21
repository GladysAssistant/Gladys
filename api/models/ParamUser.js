
module.exports = {

    attributes: {

        name: {
           type:'string',
           required: true
        },
        
        value: {
            type:'string',
            required: true
        },

        user: {
            model: 'User',
            required: true
        }

    }
};
