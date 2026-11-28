const { expect } = require('chai');

const plug = require('../../../../../services/matter-bridge/lib/adapters/plug');
const { createMatter, feature, createContext } = require('../../fakes');

describe('Matter bridge plug adapter', () => {
  const binary = feature('plug-binary', 'switch', 'binary');

  it('should expose each writable switch as its own plug', () => {
    const second = feature('plug-2', 'switch', 'binary');
    const readOnly = feature('plug-3', 'switch', 'binary', { read_only: true });
    expect(plug.claim([binary, second, readOnly, feature('x', 'switch', 'power')])).to.deep.equal([
      { binary },
      { binary: second },
    ]);
  });

  it('should build a plug and convert its states', () => {
    const { type, state } = plug.build(createMatter(), { binary }, createContext({ 'plug-binary': 1 }));
    expect(type.name).to.equal('OnOffPlugInUnitDevice');
    expect(state).to.deep.equal({ onOff: { onOff: true } });
    expect(plug.toMatter('binary', 0)).to.deep.equal({ onOff: { onOff: false } });
    expect(plug.listeners[0].toGladys({ onOff: { onOff: true } })).to.equal(1);
    expect(plug.listeners[0].toGladys({ onOff: { onOff: false } })).to.equal(0);
  });
});
