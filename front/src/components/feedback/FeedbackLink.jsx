import { Text, withText } from 'preact-i18n';
import { getFrontVersion } from '../../utils/instanceVersion';
import { buildForumFeedbackUrl } from '../../utils/forumFeedback';

// A link that opens a pre-filled "give your feedback" topic on the community
// forum (see utils/forumFeedback). With a `subject` (the integration whose
// page the user is on), the topic is about it; without one, it is about
// Gladys in general. The version goes in the body so the team knows which
// release the feedback is about, and the "Sent from Gladys" signature tells
// those topics apart on the forum (that is how the team can count them).

const FeedbackAnchor = ({ topicTitle, topicBody, className, dataCy, children }) => (
  <a
    href={buildForumFeedbackUrl({ title: topicTitle, body: topicBody })}
    target="_blank"
    rel="noopener noreferrer"
    class={className}
    data-cy={dataCy}
  >
    {children}
  </a>
);

// Second step: the topic title and body, translated in the user's language,
// with the subject name and the version as fields.
const FeedbackAnchorWithTopic = withText(({ subjectName }) => ({
  topicTitle: subjectName ? (
    <Text id="feedback.subjectTopicTitle" fields={{ subject: subjectName }} />
  ) : (
    <Text id="feedback.generalTopicTitle" />
  ),
  topicBody: <Text id="feedback.topicBody" fields={{ version: getFrontVersion() }} />
}))(FeedbackAnchor);

// First step: the subject as a plain string. The integration pages give their
// title as a <Text /> node, which withText resolves; an external integration
// gives its display name as a string, used as is (withText would take a
// string for a translation key).
const isTextNode = node => Boolean(node) && node.type === Text;

const ResolveSubject = ({ subject, subjectText, ...props }) => (
  <FeedbackAnchorWithTopic {...props} subjectName={typeof subject === 'string' ? subject : subjectText} />
);

const FeedbackLink = withText(({ subject }) => (isTextNode(subject) ? { subjectText: subject } : {}))(ResolveSubject);

export default FeedbackLink;
