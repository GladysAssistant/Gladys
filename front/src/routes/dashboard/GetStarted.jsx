import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import style from './style.css';

// First-run checklist replacing the bare "your dashboard is empty" message:
// a gamified getting-started panel whose steps reflect the real state of the
// instance (devices paired, dashboard composed, scenes created, household
// invited) and link straight to the place where each step gets done.
const STEP_TINTS = {
  devices: 'getStartedTintBlue',
  dashboard: 'getStartedTintAmber',
  scenes: 'getStartedTintGreen',
  users: 'getStartedTintPurple'
};

class GetStarted extends Component {
  state = {
    devicesDone: false,
    scenesDone: false,
    usersDone: false
  };

  loadProgress = async () => {
    // each probe fails soft: an unreachable endpoint only leaves its step
    // unchecked, it never breaks the dashboard. Each one only asks "is there
    // at least one?": the device list is feature-expanded server-side and is
    // unbounded without `take`, and this panel shows on every widget-less
    // dashboard — not only on first run — so an established house would pull
    // its whole device graph just to tick a checkbox
    const [devices, scenes, users] = await Promise.all([
      this.props.httpClient.get('/api/v1/device', { take: 1, skip: 0 }).catch(() => []),
      this.props.httpClient.get('/api/v1/scene', { take: 1, skip: 0 }).catch(() => []),
      this.props.httpClient.get('/api/v1/user').catch(() => [])
    ]);
    if (this.unmounted) {
      return;
    }
    this.setState({
      devicesDone: Array.isArray(devices) && devices.length > 0,
      scenesDone: Array.isArray(scenes) && scenes.length > 0,
      usersDone: Array.isArray(users) && users.length > 1
    });
  };

  componentDidMount() {
    this.loadProgress();
  }

  componentWillUnmount() {
    // the probes are in flight: navigating away before they land must not
    // setState on a gone component
    this.unmounted = true;
  }

  render({ dashboardListEmpty, editDashboard }, { devicesDone, scenesDone, usersDone }) {
    // the panel only shows while the current dashboard has no widget, so the
    // dashboard step is always the pending one — create it, or fill it
    const steps = [
      {
        key: 'devices',
        icon: 'fe-cpu',
        done: devicesDone,
        href: '/dashboard/integration',
        titleId: 'dashboard.getStarted.devicesTitle',
        textId: 'dashboard.getStarted.devicesText'
      },
      dashboardListEmpty
        ? {
            key: 'dashboard',
            icon: 'fe-layout',
            done: false,
            href: '/dashboard/create/new',
            // first-run entry point to dashboard creation (Cypress clicks it)
            dataCy: 'get-started-create-dashboard',
            titleId: 'dashboard.getStarted.dashboardCreateTitle',
            textId: 'dashboard.getStarted.dashboardCreateText'
          }
        : {
            key: 'dashboard',
            icon: 'fe-layout',
            done: false,
            onClick: editDashboard,
            dataCy: 'get-started-fill-dashboard',
            titleId: 'dashboard.getStarted.dashboardFillTitle',
            textId: 'dashboard.getStarted.dashboardFillText'
          },
      {
        key: 'scenes',
        icon: 'fe-play',
        done: scenesDone,
        href: '/dashboard/scene',
        titleId: 'dashboard.getStarted.scenesTitle',
        textId: 'dashboard.getStarted.scenesText'
      },
      {
        key: 'users',
        icon: 'fe-users',
        done: usersDone,
        href: '/dashboard/settings/user',
        titleId: 'dashboard.getStarted.usersTitle',
        textId: 'dashboard.getStarted.usersText'
      }
    ];
    const doneCount = steps.filter(step => step.done).length;
    return (
      <div class={style.getStarted}>
        <div class="card">
          <div class={cx('card-body', style.getStartedBody)}>
            <div class={style.getStartedHeader}>
              <h2 class={style.getStartedTitle}>
                <Text id="dashboard.getStarted.title" />
              </h2>
              <p class={style.getStartedSubtitle}>
                <Text id="dashboard.getStarted.subtitle" />
              </p>
            </div>
            <div class={style.getStartedProgressRow}>
              <div class={style.getStartedProgressTrack}>
                <div class={style.getStartedProgressFill} style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </div>
              <span class={style.getStartedProgressLabel}>
                <Text id="dashboard.getStarted.progress" fields={{ done: doneCount, total: steps.length }} />
              </span>
            </div>
            <div class={style.getStartedSteps}>
              {steps.map(step => {
                const content = [
                  <span
                    class={cx(style.getStartedStepIcon, {
                      [style[STEP_TINTS[step.key]]]: !step.done,
                      [style.getStartedStepIconDone]: step.done
                    })}
                  >
                    <i class={cx('fe', step.done ? 'fe-check' : step.icon)} />
                  </span>,
                  <span class={style.getStartedStepBody}>
                    <span class={style.getStartedStepTitle}>
                      <Text id={step.titleId} />
                    </span>
                    <span class={style.getStartedStepText}>
                      <Text id={step.textId} />
                    </span>
                  </span>,
                  <i class={cx('fe', 'fe-chevron-right', style.getStartedChevron)} />
                ];
                const stepClass = cx(style.getStartedStep, { [style.getStartedStepDone]: step.done });
                return step.href ? (
                  <Link key={step.key} href={step.href} class={stepClass} data-cy={step.dataCy}>
                    {content}
                  </Link>
                ) : (
                  <button key={step.key} type="button" onClick={step.onClick} class={stepClass} data-cy={step.dataCy}>
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(GetStarted);
