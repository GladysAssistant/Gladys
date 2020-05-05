import { MarkupText } from 'preact-i18n';

const marginTop20px = {
  marginTop: '20px'
};

const EmptyState = ({ children, ...props }) => (
  <div
    style={{
      width: '60%',
      maxWidth: '400px',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: '100px',
      textAlign: 'center'
    }}
  >
    <img
      src="/assets/images/undraw_personalization.svg"
      style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'block'
      }}
    />
    <p style={marginTop20px}>
      <MarkupText id="dashboard.boxes.devicesInRoom.noDevices" />
    </p>
  </div>
);

export default EmptyState;
