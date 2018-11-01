module.exports = validate;



function validate(area, distances) {
  if (!distances instanceof Array) {
    distances = [distances];
  }

  if (area instanceof Array) {
    var i = 0;
    while(i < area.length) {
      validateDistance(area[i], distances[i]);
      i++;
    }
  } else {
    validateDistance(area, distances[0]);
  }
}

function validateDistance(area, distance) {
  area.distance.should.be.equal(distance);
}
