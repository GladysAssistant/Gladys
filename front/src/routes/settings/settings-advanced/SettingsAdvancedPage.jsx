import SettingsLayout from '../SettingsLayout';

const AdvancedPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="card">
      <h3 class="card-header">Advanced</h3>
      <div class="card-body">
        <h4>Domain</h4>
        <h4>HTTPS</h4>
      </div>
    </div>
  </SettingsLayout>
);

export default AdvancedPage;
