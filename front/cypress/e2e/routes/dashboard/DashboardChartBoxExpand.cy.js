// Enlarged view of the chart box (docs/specs/dashboard-flexible-layout-and-widgets.md, L).
// The history is stubbed — it would need device states in DuckDB — and everything else is the
// real app: the card, its enlarge button, the sheet, the table of the series and the zoom.
const STATES_URL = '**/api/v1/device_feature/aggregated_states*';
const HOUR = 60 * 60 * 1000;
const NB_POINTS = 25;

// Two series over the last 24 hours, one point an hour: the first one climbs from 10 to 34, the
// second one stays at 5 and peaks at 50 in its middle
const buildStates = () => {
  const end = Math.floor(Date.now() / HOUR) * HOUR;
  const buildFeature = (name, valueAt) => ({
    device: { name },
    deviceFeature: { name, selector: name.toLowerCase().replace(' ', '-'), unit: 'celsius' },
    values: Array.from({ length: NB_POINTS }, (unused, index) => ({
      created_at: new Date(end - (NB_POINTS - 1 - index) * HOUR).toISOString(),
      value: valueAt(index)
    }))
  });
  return [buildFeature('Living room', index => 10 + index), buildFeature('Bedroom', index => (index === 12 ? 50 : 5))];
};

const statsOfRow = index =>
  cy
    .get('[data-cy="chart-expanded-stats"] tbody tr')
    .eq(index)
    .find('td')
    .then($cells => [...$cells].map(cell => cell.innerText.trim()));

