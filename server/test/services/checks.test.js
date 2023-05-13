const { lstatSync, readdirSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { expect } = require('chai');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};

/**
 * Verify that all services follow the requirements.
 */
describe('services', () => {
  const isDirectory = (source) => lstatSync(source).isDirectory();
  const getDirectories = (source) =>
    readdirSync(source)
      .map((name) => join(source, name))
      .filter(isDirectory);
  const folders = getDirectories(join(__dirname, '../../services'));
  folders.forEach((folder) => {
    describe(folder, () => {
      const packageJsonPath = join(folder, 'package.json');
      it('package.json should exist', () => {
        const packageJsonExist = existsSync(packageJsonPath);
        expect(packageJsonExist).to.be.true; // eslint-disable-line
      });
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      it('package.json should specify compatible cpu', () => {
        expect(packageJson).to.have.property('cpu');
      });
      it('package.json should specify compatible os', () => {
        expect(packageJson).to.have.property('os');
      });
      const indexFilePath = join(folder, 'index.js');
      it('index.js should exist', () => {
        const indexFileExist = existsSync(indexFilePath);
        expect(indexFileExist).to.be.true; // eslint-disable-line
      });
      const index = require(indexFilePath); // eslint-disable-line
      const service = index(gladys, 'd07bf09b-2846-4c94-8191-026ba7d62bf0');
      it('index.js should expose start function', () => {
        expect(service).to.have.property('start');
        expect(service.start).to.be.instanceOf(Function);
      });
      it('index.js should expose stop function', () => {
        expect(service).to.have.property('stop');
        expect(service.stop).to.be.instanceOf(Function);
      });
    });
  });
});
