import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../sheet/BottomSheet';
import { MobileGroup, MobileRow, MobileSectionHeader, MobileNotice } from '../mobile/MobileList';
import withIntlAsProp from '../../utils/withIntlAsProp';
import { nameAddedItems } from '../../utils/deviceWidgetNames';
import { getDeviceFeatureName } from '../../utils/device';
import { buildDeviceRows } from '../boxs/device-in-room/device-features/light/lightFeatures';
import {
  findBoxesInSections,
  getBoxInSections,
  getEdgePosition,
  insertBoxInSections,
  replaceBoxInSections
} from '../../utils/dashboardSections';
import { updateDashboardWidgets } from '../../utils/dashboardQuickSave';
import style from './addToDashboard.css';

const getBoxLabel = (dictionary, box) =>
  (box && (box.name || box.title)) || get(dictionary, `dashboard.boxTitle.${box && box.type}`) || '';

// The widgets of a dashboard in reading order, every type: the neighbours named in the hints
const getAllBoxes = sections => {
  const boxes = [];
  (sections || []).forEach(section => section.columns.forEach(column => column.forEach(box => boxes.push(box))));
  return boxes;
};

/**
 * @description "Where to add it?" (docs/specs/dashboard-flexible-layout-and-widgets.md, A.3.2): the
 * second step of adding devices to a dashboard from outside the editor — the "+" of the dashboard
 * dock, the "Add to a dashboard" button of a device. It lists the "devices" widgets of the dashboard
 * (with their size and first rows, to recognize them) and the two usual places of a new one, at the
 * top or at the bottom; a tap saves right away (updateDashboardWidgets) and hands the result to
 * onAdded, which shows the toast. The new rows are named like the rows of the widget they join
 * (nameAddedItems). allowDashboardChoice adds the list of dashboards at the top (from a device page,
 * the user is on none of them).
 */
class AddToDashboardSheet extends Component {
  state = {
    dashboards: null,
    selector: null,
    dashboard: null,
    devices: null,
    loading: false,
    error: null,
    saving: false
  };

  load = async () => {
    const { httpClient, dashboardSelector, allowDashboardChoice } = this.props;
    this.setState({ loading: true, error: null });
    try {
      const [dashboards, devices] = await Promise.all([
        allowDashboardChoice ? httpClient.get('/api/v1/dashboard') : Promise.resolve(null),
        this.props.devices ? Promise.resolve(this.props.devices) : httpClient.get('/api/v1/device')
      ]);
      const selector = dashboardSelector || (dashboards && dashboards.length > 0 ? dashboards[0].selector : null);
      this.setState({ dashboards, devices, selector });
      if (selector) {
        await this.loadDashboard(selector);
      }
      this.setState({ loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: 'load' });
    }
  };

  loadDashboard = async selector => {
    const dashboard = await this.props.httpClient.get(`/api/v1/dashboard/${selector}`);
    // a later choice wins over an earlier one still loading
    if (this.state.selector === selector) {
      this.setState({ dashboard });
    }
  };

  chooseDashboard = async selector => {
    if (selector === this.state.selector) {
      return;
    }
    this.setState({ selector, dashboard: null, error: null });
    try {
      await this.loadDashboard(selector);
    } catch (e) {
      console.error(e);
      this.setState({ error: 'load' });
    }
  };

  getFeaturesBySelector = () => {
    const featuresBySelector = {};
    (this.state.devices || []).forEach(device =>
      (device.features || []).forEach(feature => {
        featuresBySelector[feature.selector] = { device, feature };
      })
    );
    return featuresBySelector;
  };

