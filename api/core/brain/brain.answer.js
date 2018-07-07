const queries = require('./brain.queries.js');
const Promise = require('bluebird');
const injector = require('./injector/injector.js');

module.exports = function answer(result, user) {

    sails.log.info(`Brain : answer : Answering with label ${result.response.label} in language ${user.language}`);

    // put language in lower case and only with 2 first characters 
    var language = user.language.substr(0,2).toLowerCase();

    return gladys.utils.sql(queries.getAnswers, [language, result.response.label])
        .then((answers) => {

            sails.log.debug(`Brain : answer : Found ${answers.length} possible.`);

            // pick one answer randomly
            var randomRow = Math.floor(Math.random() * answers.length) + 0;

            // test if answer exist, if yes pick the text
            if(randomRow != -1 && answers[randomRow] != undefined) {
                result.response.text = answers[randomRow].text;
                result.response.needAnswer = answers[randomRow].needAnswer;
            }
            else {
                result.response.text = sails.__({ phrase: 'default-answer-gladys-brain', locale: language});
                result.response.needAnswer = false;
            }

            // add default values
            result.response.scope = result.response.scope || {};
            result.response.scope['%USER_FIRSTNAME%'] = user.firstname;
            result.response.scope['%USER_LASTNAME%'] = user.lastname;
            result.response.scope['%USER_EMAIL%'] = user.email;

            // replace variables by values
            result.response.text = injector.inject(result.response.text, result.response.scope);

            var newMessage = {
                sender: null,
                receiver: user.id,
                text: result.response.text
            };

            return [gladys.message.create(newMessage), gladys.utils.sql(queries.getNotificationTypes, [user.id])];
        })
        .spread((newMessage, notificationTypes) => {

            // adding senderName
            newMessage.senderName = user.assistantName;
            newMessage.needAnswer = result.response.needAnswer;

            // test each notification system
            return Promise.mapSeries(notificationTypes, function(notificationType) {
                return trySendingMessage(newMessage, notificationType, user)
                    .catch((err) => {

                        // if error is normal, propagate error to abort chain
                        if(err.message == 'ok') return Promise.reject(err);
                    });
            })
            .catch(function(err) {
                if (err.message !== 'ok') {
                    sails.log.warn(err);

                    return Promise.resolve(false);
                }
                
                return Promise.resolve(true);
            });
        })
        .then((messageSent) => {

            if(messageSent !== true) sails.log.info(`User is not available on any service. Cannot contact him.`);

            return result;
        });
};

/**
 * Call the service related to the notification
 */
function trySendingMessage(newMessage, type, user) {

    // if the module is not installed locally
    if(type.machine && type.machine.length) {
        sails.log.debug(`Module is not located locally, sending notification on machine ${type.machine}`);
        gladys.emit('message-notify', {
            machine_id: type.machine,
            module_slug: type.service,
            message: newMessage,
            type,
            user
        });
        return Promise.reject(new Error('ok'));
    }

    var toCall;

    if (gladys.modules[type.service] && typeof gladys.modules[type.service].notify == "function") {
        toCall = gladys.modules[type.service].notify;
    } else if(gladys[type.service] && typeof gladys[type.service].notify == "function") {
        toCall = gladys[type.service].notify;
    } else {
        return Promise.reject(new Error(`${type.service} is not a valid service`));
    }
    
    sails.log.info(`Brain : answer : Trying to contact ${type.service}`);

    return toCall(newMessage, user)
        .then(function(result) {
            
            sails.log.info(`Message sent with success with ${type.service}. Aborting the chain.`);
            
            // if module resolved, we stop the promise chain
            // it means one notification worked! 
            return Promise.reject(new Error('ok'));
        })
        .catch(function(e){
           
           // if the error is because we want to exist the promise chain,
           // we need to propagate the error
           if(e.message === 'ok') return Promise.reject(e);
           
           sails.log.info(`Unable to reach user with service ${type.service}. Trying with other services.`);

           // if notification does not work, we resolve
           // it means that we need to continue the flow
           return Promise.resolve(); 
        });
}