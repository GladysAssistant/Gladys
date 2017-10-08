const shared = require('./direction.shared.js');

module.exports = function travelTime(options){
    if(!options || !options.origin || !options.destination) return Promise.reject(new Error('Direction : origin and destination options are required.'));

    return getTravelTimeProvider(0, options);
};

function getTravelTimeProvider(index, options){
    if(!shared.providers[index]) return Promise.reject(new Error('No directions provider available')); 
    
    // call the provider
    return gladys.modules[shared.providers[index]].direction.travelTime(options)
        .catch((err) => {

            sails.log.warn(`Gladys.direction : error while calling ${shared.providers[index]}`);
            sails.log.warn(err);

            // if the provider is not available, call the next one
            return getTravelTimeProvider(index + 1, options);
        });
}