const { expect } = require('chai');
const Brain = require('../../../lib/brain');

describe('brain', () => {
  const brain = new Brain();
  it('should train brain', async () => {
    await brain.train();
  });
  it('should classify sentence', async () => {
    const firstQuestionResponse = await brain.classify('Order me a taxi in 5 minutes', 'en');
    const secondQuestionResponse = await brain.classify('Paris', 'en', firstQuestionResponse.context);
    expect(firstQuestionResponse).to.have.property('classification');
    expect(firstQuestionResponse).to.have.property('context');
    expect(secondQuestionResponse).to.have.property('classification');
    expect(secondQuestionResponse).to.have.property('context');
  });
  it('should getReply', async () => {
    brain.getReply('en', 'calendar.next-event.get-location.success', {
      event: {
        location: 'Paris',
        name: 'work',
      },
    });
  });
  it('should add room, then get room', async () => {
    brain.addRoom({ id: '7beb1245-15b2-4808-b555-40bcc6e3900a', name: 'SALON' });
    const id = brain.getEntityIdByName('room', 'Salon');
    expect(id).to.equal('7beb1245-15b2-4808-b555-40bcc6e3900a');
  });
  it('should add room, then get room', async () => {
    brain.addRoom({ id: '7beb1245-15b2-4808-b555-40bcc6e3900a', name: 'SALON' });
    const id = brain.getEntityIdByName('room', 'KDFLMSKFMLSDFKL');
    expect(id).to.equal(undefined);
  });
  it('should get unknown entity', async () => {
    const id = brain.getEntityIdByName('totototo', 'KDFLMSKFMLSDFKL');
    expect(id).to.equal(undefined);
  });
});
