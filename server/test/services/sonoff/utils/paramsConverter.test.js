const { expect } = require('chai');

const { paramsConverter } = require('../../../../services/sonoff/utils/paramsConverter');

describe('SonoffService - paramsConverter', () => {
  it('get params for unkown device', () => {
    const params = paramsConverter(-1);

    expect(params).to.be.lengthOf(0);
  });

  it('get params for Sonoff Basic', () => {
    const params = paramsConverter(1);

    expect(params).to.be.lengthOf(1);
    expect(params).deep.eq([
      {
        name: 'model',
        value: 'basic',
      },
    ]);
  });

  it('get params for Sonoff Pow', () => {
    const params = paramsConverter(8);

    expect(params).to.be.lengthOf(1);
    expect(params).deep.eq([
      {
        name: 'model',
        value: 'pow',
      },
    ]);
  });

  it('get params for Sonoff Plug S2x', () => {
    const params = paramsConverter(6);

    expect(params).to.be.lengthOf(1);
    expect(params).deep.eq([
      {
        name: 'model',
        value: 's26',
      },
    ]);
  });
});
