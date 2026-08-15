import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import dayjs from 'dayjs';

import style from './style.css';

const StateRow = ({ state, ...props }) => {
  const isEditing = props.editingCreatedAt === state.created_at;
  const isDeleting = props.deletingCreatedAt === state.created_at;

  return (
    <tr>
      <td class="text-nowrap">{dayjs(state.created_at).format('DD/MM/YYYY HH:mm:ss')}</td>
      <td>
        {isEditing ? (
          <input
            type="number"
            step="any"
            class={cx('form-control', 'form-control-sm', style.valueInput)}
            value={props.editingValue}
            onInput={props.changeEditValue}
          />
        ) : (
          <span>
            {state.value}
            {props.selectedFeature && props.selectedFeature.unit && (
              <span class="text-muted">
                {' '}
                <Text id={`deviceFeatureUnitShort.${props.selectedFeature.unit}`} />
              </span>
            )}
          </span>
        )}
      </td>
      <td class="text-right text-nowrap">
        {isEditing && (
          <span>
            <button type="button" class="btn btn-sm btn-success mr-1" onClick={props.saveEdit} disabled={props.saving}>
              <Text id="deviceHistory.save" />
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onClick={props.cancelEdit} disabled={props.saving}>
              <Text id="deviceHistory.cancel" />
            </button>
          </span>
        )}
        {isDeleting && (
          <span>
            <span class="mr-2 small text-muted">
              <Text id="deviceHistory.confirmDelete" />
            </span>
            <button
              type="button"
              class="btn btn-sm btn-danger mr-1"
              onClick={props.confirmDelete}
              disabled={props.saving}
            >
              <Text id="deviceHistory.confirmDeleteButton" />
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onClick={props.cancelDelete} disabled={props.saving}>
              <Text id="deviceHistory.cancel" />
            </button>
          </span>
        )}
        {!isEditing && !isDeleting && (
          <span>
            <Localizer>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary mr-1"
                onClick={() => props.startEdit(state)}
                title={<Text id="deviceHistory.edit" />}
              >
                <i class="fe fe-edit-2" />
              </button>
            </Localizer>
            <Localizer>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onClick={() => props.askDelete(state)}
                title={<Text id="deviceHistory.delete" />}
              >
                <i class="fe fe-trash-2" />
              </button>
            </Localizer>
          </span>
        )}
      </td>
    </tr>
  );
};

const DeviceHistoryPage = props => {
  const firstIndex = props.total === 0 ? 0 : props.skip + 1;
  const lastIndex = Math.min(props.skip + props.pageSize, props.total);

  return (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class="page-header">
              <h1 class="page-title">
                <Text id="deviceHistory.title" />
              </h1>
              {props.device && <div class="page-subtitle">{props.device.name}</div>}
              <div class="page-options d-flex">
                <Link href="/dashboard/devices" class="btn btn-outline-secondary">
                  <i class="fe fe-arrow-left mr-1" />
                  <Text id="deviceHistory.backToDevices" />
                </Link>
              </div>
            </div>

            {props.deviceError && (
              <div class="alert alert-danger">
                <Text id="deviceHistory.deviceError" />
              </div>
            )}

            {!props.deviceError && !props.loadingDevice && props.features.length === 0 && (
              <div class="alert alert-info">
                <Text id="deviceHistory.noFeature" />
              </div>
            )}

            {props.features.length > 0 && (
              <div class="card">
                <div class="card-header">
                  <div class={style.filters}>
                    <div class={style.filter}>
                      <label class="form-label" for="device-history-feature">
                        <Text id="deviceHistory.featureLabel" />
                      </label>
                      <select
                        id="device-history-feature"
                        class="form-control custom-select"
                        onChange={props.selectFeature}
                      >
                        {props.features.map(feature => (
                          <option
                            key={feature.selector}
                            value={feature.selector}
                            selected={feature.selector === props.selectedFeatureSelector}
                          >
                            {feature.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div class={style.filter}>
                      <label class="form-label" for="device-history-from">
                        <Text id="deviceHistory.fromLabel" />
                      </label>
                      <input
                        id="device-history-from"
                        type="date"
                        class="form-control"
                        value={props.from}
                        max={props.to}
                        onChange={props.changeFrom}
                      />
                    </div>
                    <div class={style.filter}>
                      <label class="form-label" for="device-history-to">
                        <Text id="deviceHistory.toLabel" />
                      </label>
                      <input
                        id="device-history-to"
                        type="date"
                        class="form-control"
                        value={props.to}
                        min={props.from}
                        onChange={props.changeTo}
                      />
                    </div>
                  </div>
                </div>

                <div
                  class={cx('dimmer', {
                    active: props.loading
                  })}
                >
                  <div class="loader" />
                  <div class={cx('dimmer-content', style.tableContainer)}>
                    {props.error && (
                      <div class="alert alert-danger m-4">
                        <Text id="deviceHistory.error" />
                      </div>
                    )}
                    {props.actionError && (
                      <div class="alert alert-danger m-4">
                        <Text id="deviceHistory.actionError" />
                      </div>
                    )}
                    {props.initialized && !props.error && props.states.length === 0 && (
                      <div class="alert alert-info m-4">
                        <Text id="deviceHistory.emptyState" />
                      </div>
                    )}
                    {props.states.length > 0 && (
                      <div class="table-responsive">
                        <table class="table table-hover table-outline table-vcenter card-table">
                          <thead>
                            <tr>
                              <th>
                                <Text id="deviceHistory.date" />
                              </th>
                              <th>
                                <Text id="deviceHistory.value" />
                              </th>
                              <th class="text-right" />
                            </tr>
                          </thead>
                          <tbody>
                            {props.states.map(state => (
                              <StateRow key={state.created_at} state={state} {...props} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div class={cx('card-footer', style.footer)}>
                  <div class="text-muted small">
                    <Text
                      id="deviceHistory.pagination"
                      fields={{ from: firstIndex, to: lastIndex, total: props.total }}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      class="btn btn-sm btn-secondary mr-1"
                      onClick={props.previousPage}
                      disabled={props.skip === 0 || props.loading}
                    >
                      <Text id="deviceHistory.previous" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-secondary"
                      onClick={props.nextPage}
                      disabled={props.skip + props.pageSize >= props.total || props.loading}
                    >
                      <Text id="deviceHistory.next" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {props.features.length > 0 && (
              <div class="alert alert-info">
                <i class="fe fe-info mr-1" />
                <Text id="deviceHistory.info" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceHistoryPage;
