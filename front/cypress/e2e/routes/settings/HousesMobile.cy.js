// Houses and rooms on a phone (docs/specs/mobile-pages/house-and-rooms.md)
describe('Houses on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const houseName = 'Phone House';
  const houseSelector = 'phone-house';
  const newHouseName = 'Cabin By The Lake';
  const newHouseSelector = 'cabin-by-the-lake';

  const deleteHouse = selector =>
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/house/${selector}`, failOnStatusCode: false });

  // Each visit gets its own URL: a test may end with the editor open, which holds an entry of the
  // same URL in the history, and the next test must start from a page loaded anew.
  let visits = 0;
  const visitHouses = options => {
    visits += 1;
    cy.visit(`/dashboard/settings/house?visit=${visits}`, options);
    cy.get('[data-cy=houses-mobile], [aria-controls^=house-panel]').should('exist');
  };

  // The position of the phone, answered by the test: a plain replacement on the window of the
  // page (nothing to restore when the test ends, the window is gone)
  const stubGeolocation = getCurrentPosition => win => {
    Object.defineProperty(win.navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
  };

  const openHouse = () => {
    visitHouses();
    cy.contains('[data-cy=house-row]', houseName).click();
    cy.get('[data-cy=house-edit-mobile]').should('be.visible');
  };

  const roomRow = name => cy.contains('[data-cy=house-room-row]', name);

  before(() => {
    cy.login();
    deleteHouse(houseSelector);
    deleteHouse(newHouseSelector);
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/house`,
      body: { name: houseName }
    });
    ['Kitchen', 'Office'].forEach(name =>
      cy.request({ method: 'POST', url: `${serverUrl}/api/v1/house/${houseSelector}/room`, body: { name } })
    );
  });

  beforeEach(() => {
    cy.login();
    cy.viewport('iphone-x');
  });

  after(() => {
    cy.login();
    deleteHouse(houseSelector);
    deleteHouse(newHouseSelector);
  });

  it('should list the houses as rows and open one in a focus view', () => {
    visitHouses();
    cy.get('[data-cy=houses-mobile]').should('be.visible');
    cy.contains('[data-cy=house-row]', houseName)
      .should('contain', '2 rooms')
      .i18n('housesSettings.summary.notLocated');
    cy.get('[data-cy=houses-search]').should('have.css', 'font-size', '16px');

    cy.contains('[data-cy=house-row]', houseName).click();
    cy.get('[data-cy=house-edit-mobile]').should('be.visible');
    // the editor takes the place of the list and of the settings menu
    cy.get('[data-cy=houses-mobile]').should('not.exist');
    cy.get('[data-cy=house-name]')
      .should('have.value', houseName)
      .and('have.css', 'font-size', '16px');
    cy.get('[data-cy=house-room-row]').should('have.length', 2);
    cy.get('[data-cy=house-save]').should('be.disabled');
    // nothing scrolls sideways
    cy.document().then(doc => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });

    // nothing changed: the back control leaves without asking
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=houses-mobile]').should('be.visible');
    cy.get('[data-cy=house-leave-confirm]').should('not.exist');
  });

  it('should rename, delete with undo and add rooms, then save them with the house', () => {
    cy.intercept({ method: 'PATCH', url: `${serverUrl}/api/v1/house/${houseSelector}` }).as('saveHouse');
    cy.intercept({ method: 'PATCH', url: `${serverUrl}/api/v1/room/*` }).as('renameRoom');
    cy.intercept({ method: 'DELETE', url: `${serverUrl}/api/v1/room/*` }).as('deleteRoom');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/house/${houseSelector}/room` }).as('createRoom');
    openHouse();

    // rename: applied when the sheet is validated, refused when the name is taken
    roomRow('Office').click();
    cy.get('[data-cy=house-room-sheet]').should('be.visible');
    cy.get('[data-cy=house-room-name]').clear();
    cy.get('[data-cy=house-room-name]').type('Kitchen');
    cy.get('[data-cy=house-room-sheet] [data-cy=sheet-ok]').click();
    cy.get('[data-cy=house-room-sheet]').i18n('housesSettings.mobile.roomNameTaken');
    cy.get('[data-cy=house-room-name]').clear();
    cy.get('[data-cy=house-room-name]').type('Study');
    cy.get('[data-cy=house-room-sheet] [data-cy=sheet-ok]').click();
    cy.get('[data-cy=house-room-sheet]').should('not.exist');
    roomRow('Study').should('exist');

    // delete, undo, delete again
    roomRow('Kitchen').click();
    cy.get('[data-cy=house-room-delete]').click();
    cy.get('[data-cy=house-room-row]').should('have.length', 1);
    cy.get('[data-cy=house-room-deleted-toast]').should('contain', 'Kitchen');
    cy.get('[data-cy=house-room-deleted-toast] [data-cy=mobile-toast-action]').click();
    cy.get('[data-cy=house-room-row]').should('have.length', 2);
    roomRow('Kitchen').click();
    cy.get('[data-cy=house-room-delete]').click();
    cy.get('[data-cy=house-room-row]').should('have.length', 1);

    // add: a suggestion in one tap, and a room by its name
    cy.get('[data-cy=house-add-room]').click();
    cy.get('[data-cy=house-add-room-sheet]').should('be.visible');
    cy.contains('[data-cy=room-suggestion]', 'Living room').click();
    cy.contains('[data-cy=room-suggestion]', 'Living room').should('have.attr', 'aria-pressed', 'true');
    cy.contains('[data-cy=room-suggestion]', 'Garage').click();
    // a suggestion is a toggle
    cy.contains('[data-cy=room-suggestion]', 'Garage').click();
    cy.contains('[data-cy=room-suggestion]', 'Garage').should('have.attr', 'aria-pressed', 'false');
    cy.get('[data-cy=house-new-room-name]').type('Study');
    cy.get('[data-cy=house-new-room-add]').click();
    cy.get('[data-cy=house-add-room-sheet]').i18n('housesSettings.mobile.roomNameTaken');
    cy.get('[data-cy=house-new-room-name]').clear();
    cy.get('[data-cy=house-new-room-name]').type('Workshop');
    cy.get('[data-cy=house-new-room-add]').click();
    cy.get('[data-cy=house-new-room-name]').should('have.value', '');
    cy.get('[data-cy=house-add-room-sheet] [data-cy=sheet-ok]').click();
    cy.get('[data-cy=house-room-row]').should('have.length', 3);

    cy.get('[data-cy=house-edit-bottom-bar]').i18n('mobileKit.unsavedChanges');
    cy.get('[data-cy=house-save]').click();
    cy.wait('@saveHouse')
      .its('response.statusCode')
      .should('eq', 200);
    cy.wait('@renameRoom')
      .its('request.body')
      .should('deep.equal', { name: 'Study' });
    cy.wait('@deleteRoom')
      .its('response.statusCode')
      .should('eq', 200);
    cy.wait('@createRoom');
    cy.wait('@createRoom');
    cy.get('[data-cy=houses-toast]').i18n('mobileKit.saved');
    cy.get('[data-cy=house-save]').should('be.disabled');

    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/house?expand=rooms` }).then(res => {
      const house = res.body.find(candidate => candidate.selector === houseSelector);
      expect(house.rooms.map(room => room.name).sort()).to.deep.equal(['Living room', 'Study', 'Workshop']);
    });
  });

  it('should locate the house from the phone, from an address and from the map sheet', () => {
    cy.intercept({ method: 'PATCH', url: `${serverUrl}/api/v1/house/${houseSelector}` }).as('saveHouse');
    cy.intercept(
      { method: 'GET', url: 'https://nominatim.openstreetmap.org/search*' },
      { body: [{ place_id: 42, display_name: '10 Main Street, Springfield', lat: '39.7817', lon: '-89.6501' }] }
    ).as('searchAddress');
    visitHouses({
      onBeforeLoad: stubGeolocation(onSuccess => onSuccess({ coords: { latitude: 48.8583, longitude: 2.2945 } }))
    });
    cy.contains('[data-cy=house-row]', houseName).click();
    cy.get('[data-cy=house-location-status]').i18n('housesSettings.mobile.positionNotSet');

    cy.get('[data-cy=house-locate-me]').click();
    cy.get('[data-cy=house-location-status]').i18n('housesSettings.mobile.positionSet');

    cy.get('[data-cy=address-search-input]').type('10 main street{enter}');
    cy.wait('@searchAddress');
    cy.contains('[data-cy=address-search-results] button', '10 Main Street, Springfield').click();
    cy.get('[data-cy=address-search-results]').should('not.exist');

    // the map of the page is a preview: the pin is moved on the map of a sheet
    cy.get('[data-cy=house-map-open]').click();
    cy.get('[data-cy=house-map-sheet]').should('be.visible');
    cy.get('[data-cy=house-map-sheet] .leaflet-container').should('be.visible');
    cy.get('[data-cy=house-map-sheet] [data-cy=sheet-ok]').click();
    cy.get('[data-cy=house-map-sheet]').should('not.exist');

    cy.get('[data-cy=house-save]').click();
    cy.wait('@saveHouse').then(({ request, response }) => {
      expect(response.statusCode).to.eq(200);
      expect(request.body.latitude).to.eq(39.7817);
      expect(request.body.longitude).to.eq(-89.6501);
    });
  });

  it('should tell why the position of the phone cannot be used', () => {
    visitHouses({ onBeforeLoad: stubGeolocation((onSuccess, onError) => onError({ code: 1 })) });
    cy.contains('[data-cy=house-row]', houseName).click();
    cy.get('[data-cy=house-locate-me]').click();
    cy.get('[data-cy=house-locate-me-error]').i18n('housesSettings.mobile.locationError.denied');
  });

  it('should refuse an invalid alarm code and reveal the code on demand', () => {
    openHouse();
    cy.get('[data-cy=house-alarm-code]')
      .should('have.attr', 'inputmode', 'numeric')
      .and('have.attr', 'type', 'password');
    cy.get('[data-cy=house-alarm-code]').type('12');
    cy.get('[data-cy=house-edit-mobile]').i18n('signup.configureHouse.alarmCodeError');
    cy.get('[data-cy=house-save]').should('be.disabled');
    cy.get('[data-cy=house-alarm-code]').type('34');
    cy.get('[data-cy=house-save]').should('not.be.disabled');
    cy.get('[data-cy=house-alarm-code-reveal]').click();
    cy.get('[data-cy=house-alarm-code]')
      .should('have.attr', 'type', 'text')
      .and('have.value', '1234');
  });

  it('should ask before leaving with unsaved changes, with the back control and the system back', () => {
    openHouse();
    cy.get('[data-cy=house-name]').clear();
    cy.get('[data-cy=house-name]').type('Renamed House');
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=house-leave-confirm]').should('be.visible');
    cy.get('[data-cy=house-leave-keep-editing]').click();
    cy.get('[data-cy=house-leave-confirm]').should('not.exist');
    cy.get('[data-cy=house-edit-mobile]').should('be.visible');

    // the system "back" does not leave the settings: the editor stays and asks too
    cy.go('back');
    cy.get('[data-cy=house-leave-confirm]').should('be.visible');
    cy.get('[data-cy=house-leave-discard]').click();
    cy.get('[data-cy=houses-mobile]').should('be.visible');
    cy.location('pathname').should('eq', '/dashboard/settings/house');
    // the edits are dropped: the house is the one of the server again
    cy.contains('[data-cy=house-row]', houseName).should('exist');
    cy.contains('[data-cy=house-row]', 'Renamed House').should('not.exist');
  });

  it('should create a house from the "+" and delete it after a confirmation', () => {
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/house` }).as('createHouse');
    cy.intercept({ method: 'DELETE', url: `${serverUrl}/api/v1/house/${newHouseSelector}` }).as('deleteHouse');
    visitHouses();
    cy.get('[data-cy=house-row]').should('exist');
    cy.get('[data-cy=houses-add]').click();
    cy.get('[data-cy=house-edit-mobile]').should('be.visible');
    cy.get('[data-cy=house-edit-bottom-bar]').i18n('housesSettings.summary.neverSaved');
    cy.get('[data-cy=house-name]').clear();
    cy.get('[data-cy=house-save]').should('be.disabled');
    cy.get('[data-cy=house-name]').type(newHouseName);
    cy.get('[data-cy=house-add-first-room]').click();
    cy.contains('[data-cy=room-suggestion]', 'Kitchen').click();
    cy.get('[data-cy=house-add-room-sheet] [data-cy=sheet-ok]').click();
    cy.get('[data-cy=house-save]').click();
    cy.wait('@createHouse')
      .its('request.body.name')
      .should('eq', newHouseName);
    cy.get('[data-cy=houses-toast]').i18n('mobileKit.saved');

    cy.get('[data-cy=mobile-nav-back]').click();
    cy.contains('[data-cy=house-row]', newHouseName)
      .should('contain', '1 room')
      .click();
    cy.get('[data-cy=house-delete]').click();
    cy.get('[data-cy=house-delete-confirm]')
      .should('be.visible')
      .and('contain', newHouseName);
    // nothing is deleted on a single tap
    cy.get('[data-cy=house-delete-confirm] [data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=house-edit-mobile]').should('be.visible');
    cy.get('[data-cy=house-delete]').click();
    cy.get('[data-cy=house-delete-confirm] [data-cy=confirm-sheet-confirm]').click();
    cy.wait('@deleteHouse')
      .its('response.statusCode')
      .should('eq', 200);
    cy.get('[data-cy=houses-mobile]').should('be.visible');
    cy.get('[data-cy=houses-toast]').i18n('housesSettings.mobile.houseDeleted');
    cy.contains('[data-cy=house-row]', newHouseName).should('not.exist');
  });

  it('should keep the accordion on a wider screen', () => {
    cy.viewport(1280, 800);
    visitHouses();
    cy.get('[aria-controls^=house-panel]').should('exist');
    cy.get('[data-cy=houses-mobile]').should('not.exist');
    cy.get('[data-cy=house-edit-mobile]').should('not.exist');
  });
});
