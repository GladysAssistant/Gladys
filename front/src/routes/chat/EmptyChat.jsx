import { Text } from 'preact-i18n';

const Messages = ({}) => (
  <div
    style={{
      width: '40%',
      maxWidth: '200px',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: '60px',
      marginBottom: '60px',
      textAlign: 'center'
    }}
  >
    <img
      src="/assets/images/undraw_typing.svg"
      style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'block'
      }}
    />
    <p
      style={{
        marginTop: '20px'
      }}
    >
      <Text id="chat.emptyStateMessage" />
    </p>
  </div>
);

export default Messages;
