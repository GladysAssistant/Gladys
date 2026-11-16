// The "give your feedback" links open a pre-filled topic in the
// "Configuration" category of the community forum: on every integration page
// (topic about that integration) and in the profile menu (topic about Gladys).
const FORUM_NEW_TOPIC_URL = 'https://community.gladysassistant.com/new-topic';

const readTopic = href => {
  const url = new URL(href);
  return {
    base: `${url.origin}${url.pathname}`,
    title: url.searchParams.get('title'),
    body: url.searchParams.get('body'),
    category: url.searchParams.get('category')
  };
};

describe('Forum feedback links', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Should open a feedback topic about the integration of the page', () => {
    const i18n = Cypress.env('i18n');
    cy.visit('/dashboard/integration/communication/telegram');
    cy.get('[data-cy="integration-feedback-link"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .invoke('attr', 'href')
      .then(href => {
        const topic = readTopic(href);
        expect(topic.base).to.equal(FORUM_NEW_TOPIC_URL);
        expect(topic.category).to.equal('configuration');
        expect(topic.title).to.equal(
          i18n.feedback.subjectTopicTitle.replace('{{subject}}', i18n.integration.telegram.title)
        );
        // the version replaces its placeholder, the rest of the body is the template
        const [beforeVersion, afterVersion] = i18n.feedback.topicBody.split('{{version}}');
        expect(topic.body.startsWith(beforeVersion)).to.equal(true);
        expect(topic.body.endsWith(afterVersion)).to.equal(true);
        expect(topic.body).to.match(/v\d+\.\d+\.\d+/);
      });
  });

  it('Should open a feedback topic about Gladys from the profile menu', () => {
    const i18n = Cypress.env('i18n');
    cy.visit('/dashboard');
    cy.get('[data-cy="header-feedback-link"]')
      .should('have.attr', 'target', '_blank')
      .invoke('attr', 'href')
      .then(href => {
        const topic = readTopic(href);
        expect(topic.base).to.equal(FORUM_NEW_TOPIC_URL);
        expect(topic.category).to.equal('configuration');
        expect(topic.title).to.equal(i18n.feedback.generalTopicTitle);
      });
  });
});
