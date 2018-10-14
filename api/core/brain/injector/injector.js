
// replace all variables with their value (ex: "%TIME%" )
module.exports.inject = function inject(text, scope){
  if(text === null) {
    return null; 
  }

  for(var prop in scope) {
    text = text.replace(new RegExp(prop, 'g'), scope[prop]);
  }

  return text;
};