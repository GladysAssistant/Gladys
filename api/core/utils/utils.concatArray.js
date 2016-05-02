module.exports = concatArray;

// take in parameters an array of object. Ex : [{ temperature: 12}, {humidity: 50}]
// and a object 'scope'. Ex: {user: 1}
// returns a single object with every property inside.
// ex : return {temperature: 12, humidity: 50, user:1}
function concatArray(arr, scope) {
    arr.forEach(function(item) {
        for (var prop in item) {
            if (item.hasOwnProperty(prop) && !scope.hasOwnProperty(prop)) {
                scope[prop] = item[prop];
            }
        }
    });
    return scope;
}