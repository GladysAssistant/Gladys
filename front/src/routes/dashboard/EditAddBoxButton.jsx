import { Text } from 'preact-i18n';
import get from 'get-value';
import { DASHBOARD_BOX_TYPE_LIST } from '../../../../server/utils/constants';
import Select from '../../components/form/Select';

const addBox = (addBoxFunction, x) => () => {
  addBoxFunction(x);
};

const updateNewSelectedBox = (updateNewSelectedBoxFunction, x) => type => {
  updateNewSelectedBoxFunction(x, get(type, 'value'));
};

const marginBottom = {
  marginBottom: '50px'
};

const EditAddBoxButton = ({ children, ...props }) => (
  <div class="row" style={marginBottom}>
    <div class="col-8">
      <Select
        onChange={updateNewSelectedBox(props.updateNewSelectedBox, props.x)}
        clearable
        options={DASHBOARD_BOX_TYPE_LIST.map(dashboardBoxType => {
          return {
            value: dashboardBoxType,
            label: <Text id={'dashboard.boxTitle.' + dashboardBoxType} />
          };
        })}
      />
    </div>
    <div class="col-4">
      <button onClick={addBox(props.addBox, props.x, props.type)} class="btn btn-block btn-outline-primary">
        <i class="fe fe-plus" />
      </button>
    </div>
  </div>
);

export default EditAddBoxButton;
