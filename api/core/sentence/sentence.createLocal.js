const queries = require('./sentence.queries.js');
const uuid = require('uuid');

module.exports = function createLocal(options){
	// we test if sentence exist
	return gladys.utils.sql(queries.getByText, [text])
	  .then( sentences => {
		 if(!sentences.length){
			 // if sentence not exist, create it
			 sails.log.info(`Sentence : create : Inserting sentence ${text}`);
			 return Sentence.create({ 
				uuid: uuid.v4(), 
				text: options.text, 
				label: options.label,
				status: options.label === 'no-command-detected' ? 'pending' : 'approved',
				service: options.service,
				language: options.language
			});
		 }
	  });
};