describe('Dashboard chart box: enlarged view', () => {
  let dashboardSelector;

  beforeEach(() => {
    cy.login();
    cy.intercept('GET', STATES_URL, request => request.reply(buildStates())).as('getStates');
    cy.request({
      method: 'POST',
      url: `${Cypress.env('serverUrl')}/api/v1/dashboard`,
      body: {
        name: 'Chart test',
        type: 'main',
        visibility: 'private',
        boxes: [
          {
            columns: [
              [
                {
                  type: 'chart',
                  chart_type: 'line',
                  title: 'Temperatures',
                  interval: 'last-day',
                  device_features: ['living-room', 'bedroom'],
                  units: ['celsius', 'celsius'],
                  display_variation: true
                }
              ],
              [],
              []
            ]
          }
        ]
      }
    }).then(response => {
      dashboardSelector = response.body.selector;
    });
  });

  afterEach(() => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('serverUrl')}/api/v1/dashboard/${dashboardSelector}`
    });
  });

  const openExpandedView = () => {
    cy.visit(`/dashboard/${dashboardSelector}`);
    cy.wait('@getStates');
    cy.get('[data-cy="chart-expand"]').click();
    cy.get('[data-cy="chart-expanded"]').should('be.visible');
  };

  it('opens on the period of the card, with the statistics of each series', () => {
    openExpandedView();
    // opening costs no request: the view shows what the card holds
    cy.get('@getStates.all').should('have.length', 1);
    cy.get('[data-cy="chart-expanded"]').within(() => {
      cy.contains('Temperatures');
      // the axes are drawn, whatever the card shows
      cy.get('.apexcharts-yaxis').should('exist');
      cy.get('[data-cy="chart-expanded-stats"] tbody tr').should('have.length', 2);
    });
    // min / average / max / last
    statsOfRow(0).should('deep.equal', ['10', '22', '34', '34']);
    statsOfRow(1).should('deep.equal', ['5', '6.80', '50', '5']);
  });

  it('hides a series from its row, but never the last one shown', () => {
    openExpandedView();
    cy.get('[data-cy="chart-expanded"] .apexcharts-series').should('have.length', 2);
    cy.get('[data-cy="chart-expanded-stats"] tbody tr')
      .eq(1)
      .click();
    cy.get('[data-cy="chart-expanded-stats"] tbody tr')
      .eq(1)
      .find('button')
      .should('have.attr', 'aria-pressed', 'false');
    cy.get('[data-cy="chart-expanded"] .apexcharts-series').should('have.length', 1);
    // the last series stays
    cy.get('[data-cy="chart-expanded-stats"] tbody tr')
      .eq(0)
      .click();
    cy.get('[data-cy="chart-expanded-stats"] tbody tr')
      .eq(0)
      .find('button')
      .should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-cy="chart-expanded"] .apexcharts-series').should('have.length', 1);
    // and a hidden one comes back
    cy.get('[data-cy="chart-expanded-stats"] tbody tr')
      .eq(1)
      .click();
    cy.get('[data-cy="chart-expanded"] .apexcharts-series').should('have.length', 2);
  });

  it('shares its period with the card and closes back onto it', () => {
    openExpandedView();
    cy.get('[data-cy="chart-expanded"]')
      .find(`button[aria-label="${Cypress.env('i18n').dashboard.boxes.chart.previousPeriod}"]`)
      .click();
    cy.wait('@getStates')
      .its('request.url')
      .should('include', 'offset=1440');
    cy.get('[data-cy="sheet-close"]').click();
    cy.get('[data-cy="chart-expanded"]').should('not.exist');
    // the keyboard is back on the button that opened the view
    cy.focused().should('have.attr', 'data-cy', 'chart-expand');
    // the card is on the period picked in the view: its "back to now" pill shows
    cy.get(`button[aria-label="${Cypress.env('i18n').dashboard.boxes.chart.backToNow}"]`).should('be.visible');
  });

  it('picks a period from the menu with the keyboard', () => {
    const labels = Cypress.env('i18n').dashboard.boxes.chart;
    openExpandedView();
    cy.get('[data-cy="chart-expanded"]')
      .contains('button', labels.lastDay)
      .click();
    // the rows of the menu are buttons: they take the focus and answer Enter
    cy.get('[data-cy="chart-expanded"]')
      .contains('button', labels.lastSevenDays)
      .focus();
    cy.focused().type('{enter}');
    cy.wait('@getStates')
      .its('request.url')
      .should('include', 'interval=10080');
    cy.get('[data-cy="chart-expanded"]')
      .contains('button', labels.lastSevenDays)
      .should('be.visible');
  });

  it('zooms on a selection: the statistics follow the range, and the pill resets it', () => {
    openExpandedView();
    cy.get('[data-cy="chart-expanded-reset-zoom"]').should('not.exist');
    // a selection over the second half of the period
    cy.get('[data-cy="chart-expanded"] .apexcharts-svg').then($svg => {
      const grid = $svg.find('.apexcharts-grid')[0].getBoundingClientRect();
      const y = grid.top + grid.height / 2;
      const from = { clientX: grid.left + grid.width * 0.6, clientY: y, which: 1, button: 0, force: true };
      const to = { clientX: grid.left + grid.width * 0.9, clientY: y, which: 1, button: 0, force: true };
      cy.wrap($svg).trigger('mousedown', from);
      cy.wrap($svg).trigger('mousemove', { ...from, clientX: from.clientX + 20 });
      cy.wrap($svg).trigger('mousemove', to);
      cy.wrap($svg).trigger('mouseup', to);
    });
    cy.get('[data-cy="chart-expanded-reset-zoom"]').should('be.visible');
    // the climb of the first series is cut at both ends: its minimum went up, its last value down
    statsOfRow(0).should(stats => {
      expect(Number(stats[0])).to.be.greaterThan(10);
      expect(Number(stats[3])).to.be.lessThan(34);
    });
    // the peak of the second series (the middle of the period) is out of the range
    statsOfRow(1).should('deep.equal', ['5', '5', '5', '5']);
    cy.get('[data-cy="chart-expanded-reset-zoom"]').click();
    cy.get('[data-cy="chart-expanded-reset-zoom"]').should('not.exist');
    statsOfRow(0).should('deep.equal', ['10', '22', '34', '34']);
  });

  it('opens as a sheet on a phone, and Escape closes it', () => {
    cy.viewport(390, 844);
    openExpandedView();
    // retried until the sheet is done sliding in
    cy.get('[data-cy="chart-expanded"]').should($sheet => {
      const rect = $sheet[0].getBoundingClientRect();
      // edge to edge, anchored at the bottom of the screen
      expect(rect.width).to.equal(390);
      expect(Math.round(rect.bottom)).to.equal(844);
    });
    cy.get('[data-cy="chart-expanded-stats"] tbody tr').should('have.length', 2);
    cy.get('body').type('{esc}');
    cy.get('[data-cy="chart-expanded"]').should('not.exist');
  });
});
