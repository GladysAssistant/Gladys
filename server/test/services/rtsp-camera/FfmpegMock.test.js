const { fake } = require('sinon');
const fse = require('fs-extra');
const EventEmitter = require('events');

const FfmpegMock = (path) => {
  let lastStream = null;
  let func = new EventEmitter();
  func = Object.assign(func, {
    format: fake.returns(func),
    outputOptions: fake.returns(func),
    output: (stream) => {
      stream.write('image');
      stream.close();
      lastStream = stream;
      return func;
    },
    run: () => {
      lastStream.on('finish', () => {
        if (path === 'broken') {
          func.emit('error', { message: 'broken' });
        } else if (path === 'no-image-written') {
          fse.removeSync(lastStream.path);
          func.emit('end');
        } else {
          func.emit('end');
        }
      });
      return func;
    },
  });
  return func;
};
module.exports = FfmpegMock;
