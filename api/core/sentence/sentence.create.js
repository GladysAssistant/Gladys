var queries = require('./sentence.queries.js');

module.exports = function create(sentence){
	
	// we test if sentence exist
	return gladys.utils.sql(queries.getByUuid, [sentence.uuid])
	  .then(function(sentences){
		 
		 if(sentences.length){
			 return sentences[0];
		 } else {
			 
			 sails.log.info(`Sentence : create : Inserting sentence ${sentence.uuid}`);
			 return Sentence.create(sentence);
		 }
	  });
	
};