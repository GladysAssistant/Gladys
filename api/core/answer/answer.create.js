const queries = require('./answer.queries.js');

module.exports = function create(answer) {

    // test if answer already exist
    return gladys.utils.sql(queries.getByUuid, [answer.uuid])
        .then((answers) => {

            // if no, create answer
            if(answers.length == 0) return Answer.create(answer);

            // if yes, update answer
            return Answer.update({id: answers[0].id}, answer);
        });
};