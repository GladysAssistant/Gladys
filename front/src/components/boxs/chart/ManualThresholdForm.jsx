import { h } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import Select from 'react-select';
import cx from 'classnames';
import style from './style.css';
import { DEVICE_FEATURE_UNITS_BY_CATEGORY } from '../../../../../server/utils/constants';
import { DEFAULT_COLORS } from './ApexChartComponent';

const ManualThresholdForm = ({
  index,
  manualThresholdDetail,
  colorOptions,
  colorSelectorStyles,
  updateManualThresholdDetail,
  deleteManualThreshold
}) => (
  <div class={cx('card', style.flyoutStyle)}>
    <div class="row">
      <div class="col-md-6">
        <div className="form-group">
          <label>
            <Text id="dashboard.boxes.chart.editTreshold.nameLabel" />
          </label>
          <input
            type="text"
            className="form-control"
            value={manualThresholdDetail.name}
            onBlur={e => updateManualThresholdDetail(index, 'name', e.target.value)}
          />
        </div>
      </div>
      <div class="col-md-6">
        <div className="form-group">
          <label>
            <Text id="dashboard.boxes.chart.editTreshold.valueLabel" />
          </label>
          <input
            type="text"
            className="form-control"
            value={manualThresholdDetail.value}
            onBlur={e => updateManualThresholdDetail(index, 'value', e.target.value)}
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.chart.editTreshold.unitLabel" />
          </label>
          <select
            type="text"
            value={manualThresholdDetail.unit}
            onChange={e => updateManualThresholdDetail(index, 'unit', e.target.value)}
            class="form-control"
          >
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {Object.keys(DEVICE_FEATURE_UNITS_BY_CATEGORY).map(category => (
              <Localizer>
                <optgroup label={<Text id={`deviceFeatureCategory.${category}.shortCategoryName`} />}>
                  {DEVICE_FEATURE_UNITS_BY_CATEGORY[category].map(unit => (
                    <option value={unit}>
                      <Text id={`deviceFeatureUnit.${unit}`}>{unit}</Text>
                    </option>
                  ))}
                </optgroup>
              </Localizer>
            ))}
          </select>
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.chart.editTreshold.colorLabel" />
          </label>
          <Select
            defaultValue={colorOptions.find(({ value }) => value === DEFAULT_COLORS)}
            value={
              manualThresholdDetail &&
              manualThresholdDetail.color &&
              colorOptions.find(({ value }) => value === manualThresholdDetail.color)
            }
            onChange={({ value }) => updateManualThresholdDetail(index, 'color', value)}
            options={colorOptions}
            styles={colorSelectorStyles}
          />
        </div>
      </div>
    </div>
    <button className="btn btn-danger w-100" onClick={() => deleteManualThreshold(index)}>
      <Text id="dashboard.boxes.chart.editTreshold.deleteButton" />
    </button>
  </div>
);

export default ManualThresholdForm;