  // The rows the chosen widget gets: the ones it has, then the new ones, named like their
  // neighbours. A feature already in the widget is not added twice.
  buildDevicesBox = (box, featuresBySelector) => {
    const selectors = get(box, 'device_features') || [];
    // one name per selector, whatever the stored array holds: the new names land at the index of
    // their own selector
    const storedNames = get(box, 'device_feature_names') || [];
    const existing = selectors.map((selector, index) => {
      const entry = featuresBySelector[selector];
      return {
        selector,
        entry,
        name: storedNames[index],
        defaultName: entry ? getDeviceFeatureName(this.props.intl.dictionary, entry.device, entry.feature) : selector
      };
    });
    // a row without a stored name (older widgets) gets the generated label it shows today, as the
    // devices form does: the server only takes strings in device_feature_names
    const names = existing.map(item => item.name || item.defaultName);
    const added = this.props.selectors
      .filter(selector => !selectors.includes(selector) && featuresBySelector[selector])
      .map(selector => ({ selector, entry: featuresBySelector[selector] }));
    nameAddedItems(this.props.intl.dictionary, existing, added);
    return {
      added,
      box: {
        ...(box || { type: 'devices' }),
        device_features: [...selectors, ...added.map(item => item.selector)],
        device_feature_names: [...names, ...added.map(item => item.name)]
      }
    };
  };

  // What the widget shows, the way it shows it: a light is one row (buildDeviceRows), named once
  describeWidget = (box, featuresBySelector) => {
    const selectors = box.device_features || [];
    const names = box.device_feature_names || [];
    const rows = buildDeviceRows(
      selectors.map(selector => {
        const entry = featuresBySelector[selector];
        // a feature whose device is gone keeps a row of its own
        return entry ? { ...entry.feature, device: entry.device } : { selector };
      })
    );
    return {
      count: rows.length,
      names: rows
        .map(row => names[row.index])
        .filter(name => name)
        .slice(0, 3)
        .join(', ')
    };
  };

