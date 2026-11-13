// Feedback goes to the community forum (Discourse), never to a Gladys
// server: the button only opens the forum's composer, pre-filled, and the
// user sees, edits and posts the text themself — nothing leaves the instance
// without them. Discourse's /new-topic route reads title, body and category
// from the query string and keeps them through its login page, so a user who
// is not signed in to the forum yet lands back on the same pre-filled
// composer.
const FORUM_NEW_TOPIC_URL = 'https://community.gladysassistant.com/new-topic';

// Slug of the forum's "Configuration" category, where the team wants this
// feedback to land.
const FORUM_FEEDBACK_CATEGORY = 'configuration';

// encodeURIComponent and not URLSearchParams: URLSearchParams encodes spaces
// as "+", which the forum's composer would show as is in the title and body.
const buildForumFeedbackUrl = ({ title, body }) => {
  const params = [
    ['title', title],
    ['body', body],
    ['category', FORUM_FEEDBACK_CATEGORY]
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&');
  return `${FORUM_NEW_TOPIC_URL}?${params}`;
};

export { buildForumFeedbackUrl, FORUM_FEEDBACK_CATEGORY };
