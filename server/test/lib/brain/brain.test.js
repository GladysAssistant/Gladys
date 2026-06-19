const { expect } = require('chai');
const Brain = require('../../../lib/brain');

describe('brain', () => {
  const brain = new Brain();

  it('should load answers', async () => {
    await brain.load();
    expect(brain.answers.size).to.be.greaterThan(0);
  });

  it('should getReply', async () => {
    await brain.load();
    const reply = brain.getReply('en', 'calendar.next-event.get-location.success', {
      event: {
        location: 'Paris',
        name: 'work',
      },
    });
    expect(reply).to.be.a('string');
    expect(reply.length).to.be.greaterThan(0);
  });
});
