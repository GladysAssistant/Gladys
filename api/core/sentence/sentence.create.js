var queries = require('./sentence.queries.js');

module.exports = function create(sentence){
	
	// we test if sentence exist
	return gladys.utils.sql(queries.getByUuid, [sentence.uuid])
	  .then(function(sentences){
		 
		 // if sentence exist, update it
		 if(sentences.length){
			 
			 return Sentence.update({id: sentences[0].id}, sentence);
		 } else {
			 
			 // else, create it
			 sails.log.info(`Sentence : create : Inserting sentence ${sentence.uuid}`);
			 return Sentence.create(sentence);
		 }
	  });
	
};