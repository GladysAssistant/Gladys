import { h } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import Select from 'react-select';
import cx from 'classnames';
import style from './style.css';
import { DEVICE_FEATURE_UNITS_BY_CATEGORY } from '../../../../../server/utils/constants';
import { DEFAULT_COLORS } from './ApexChartComponent';

const MORE_OR_LESS_OPTIONS = {
  'without': <Text id="dashboard.boxes.chart.editTreshold.moreOrLess.withoutLabel" />,
  'more': <Text id="dashboard.boxes.chart.editTreshold.moreOrLess.moreLabel" />,
  'less': <Text id="dashboard.boxes.chart.editTreshold.moreOrLess.lessLabel" />,
  'moreOrLess': <Text id="dashboard.boxes.chart.editTreshold.moreOrLess.moreOrLessLabel" />,
  'manual': <Text id="dashboard.boxes.chart.editTreshold.moreOrLess.manualLabel" />,
};

const ManualThresholdForm = ({
  index,
  manualThresholdDetail,
  colorOptions,
  colorSelectorStyles,
  updateManualThresholdDetail,
  deleteManualThreshold,
  closeFlyout
}) => {
  const isManualMoreOrLess = manualThresholdDetail.more_or_less === 'manual';
  const isWithoutMoreOrLess = !manualThresholdDetail.more_or_less || manualThresholdDetail.more_or_less === 'without';
  return (
    <div class={cx('card', style.flyoutStyle)}>
      <label>
        <Text id="dashboard.boxes.chart.editManualThresholdLabel" />
        <br />
        <Text id="dashboard.boxes.chart.editManualThresholdDescription" />
        <br />
        <Text id="dashboard.boxes.chart.editManualThresholdDescription2" />
        <br />
        <Text id="dashboard.boxes.chart.editManualThresholdDescription3" />
      </label>
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
              {isWithoutMoreOrLess &&
                <Text id="dashboard.boxes.chart.editTreshold.valueLabel" />
              }
              {isManualMoreOrLess &&
                <Text id="dashboard.boxes.chart.editTreshold.valueManualLabel" />
              }
              {!isManualMoreOrLess && !isWithoutMoreOrLess &&
                <Text id="dashboard.boxes.chart.editTreshold.valueMoreOrLessLabel" />
              }
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
              <Text id="dashboard.boxes.chart.editTreshold.moreOrLessLabel" />
            </label>
            <select
              type="text"
              value={manualThresholdDetail.more_or_less}
              onChange={e => updateManualThresholdDetail(index, 'more_or_less', e.target.value)}
              class="form-control"
            >
              {Object.keys(MORE_OR_LESS_OPTIONS).map(option => (
                <Localizer>
                  <option value={option}>
                    <Text id={`dashboard.boxes.chart.editTreshold.moreOrLess.${option}`} />
                  </option>
                </Localizer>
              ))}
            </select>
          </div>
        </div>
        <div class="col-md-6">
          {!isWithoutMoreOrLess && (
            <div className="form-group">
              <label>
                {isManualMoreOrLess &&
                  <Text id="dashboard.boxes.chart.editTreshold.maxValueManualLabel" />
                }
                {!isManualMoreOrLess &&
                  <Text id="dashboard.boxes.chart.editTreshold.maxValueMoreOrLessLabel" />
                }
              </label>
              <input
                type="text"
                className="form-control"
                value={manualThresholdDetail.value_more_or_less}
                onBlur={e => updateManualThresholdDetail(index, 'value_more_or_less', e.target.value)}
              />
            </div>
          )}
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
      <div class="row">
        <div class="col-md-6">
          <button id={`validate_manual_threshold_${index}`} className="btn btn-primary w-100" onClick={closeFlyout}>
            <Text id="dashboard.boxes.chart.editTreshold.validateButton" />
          </button>
        </div>
        <div class="col-md-6">
          <button className="btn btn-danger w-100" onClick={() => deleteManualThreshold(index)}>
            <Text id="dashboard.boxes.chart.editTreshold.deleteButton" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualThresholdForm;
