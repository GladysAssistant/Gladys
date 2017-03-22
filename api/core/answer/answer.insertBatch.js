const Promise = require('bluebird');

module.exports = function insertBatch(answers) {

    // foreach answer
    return Promise.map(answers, function(answer) {

        // add infos to each response 
        return Promise.map(answer.responses, function(response) {

            response.language = answer.language;
            response.label = answer.label;
            response.needAnswer = answer.needAnswer;

            // and create answer in DB
            return gladys.answer.create(response);
        });
    });
};