  addTo = async target => {
    const { dashboard } = this.state;
    if (!dashboard || this.state.saving) {
      return;
    }
    const featuresBySelector = this.getFeaturesBySelector();
    const { box, added } = this.buildDevicesBox(target.box, featuresBySelector);
    // a new widget goes at the top or the bottom of the dashboard as saved now (read again by
    // updateDashboardWidgets), not as it was when the sheet opened
    let position = target.box ? { x: target.x, y: target.y } : null;
    const enqueueSave = this.props.enqueueSave || (task => task());
    this.setState({ saving: true, error: null });
    try {
      const { before, after } = await enqueueSave(() =>
        updateDashboardWidgets(
          this.props.httpClient,
          dashboard.selector,
          sections => {
            if (target.box) {
              return replaceBoxInSections(sections, position.x, position.y, box);
            }
            position = getEdgePosition(sections, target.edge);
            return insertBoxInSections(sections, position.x, position.y, box);
          },
          target.box ? [{ x: target.x, y: target.y, box: target.box }] : []
        )
      );
      this.setState({ saving: false });
      this.props.onAdded({
        before,
        after,
        position,
        added,
        newWidget: !target.box,
        widgetName: target.box ? getBoxLabel(this.props.intl.dictionary, target.box) : null
      });
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, error: e.name === 'DashboardChangedError' ? 'changed' : 'save' });
    }
  };

  componentDidMount() {
    if (this.props.open) {
      this.load();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.load();
    }
  }

  renderDashboards() {
    const { dashboards, selector } = this.state;
    if (!this.props.allowDashboardChoice || !dashboards || dashboards.length < 2) {
      return null;
    }
    return (
      <div class={style.dashboards} role="group" data-cy="add-to-dashboard-dashboards">
        {dashboards.map(dashboard => (
          <button
            type="button"
            key={dashboard.selector}
            class={style.dashboardPill}
            aria-pressed={dashboard.selector === selector ? 'true' : 'false'}
            onClick={() => this.chooseDashboard(dashboard.selector)}
            data-cy={`add-to-dashboard-dashboard-${dashboard.selector}`}
          >
            {dashboard.icon && <i class={`fe fe-${dashboard.icon}`} aria-hidden="true" />}
            {dashboard.name}
          </button>
        ))}
      </div>
    );
  }

  renderTargets() {
    const { dashboard, saving } = this.state;
    const dictionary = this.props.intl.dictionary;
    if (!dashboard) {
      return null;
    }
    const widgets = findBoxesInSections(dashboard.boxes, 'devices');
    const allBoxes = getAllBoxes(dashboard.boxes);
    const first = allBoxes[0];
    // the widget a new one "at the bottom" lands after (getEdgePosition), the last one otherwise
    const bottom = getEdgePosition(dashboard.boxes, 'bottom');
    const last = getBoxInSections(dashboard.boxes, bottom.x, bottom.y - 1) || allBoxes[allBoxes.length - 1];
    const featuresBySelector = this.getFeaturesBySelector();
    return (
      <div>
        {widgets.length > 0 && <MobileSectionHeader title={<Text id="addToDashboard.existingWidgets" />} />}
        {widgets.length > 0 && (
          <MobileGroup>
            {widgets.map(({ x, y, box }) => {
              const selectors = box.device_features || [];
              const { count, names } = this.describeWidget(box, featuresBySelector);
              const already = this.props.selectors.every(selector => selectors.includes(selector));
              return (
                <MobileRow
                  key={`${x}-${y}`}
                  icon="sliders"
                  title={getBoxLabel(dictionary, box)}
                  subtitle={
                    already ? (
                      <Text id="addToDashboard.alreadyThere" />
                    ) : (
                      <span>
                        <Text id="addToDashboard.devicesCount" plural={count} fields={{ count }} />
                        {names && ` · ${names}`}
                      </span>
                    )
                  }
                  disabled={saving || already}
                  onClick={() => this.addTo({ x, y, box })}
                  dataCy={`add-to-dashboard-widget-${x}-${y}`}
                />
              );
            })}
          </MobileGroup>
        )}
        <MobileSectionHeader title={<Text id="addToDashboard.newWidget" />} />
        <MobileGroup>
          <MobileRow
            icon="arrow-up"
            title={<Text id="addToDashboard.top" />}
            subtitle={
              first ? (
                <Text id="addToDashboard.topHint" fields={{ name: getBoxLabel(dictionary, first) }} />
              ) : (
                <Text id="addToDashboard.emptyDashboard" />
              )
            }
            disabled={saving}
            onClick={() => this.addTo({ edge: 'top' })}
            dataCy="add-to-dashboard-top"
          />
          {last && (
            <MobileRow
              icon="arrow-down"
              title={<Text id="addToDashboard.bottom" />}
              subtitle={<Text id="addToDashboard.bottomHint" fields={{ name: getBoxLabel(dictionary, last) }} />}
              disabled={saving}
              onClick={() => this.addTo({ edge: 'bottom' })}
              dataCy="add-to-dashboard-bottom"
            />
          )}
        </MobileGroup>
      </div>
    );
  }

  render(props, { loading, error, dashboards, selector }) {
    const title = get(props.intl.dictionary, 'addToDashboard.title');
    return (
      <BottomSheet
        open={props.open}
        title={title}
        onClose={props.onClose}
        onBack={props.onBack}
        depth={props.depth}
        dataCy="add-to-dashboard-sheet"
      >
        <div class={cx(style.body, { [style.loading]: loading })}>
          {props.summary && <p class={style.summary}>{props.summary}</p>}
          {this.renderDashboards()}
          {error && (
            <MobileNotice tone="danger" icon="alert-triangle" data-cy="add-to-dashboard-error">
              <Text
                id={
                  error === 'changed'
                    ? 'addToDashboard.changedError'
                    : error === 'load'
                    ? 'addToDashboard.loadError'
                    : 'addToDashboard.saveError'
                }
              />
            </MobileNotice>
          )}
          {!loading && !error && dashboards && dashboards.length === 0 && !selector && (
            <MobileNotice icon="info">
              <Text id="addToDashboard.noDashboard" />
            </MobileNotice>
          )}
          {loading && <div class={style.loader} aria-hidden="true" />}
          {!loading && this.renderTargets()}
        </div>
      </BottomSheet>
    );
  }
}

export { getBoxLabel };
export default withIntlAsProp(connect('httpClient', {})(AddToDashboardSheet));
