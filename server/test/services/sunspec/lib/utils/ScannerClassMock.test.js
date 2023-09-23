class ScannerClassMock {
  // eslint-disable-next-line class-methods-use-this
  on(step, cb) {
    cb([
      {
        ip: '192.168.1.xx',
        openPorts: [502],
      },
    ]);
  }
}

module.exports = ScannerClassMock;
