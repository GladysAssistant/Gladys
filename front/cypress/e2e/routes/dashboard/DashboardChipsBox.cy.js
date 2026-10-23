describe('Dashboard chips ordering', () => {
  const chips = [
    { chip_type: 'openings', label: 'Windows', icon: 'home' },
    { chip_type: 'calendar-next-event', label: 'Collection', calendar_event_name_filter: 'paper', icon: 'calendar' },
    { chip_type: 'calendar-next-event', label: 'Appointments', calendar_event_name_filter: 'doctor' }
  ];
  let selector;

  const openEditor = width => {
    cy.viewport(width, 900);
    cy.visit(`/dashboard/${selector}/edit`);
    cy.get('[data-cy="edit-box-0-0"]').click();
  };

  const expectOrder = labels => {
    cy.get('[data-chip] > .form-group:last-child input').should($inputs => {
      expect(Array.from($inputs, input => input.value)).to.deep.equal(labels);
    });
  };

  const drag = (from, to, after, pointerType, cancel = false) => {
    cy.get(`[data-cy="move-chip-${from}"]`).scrollIntoView();
    cy.get(`[data-cy="move-chip-${from}"]`).then($handle => {
      const handle = $handle[0];
      const win = handle.ownerDocument.defaultView;
      const rect = handle.getBoundingClientRect();
      const options = {
        bubbles: true,
        pointerId: 1,
        pointerType,
        button: 0,
        clientX: rect.x + 10,
        clientY: rect.y + 10
      };
      handle.dispatchEvent(new win.PointerEvent('pointerdown', options));
      win.dispatchEvent(new win.PointerEvent('pointermove', { ...options, clientY: options.clientY + 10 }));
    });
    cy.get('[data-chip]')
      .eq(to)
      .scrollIntoView();
    cy.get('[data-chip]')
      .eq(to)
      .then($target => {
        const target = $target[0];
        const win = target.ownerDocument.defaultView;
        const rect = target.getBoundingClientRect();
        const options = {
          bubbles: true,
          pointerId: 1,
          pointerType,
          clientX: rect.x + 20,
          clientY: after ? rect.bottom - 10 : rect.top + 10
        };
        expect(
          target.ownerDocument.elementFromPoint(options.clientX, options.clientY).closest('[data-chip-list]')
        ).to.equal(target.parentElement);
        win.dispatchEvent(new win.PointerEvent('pointermove', options));
        if (cancel) {
          win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        } else {
          win.dispatchEvent(new win.PointerEvent('pointerup', options));
          // Native gestures end with a click, consumed by the drag engine.
          target.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
        }
      });
    cy.get('.gladys-drag-ghost').should('not.exist');
  };

  beforeEach(() => {
    cy.login();
    cy.request({
      method: 'POST',
      url: `${Cypress.env('serverUrl')}/api/v1/dashboard`,
      body: {
        name: 'Chip ordering',
        type: 'test',
        visibility: 'private',
        boxes: [{ columns: [[{ type: 'chips', chips }]] }]
      }
    }).then(response => {
      selector = response.body.selector;
    });
  });

  afterEach(() => {
    if (selector) {
      cy.request({ method: 'DELETE', url: `${Cypress.env('serverUrl')}/api/v1/dashboard/${selector}` });
      selector = null;
    }
  });

  ['mouse', 'touch'].forEach(pointerType => {
    it(`Reorders with ${pointerType} in both directions and persists complete chip settings`, () => {
      openEditor(pointerType === 'touch' ? 390 : 1280);
      drag(2, 0, false, pointerType);
      expectOrder(['Appointments', 'Windows', 'Collection']);
      drag(0, 1, true, pointerType);
      expectOrder(['Windows', 'Appointments', 'Collection']);
      // A drop in the source slot and an aborted drag leave the order alone.
      drag(1, 1, false, pointerType);
      drag(0, 2, true, pointerType, true);
      expectOrder(['Windows', 'Appointments', 'Collection']);

      cy.intercept('PATCH', '**/api/v1/dashboard/*').as('saveDashboard');
      cy.contains('button', 'dashboard.editDashboardSaveButton').click();
      cy.wait('@saveDashboard')
        .its('request.body.boxes.0.columns.0.0.chips')
        .should('deep.equal', [chips[0], chips[2], chips[1]]);
      cy.get('[data-cy="dashboard-saved-label"]').should('be.visible');
      cy.reload();
      cy.get('[data-cy="edit-box-0-0"]').click();
      expectOrder(['Windows', 'Appointments', 'Collection']);
      cy.contains('button', 'dashboard.editDashboardDoneButton').click();
      cy.get('[class*="chipLabel"]').should($labels => {
        expect(Array.from($labels, label => label.textContent)).to.deep.equal([
          'Windows',
          'Appointments',
          'Collection'
        ]);
      });
      openEditor(pointerType === 'touch' ? 390 : 1280);
      cy.get('[data-cy="move-chip-0"]').trigger('keydown', { key: 'ArrowDown' });
      expectOrder(['Appointments', 'Windows', 'Collection']);
      cy.contains('button', 'dashboard.editDashboardCancelButton').click();
      openEditor(pointerType === 'touch' ? 390 : 1280);
      expectOrder(['Windows', 'Appointments', 'Collection']);
    });
  });

  it('Moves a newly added chip with the keyboard, keeps focus, and edits/removes the right chip', () => {
    openEditor(1280);
    cy.contains('button', 'dashboard.boxes.chips.addChipButton').click();
    cy.get('[data-cy="move-chip-3"]').trigger('keydown', { key: 'ArrowUp' });
    cy.get('[data-chip]')
      .eq(2)
      .find('select')
      .should('have.value', '');
    cy.get('[data-cy="move-chip-2"]')
      .should('have.focus')
      .trigger('keydown', { key: 'ArrowDown' });
    cy.get('[data-chip]')
      .last()
      .find('select')
      .select('calendar-next-event');
    cy.get('[data-chip]')
      .last()
      .find('input')
      .last()
      .type('New chip');
    cy.get('[data-cy="move-chip-3"]').focus();
    cy.focused().trigger('keydown', { key: 'ArrowDown' });
    expectOrder(['Windows', 'Collection', 'Appointments', 'New chip']);
    [2, 1, 0].forEach(index => {
      cy.focused().trigger('keydown', { key: 'ArrowUp' });
      cy.get(`[data-cy="move-chip-${index}"]`).should('have.focus');
      cy.get('[data-chip]')
        .eq(index)
        .find('input')
        .first()
        .should('have.value', '');
    });
    cy.focused().trigger('keydown', { key: 'ArrowUp' });
    expectOrder(['New chip', 'Windows', 'Collection', 'Appointments']);
    cy.get('[data-chip]')
      .first()
      .find('input')
      .last()
      .clear();
    cy.get('[data-chip]')
      .first()
      .find('input')
      .last()
      .type('Renamed');
    cy.get('[data-chip]')
      .eq(2)
      .find('button.btn-outline-danger')
      .click();
    expectOrder(['Renamed', 'Windows', 'Appointments']);
    cy.intercept('PATCH', '**/api/v1/dashboard/*').as('saveDashboard');
    cy.contains('button', 'dashboard.editDashboardSaveButton').click();
    cy.wait('@saveDashboard')
      .its('request.body.boxes.0.columns.0.0.chips')
      .should('deep.equal', [{ chip_type: 'calendar-next-event', label: 'Renamed' }, chips[0], chips[2]]);
  });
});
