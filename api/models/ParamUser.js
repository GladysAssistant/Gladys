/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * @public
 * @name ParamUser
 * @class
 */

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
