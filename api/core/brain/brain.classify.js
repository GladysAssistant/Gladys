const Promise = require('bluebird');
const clone = require('clone');
const shared = require('./brain.shared.js');
const parser = require('./parser/parser.js');
const answer = require('./brain.answer.js');

module.exports = function classify(user, message){
    var start = process.hrtime();
    
    if(!message.text || message.text.length === 0){
        return Promise.reject(new Error('BRAIN_NO_TEXT_GIVEN'));
    }

    return parser.parse(message.text)
        .then((scope) => {

            // add language to scope so that called module can adapt to the current language
            scope.language = user.language.substr(0, 2).toLowerCase();
            
            // add user to scope so that called module can adapt to current user
            scope.user = user;

            // clean password so we don't expose sensible data
            if(scope.user.password) delete scope.user.password;

            var classifier = shared.getClassifier();

            var classifications = classifier.classify(scope.replacedText);

            if(classifications.length === 0) {
                classifications = [`brain${sails.config.brain.separator}no-command-detected`];
            }

            // foreach classified label
            return Promise.map(classifications, function(classification) {
                var splitted = classification.split(sails.config.brain.separator);
                sails.log.info(`brain : classify : Identified label ${classification}`);
                return callAction(clone(scope), message, splitted[0], splitted[1])
                    .then((result) => answer(result, user))
                    .then( result => gladys.sentence.createLocal({ text: scope.replacedText, language: scope.language, service: splitted[0], label: splitted[1] }).then(() => result))
            });
        })
        .then((result) => {
            var elapsed = process.hrtime(start)[1] / 1000000;
            var executionTime = process.hrtime(start)[0] + 's, ' + elapsed.toFixed(3) + ' ms';
            sails.log.debug(`brain : classify : Answered in ${executionTime}`);

            return result;
        });
};

function callAction(scope, message, service, label) {
    var toCall;

    scope.label = label;

    // if it's a gladys core function
    if (gladys[service] && typeof gladys[service].command == "function") {
        toCall = gladys[service].command;
    }
    
    // testing if it's a module
    else if (gladys.modules[service] && typeof gladys.modules[service].command == "function") {
        toCall = gladys.modules[service].command;
    }
    
    // the function does not exist, rejecting
    else {
        return errorMessage(`gladys.modules.${service}.command is not a function`, scope, message, service, label);
    }

    // get all messages from conversation
   return gladys.message.getConversation(message.conversation)
        .then((conversationMessages) => {

            sails.log.debug(`Getting conversation ${message.conversation}, found ${conversationMessages.length} messages.`);

            // if there is only one element in array, return empty
            if(conversationMessages.length <= 1) return [];

            // remove last element, it is the current message
            conversationMessages.pop();

            // then, foreach message, analyze it
            return Promise.map(conversationMessages, function(conversationMessage) {
                return parser.parse(conversationMessage.text);
            });
        })
        .then((conversationMessages) => {

            scope.conversationMessages = conversationMessages;

             // call the command function
            return toCall(scope);
        })
        .then((response) => {

                response = response || {};
                response.label = response.label || 'default';
                response.scope = response.scope || {};

                message.label = label;
                message.scope = scope;

                return {
                    message,
                    response
                };
        })
        .catch((err) => {
                return errorMessage(err, scope, message, service, label);
        });
}

/**
 * Return an error message
 */
function errorMessage(err, scope, message, service, label){
    sails.log.warn(`Brain : classify : Error while executing command in service = ${service}, label = ${label}`);
    sails.log.warn(err);

    var response = {
        label: 'error'
    };

    message.label = label;
    message.scope = scope;

    return Promise.resolve({
        message,
        response
    });
}