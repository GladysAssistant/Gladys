// A camera declaring GLADYS_CAMERA_STREAM_PROTOCOL=webrtc: the browser negotiates the live view and
// Gladys only relays the SDP offer and answer. The camera's cloud is out of reach in CI, so the
// three WebRTC routes are stubbed, and RTCPeerConnection is replaced by a fake that records what
// the camera box does with it and plays a canvas track as the camera's video.
describe('Dashboard camera box WebRTC live view', () => {
  const serverUrl = Cypress.env('serverUrl');
  const CAMERA = 'webrtc-doorbell';
  const OFFER = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\na=candidate:1 1 udp 2122260223 203.0.113.7 54321 typ srflx\r\n';
  const ANSWER = 'v=0\r\no=- 3 4 IN IP4 0.0.0.0\r\n';
  // a 1x1 png: the still image the box shows before the live view and falls back to
  const IMAGE =
    'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

  const setLanguage = language =>
    cy.request({
      method: 'PATCH',
      url: `${serverUrl}/api/v1/me`,
      body: { language }
    });

  const installFakePeerConnection = win => {
    win.fakePeerConnections = [];
    class FakePeerConnection {
      constructor(configuration) {
        this.configuration = configuration;
        this.transceivers = [];
        this.iceGatheringState = 'new';
        this.connectionState = 'new';
        this.closed = false;
        win.fakePeerConnections.push(this);
      }

      addTransceiver(kind, init) {
        this.transceivers.push({ kind, direction: init.direction });
      }

      addEventListener() {}

      removeEventListener() {}

      async createOffer() {
        return { type: 'offer', sdp: OFFER };
      }

      async setLocalDescription(description) {
        this.localDescription = description;
        // every candidate is in the offer: the gathering is over at once
        this.iceGatheringState = 'complete';
      }

      async setRemoteDescription(description) {
        this.remoteDescription = description;
        const canvas = win.document.createElement('canvas');
        const [track] = canvas.captureStream().getVideoTracks();
        this.ontrack({ track });
        this.connectionState = 'connected';
      }

      close() {
        this.closed = true;
      }
    }
    win.RTCPeerConnection = FakePeerConnection;
  };

  // Holds every device request of the camera until the returned release is called: the protocol is
  // then certainly unknown when Play is pressed, whatever the speed of the CI machine
  const holdCameraDeviceRequests = () => {
    let release;
    const released = new Cypress.Promise(resolve => {
      release = resolve;
    });
    cy.intercept({ method: 'GET', pathname: `/api/v1/device/${CAMERA}` }, req =>
      released.then(() => req.continue())
    ).as('getCamera');
    return () => release();
  };

  beforeEach(() => {
    cy.login();
    setLanguage('en');

    cy.createDevice(
      {
        name: 'Doorbell',
        external_id: 'webrtc-doorbell',
        selector: CAMERA,
        features: [
          {
            name: 'Doorbell image',
            category: 'camera',
            type: 'image',
            external_id: 'webrtc-doorbell-image',
            selector: 'webrtc-doorbell-image',
            read_only: false,
            keep_history: false,
            has_feedback: false,
            min: 0,
            max: 0
          }
        ],
        params: [{ name: 'GLADYS_CAMERA_STREAM_PROTOCOL', value: 'webrtc' }]
      },
      'example'
    );

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [[{ type: 'camera', name: 'Front door', camera: CAMERA }], [], []]
      }
    });

    cy.intercept({ method: 'GET', pathname: `/api/v1/camera/${CAMERA}/image` }, { body: IMAGE }).as('getImage');
    cy.intercept({ method: 'POST', pathname: `/api/v1/camera/${CAMERA}/webrtc/ping` }, { body: { success: true } });
    cy.intercept({ method: 'POST', pathname: `/api/v1/camera/${CAMERA}/webrtc/stop` }, { body: { success: true } }).as(
      'stopWebRtc'
    );
  });

  afterEach(() => {
    setLanguage(Cypress.env('language'));
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  const visitDashboard = () => {
    cy.visit('/dashboard/test', { onBeforeLoad: installFakePeerConnection });
    cy.wait('@getImage');
    cy.get('.card img.card-img-top').should('be.visible');
  };

  it('negotiates the live view through Gladys and stops it on pause', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/v1/camera/${CAMERA}/webrtc/start` },
      { body: { session_id: 'session-1', sdp_answer: ANSWER } }
    ).as('startWebRtc');
    visitDashboard();

    cy.get('.card-options .fe-airplay').click();

    // the offer leaves once the ICE gathering is over, every candidate inlined
    cy.wait('@startWebRtc')
      .its('request.body')
      .should('deep.equal', { sdp: OFFER });
    cy.window().then(win => {
      const [peerConnection] = win.fakePeerConnections;
      expect(peerConnection.transceivers).to.deep.equal([
        { kind: 'video', direction: 'recvonly' },
        { kind: 'audio', direction: 'recvonly' }
      ]);
      expect(peerConnection.configuration.iceServers).to.have.length.greaterThan(0);
    });
    cy.window()
      .its('fakePeerConnections.0.remoteDescription')
      .should('deep.equal', { type: 'answer', sdp: ANSWER });
    cy.get('.card video').should($video => {
      expect($video[0].srcObject).to.not.equal(null);
      expect($video[0].srcObject.getVideoTracks()).to.have.length(1);
    });

    cy.get('.card-options .fe-pause').click();
    cy.wait('@stopWebRtc')
      .its('request.body')
      .should('deep.equal', { session_id: 'session-1' });
    cy.window()
      .its('fakePeerConnections.0.closed')
      .should('equal', true);
    cy.get('.card img.card-img-top').should('be.visible');
  });

  it('negotiates in WebRTC even when Play is pressed before the camera is loaded', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/v1/camera/${CAMERA}/webrtc/start` },
      { body: { session_id: 'session-2', sdp_answer: ANSWER } }
    ).as('startWebRtc');
    cy.intercept({ method: 'POST', pathname: '/api/v1/service/rtsp-camera/**' }, { statusCode: 500, body: {} }).as(
      'rtspCamera'
    );
    const releaseCamera = holdCameraDeviceRequests();
    cy.visit('/dashboard/test', { onBeforeLoad: installFakePeerConnection });

    // the protocol is unknown: Play must load the camera first, not fall back to rtsp-camera
    cy.get('.card-options .fe-airplay').click();
    cy.then(releaseCamera);

    cy.wait('@startWebRtc')
      .its('request.body')
      .should('deep.equal', { sdp: OFFER });
    cy.get('@rtspCamera.all').should('have.length', 0);
  });

  it('does not start a live view left while the camera was still loading', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/v1/camera/${CAMERA}/webrtc/start` },
      { body: { session_id: 'session-3', sdp_answer: ANSWER } }
    ).as('startWebRtc');
    const releaseCamera = holdCameraDeviceRequests();
    cy.visit('/dashboard/test', { onBeforeLoad: installFakePeerConnection });

    cy.get('.card-options .fe-airplay').click();
    // the user leaves (tab hidden, page closed) before the camera is known
    cy.window().then(win => win.dispatchEvent(new win.Event('pagehide')));
    cy.then(releaseCamera);
    // one request: the HttpClient shares the box's in-flight GET with the one Play asked for
    cy.wait('@getCamera');
    cy.get('@startWebRtc.all').should('have.length', 0);
    cy.window()
      .its('fakePeerConnections')
      .should('have.length', 0);

    // a new Play on the loaded camera starts one live view: the abandoned attempt started none
    cy.get('.card-options .fe-airplay').click();
    cy.wait('@startWebRtc');
    cy.get('@startWebRtc.all').should('have.length', 1);
    cy.window()
      .its('fakePeerConnections')
      .should('have.length', 1);
  });

  it('falls back to the still image with a clear message when the camera refuses', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/v1/camera/${CAMERA}/webrtc/start` },
      { statusCode: 400, body: { status: 400, code: 'BAD_REQUEST', message: 'EXTERNAL_INTEGRATION_COMMAND_TIMEOUT' } }
    ).as('startWebRtc');
    visitDashboard();

    cy.get('.card-options .fe-airplay').click();
    cy.wait('@startWebRtc');

    cy.contains('.alert-warning', 'The live video could not be started with this camera').should('be.visible');
    cy.get('.card img.card-img-top').should('be.visible');
    cy.get('.card video').should('not.exist');
    cy.window()
      .its('fakePeerConnections.0.closed')
      .should('equal', true);
  });
});
