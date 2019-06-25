import { Text } from 'preact-i18n';
import { DASHBOARD_BOX_TYPE_LIST } from '../../../../server/utils/constants';

const addBox = (addBoxFunction, x) => () => {
  addBoxFunction(x);
};

const updateNewSelectedBox = (updateNewSelectedBoxFunction, x) => e => {
  updateNewSelectedBoxFunction(x, e.target.value);
};

const marginBottom30px = {
  marginBottom: '30px'
};

const EditAddBoxButton = ({ children, ...props }) => (
  <div class="row" style={marginBottom30px}>
    <div class="col-8">
      <select onChange={updateNewSelectedBox(props.updateNewSelectedBox, props.x)} class="form-control">
        <option>-------</option>
        {DASHBOARD_BOX_TYPE_LIST.map(dashboardBoxType => (
          <option value={dashboardBoxType}>
            <Text id={'dashboard.boxTitle.' + dashboardBoxType} />
          </option>
        ))}
      </select>
    </div>
    <div class="col-4">
      <button onClick={addBox(props.addBox, props.x, props.type)} class="btn btn-block btn-outline-primary">
        <i class="fe fe-plus" />
      </button>
    </div>
  </div>
);

export default EditAddBoxButton;
