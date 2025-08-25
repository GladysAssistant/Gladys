import { Text, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';

class EnergyMonitoringPage extends Component {
  state = {
    devices: [],
    loadingDevices: false,
    error: null
  };

  componentDidMount() {
    this.loadDevices();
  }

  async loadDevices() {
    try {
      this.setState({ loadingDevices: true });
      const result = await this.props.httpClient.get('/api/v1/device', {});
      this.setState({ devices: Array.isArray(result) ? result : [], error: null });
    } catch (e) {
      this.setState({ error: e });
    } finally {
      this.setState({ loadingDevices: false });
    }
  }

  getAllFeatures() {
    const flat = [];
    const { devices } = this.state;
    devices.forEach(device => {
      (device.features || [])
        .filter(feature => feature && feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR)
        .forEach(feature => {
          flat.push({ ...feature, __device: device });
        });
    });
    return flat;
  }

  getTree() {
    const allFeatures = this.getAllFeatures();
    const children = new Map();
    allFeatures.forEach(f => {
      children.set(f.id, []);
    });
    const rootFeatures = [];
    allFeatures.forEach(f => {
      const parentId = f.energy_parent_id || null;
      if (parentId && children.has(parentId)) {
        children.get(parentId).push(f);
      } else {
        rootFeatures.push(f);
      }
    });
    return { rootFeatures, childrenById: children, allFeatures };
  }

  async setParentLocal(featureId, newParentId) {
    const { allFeatures } = this.getTree();
    const feature = allFeatures.find(f => f.id === featureId);
    const selector = feature && feature.selector;
    const previousParentId = feature ? feature.energy_parent_id || null : null;

    // optimistic update
    this.setState(({ devices }) => ({
      devices: devices.map(d => ({
        ...d,
        features: (d.features || []).map(f =>
          f.id === featureId ? { ...f, energy_parent_id: newParentId || null } : f
        )
      }))
    }));

    if (selector) {
      try {
        await this.props.httpClient.patch(`/api/v1/device_feature/${selector}`, {
          energy_parent_id: newParentId || null
        });
      } catch (e) {
        // rollback on error
        this.setState(({ devices }) => ({
          devices: devices.map(d => ({
            ...d,
            features: (d.features || []).map(f =>
              f.id === featureId ? { ...f, energy_parent_id: previousParentId } : f
            )
          })),
          error: e
        }));
      }
    }
  }

  render(props, state) {
    const { rootFeatures, childrenById, allFeatures } = this.getTree();
    const { loadingDevices, error } = state;

    const getDescendantIds = id => {
      const stack = [id];
      const visited = new Set();
      visited.add(id);
      const result = new Set();
      while (stack.length) {
        const current = stack.pop();
        const children = childrenById.get(current) || [];
        children.forEach(c => {
          if (!visited.has(c.id)) {
            visited.add(c.id);
            result.add(c.id);
            stack.push(c.id);
          }
        });
      }
      return result;
    };

    const renderFeature = (feature, depth = 0) => {
      const paddingLeft = 8 + depth * 16;
      const label = `${feature.__device ? feature.__device.name : ''} - ${feature.name ||
        feature.selector ||
        feature.id}`;
      const levelColors = ['#5c7cfa', '#40c057', '#fab005', '#fa5252', '#12b886', '#7950f2'];
      const color = levelColors[depth % levelColors.length];
      const descendantIds = getDescendantIds(feature.id);
      return (
        <div class="mb-2" style={{ paddingLeft: `${paddingLeft}px` }}>
          <div class="card shadow-sm" style={{ borderLeft: `4px solid ${color}`, borderRadius: '6px' }}>
            <div class="card-body py-2 px-3">
              <div class="d-flex align-items-center">
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center">
                    <span class="badge mr-2" style={{ background: color, color: '#fff' }}>
                      Lvl {depth}
                    </span>
                    <strong>{label}</strong>
                  </div>
                  <div class="small text-muted mt-1">{feature.selector}</div>
                </div>
                <div style={{ minWidth: '280px' }} class="ml-3">
                  <select
                    class="form-control form-control-sm"
                    value={feature.energy_parent_id || ''}
                    onChange={e => this.setParentLocal(feature.id, e.target.value || null)}
                  >
                    <option value="">
                      <Text id="integration.energyMonitoring.rootNotParent" />
                    </option>
                    {allFeatures
                      .filter(f => f.id !== feature.id && !descendantIds.has(f.id))
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {(f.__device ? `${f.__device.name} - ` : '') + (f.name || f.selector || f.id)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {(childrenById.get(feature.id) || []).map(child => (
            <div key={`${feature.id}-${child.id}`}>{renderFeature(child, depth + 1)}</div>
          ))}
        </div>
      );
    };

    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row">
                <div class="col-lg-3">
                  <h3 class="page-title mb-5">
                    <Text id="integration.energyMonitoring.title" />
                  </h3>
                  <div>
                    <div class="list-group list-group-transparent mb-0">
                      <Link
                        href="/dashboard/integration/device/energy-monitoring"
                        activeClassName="active"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-grid" />
                        </span>
                        <Text id="integration.energyMonitoring.myDevicesTab" />
                      </Link>

                      <Link
                        href="/dashboard/integration/device/energy-monitoring/prices"
                        activeClassName="active"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-dollar-sign" />
                        </span>
                        <Text id="integration.energyMonitoring.energyPriceTab" />
                      </Link>

                      <DeviceConfigurationLink
                        user={props.user}
                        configurationKey="integrations"
                        documentKey="energy-monitoring"
                        linkClass="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-book-open" />
                        </span>
                        <Text id="integration.energyMonitoring.documentation" />
                      </DeviceConfigurationLink>
                    </div>
                  </div>
                </div>

                <div class="col-lg-9">
                  <div class="card">
                    <div class="card-header">
                      <h1 class="card-title">
                        <Text id="integration.energyMonitoring.title" />
                      </h1>
                    </div>
                    <div class="card-body">
                      <div class={cx('dimmer', { active: props.loading || loadingDevices })}>
                        <div class="loader" />
                        <div class="dimmer-content">
                          {error && (
                            <div class="alert alert-danger" role="alert">
                              Error while loading devices.
                            </div>
                          )}

                          {/* Hierarchical device features list */}

                          <p>
                            <Text id="integration.energyMonitoring.hierarchicalListDescription" />
                          </p>
                          <div>
                            {rootFeatures.map(f => (
                              <div key={f.id}>{renderFeature(f, 0)}</div>
                            ))}
                            {rootFeatures.length === 0 && !loadingDevices && (
                              <div class="text-muted">No device features found.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EnergyMonitoringPage;
