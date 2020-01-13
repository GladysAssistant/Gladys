import Select from 'react-select';

const TelegramSendParams = ({ children, ...props }) => (
  <div>
    <div class="form-group">
      <label class="form-label">
        User <span class="form-required">*</span>
      </label>
      <Select
        options={
          props.sceneParamsData &&
          props.sceneParamsData.users.map(user => ({
            value: user.selector,
            label: user.firstname
          }))
        }
      />
    </div>
    <div class="form-group">
      <label class="form-label">
        Telegram message <span class="form-required">*</span>
      </label>
      <textarea class="form-control" value={props.action.text} placeholder="Text" />
    </div>
    <div class="form-group">
      <label class="form-label">Join file</label>
      <Select
        isClearable
        options={[
          {
            value: 'camera',
            label: `Kitchen's camera`
          }
        ]}
      />
    </div>
  </div>
);

export default TelegramSendParams;
