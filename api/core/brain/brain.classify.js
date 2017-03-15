const Promise = require('bluebird');
const clone = require('clone');
const shared = require('./brain.shared.js');
const parser = require('./parser/parser.js');
const injector = require('./injector/injector.js');

module.exports = function classify(originalText, language){
    var start = process.hrtime();
    
    if(!originalText || originalText.length === 0){
        return Promise.reject(new Error('BRAIN_NO_TEXT_GIVEN'));
    }

    return parser.parse(originalText)
        .then((scope) => {

            // add language to scope so that called module can adapt to the current language
            scope.language = language;

            var classifier = shared.getClassifier();

            var classifications = classifier.classify(scope.replacedText);

            if(classifications.length === 0) {
                classifications = [`brain${sails.config.brain.separator}no-command-detected`];
            }

            // foreach classified label
            return Promise.map(classifications, function(classification){
                var splitted = classification.split(sails.config.brain.separator);
                sails.log.info(`brain : classify : Identified label ${classification} `);
                return callAction(clone(scope), splitted[0], splitted[1])
                    .then((result) => getAnswer(language, result));
            });
        })
        .then((result) => {
            var elapsed = process.hrtime(start)[1] / 1000000;
            var executionTime = process.hrtime(start)[0] + 's, ' + elapsed.toFixed(3) + ' ms';
            sails.log.debug(`brain : classify : Classified in ${executionTime}`);

            return result;
        });
};

function callAction(scope, service, label){
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
        return Promise.reject(new Error(`gladys.modules.${service}.command is not a function`));
    }

    // call the command function
   return toCall(scope)
      .then((response) => {

            response = response || {};
            response.label = response.label || 'default';
            response.scope = response.scope || {};

            return {
                message: {
                    label,
                    service,
                    scope
                },
                response
            };
      });
}

function getAnswer(language, result) {

    return gladys.utils.sql('SELECT text FROM answer WHERE language = ? AND label = ?;', [language, result.response.label])
        .then((answers) => {

            // pick one answer randomly
            var randomRow = Math.floor(Math.random() * (answers.length - 1)) + 0;
            
            // test if answer exist, if yes pick the text
            if(randomRow != -1 && answers[randomRow] != undefined) result.response.text = answers[randomRow].text;
            else result.response.text = null;

            // replace variables by values
            result.response.text = injector.inject(result.response.text, result.response.scope);
            
            return result;
        });
}