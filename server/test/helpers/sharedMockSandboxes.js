// Shared mock modules (files under test/ that export fakes consumed by several
// test files) create their fakes in their own per-file sinon sandbox, out of
// reach of the consumers' sinon.reset(). Each of them registers its sandbox
// here, and the global beforeEach in bootstrap.test.js clears every registered
// history in a single hook — one mocha hook instead of one per mock module,
// whose fixed per-hook overhead is measurable over ~5500 tests.
//
// Only call HISTORY is cleared here (resetHistory), never programmed behavior:
// a test that programs behavior (throws/rejects/returns) on a registered
// shared-mock stub must reset() that stub itself in its own afterEach, like
// tuya.connect.test.js does for client.init.
const sandboxes = [];

const registerSharedMockSandbox = (sandbox) => {
  sandboxes.push(sandbox);
};

const resetSharedMockHistories = () => {
  sandboxes.forEach((sandbox) => sandbox.resetHistory());
};

module.exports = {
  registerSharedMockSandbox,
  resetSharedMockHistories,
};
