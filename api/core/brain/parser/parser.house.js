
module.exports = function(originalText){
  return gladys.house.getAll()
    .then(function(houses){
        
        var result = [];
        var replaceRegex = '';
           
        // foreach house, we verify if the house is present in the sentence
        houses.forEach(function(house){
            if(present(originalText, house.name)){
                result.push(house);
                if(replaceRegex.length > 0) replaceRegex += '|';
                replaceRegex += house.name;
            }
        });

        var text = originalText;
        
        if(replaceRegex.length > 0) {
            text = originalText.replace(new RegExp(replaceRegex, 'g'), '%HOUSE%');
        }

        return {
            text, 
            houses: result,
            allHouses: houses
        };
    });
};



/**
 * Return true if the houseName is present in the sentence
 */
function present(text, type){
    return (text.toLowerCase().indexOf(type ? type.toLowerCase() : type) > -1);
}