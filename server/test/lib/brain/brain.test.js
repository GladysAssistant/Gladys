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
  it('should add room, then get room by exact match', async () => {
    await brain.addNamedEntity('room', '7beb1245-15b2-4808-b555-40bcc6e3900a', 'salon');
    const id = brain.getEntityIdByName('room', 'salon');
    expect(id).to.equal('7beb1245-15b2-4808-b555-40bcc6e3900a');
  });
  it('should add room, then get room (normalized)', async () => {
    await brain.addNamedEntity('room', '7beb1245-15b2-4808-b555-40bcc6e3900a', 'SALON');
    const id = brain.getEntityIdByName('room', 'Salon');
    expect(id).to.equal('7beb1245-15b2-4808-b555-40bcc6e3900a');
  });
  it('should fail to get room (not found)', async () => {
    await brain.addNamedEntity('room', '7beb1245-15b2-4808-b555-40bcc6e3900a', 'SALON');
    const id = brain.getEntityIdByName('room', 'KDFLMSKFMLSDFKL');
    expect(id).to.equal(undefined);
  });
  it('should get unknown entity', async () => {
    const id = brain.getEntityIdByName('totototo', 'KDFLMSKFMLSDFKL');
    expect(id).to.equal(undefined);
  });
  it('should add scene, then get scene (normalized)', async () => {
    brain.addNamedEntity('scene', 'cinema-mode', 'Cinema mode');
    brain.addNamedEntity('scene', 'cinema-2', 'cinema mode 2');
    const id = brain.getEntityIdByName('scene', 'cinema MODE');
    expect(id).to.equal('cinema-mode');
  });
  it('should add scene, then get scene normalized even with a big mistake', async () => {
    brain.addNamedEntity('scene', 'coucher', 'Coucher de soleil');
    const id = brain.getEntityIdByName('scene', 'Couche de solei');
    expect(id).to.equal('coucher');
  });
});
