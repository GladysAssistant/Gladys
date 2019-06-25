const TelegramSendParams = ({ children, ...props }) => (
  <div>
    <div class="form-group">
      <label class="form-label">
        User <span class="form-required">*</span>
      </label>
      <select class="custom-select" value={props.action.user}>
        {props.sceneParamsData &&
          props.sceneParamsData.users &&
          props.sceneParamsData.users.map(user => <option value={user.selector}>{user.firstname}</option>)}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">
        Telegram message <span class="form-required">*</span>
      </label>
      <input type="text" class="form-control" value={props.action.text} placeholder="Text" />
    </div>
  </div>
);

export default TelegramSendParams;
