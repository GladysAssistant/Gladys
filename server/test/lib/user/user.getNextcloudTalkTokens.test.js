const { expect } = require('chai');

const User = require('../../../lib/user');

describe('user.getNextcloudTalkTokens', () => {
  const user = new User();
  it('should return all Nextcloud tokens', async () => {
    const tokens = await user.getNextcloudTalkTokens();
    expect(tokens).to.deep.equal(['a1b2d3']);
  });
});
