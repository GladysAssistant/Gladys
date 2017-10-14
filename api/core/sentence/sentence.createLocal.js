const queries = require('./sentence.queries.js');
const uuid = require('uuid');

module.exports = function createLocal({ text, label, service, language }){
	// we test if sentence exist
	return gladys.utils.sql(queries.getByText, [text])
	  .then(function(sentences){
		 if(!sentences.length){
			 // if sentence not exist, create it
			 sails.log.info(`Sentence : create : Inserting sentence ${text}`);
			 return Sentence.create({ 
				uuid: uuid.v4(), 
				text, 
				label,
				status: label === 'no-command-detected' ? 'pending' : 'approuve',
				service,
				language
			});
		 }
	  });
};