var uuid = require('node-uuid');

module.exports = function create(boxType){
  boxType.uuid = boxType.uuid || uuid.v4();
  return BoxType.create(boxType);
};