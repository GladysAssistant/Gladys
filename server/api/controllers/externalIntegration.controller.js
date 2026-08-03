const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { BadParameters, NotFoundError } = require('../../utils/coreErrors');
const { USER_ROLE } = require('../../utils/constants');

// Manifest type of the integrations a non-admin user can act on: they link
// their own account on a communication integration, exactly like on the
// native Telegram/Nextcloud Talk services.
const COMMUNICATION_TYPE = 'communication';

/**
 * @description True when the request is made by an admin user.
 * @param {object} req - The Express request.
 * @returns {boolean} True when the user is an admin.
 * @example
 * if (isAdmin(req)) { ... }
 */
function isAdmin(req) {
  return Boolean(req.user && req.user.role === USER_ROLE.ADMIN);
}

/**
 * @description True when the integration is a communication integration, the
 * only family a non-admin user has access to.
 * @param {object} integration - The external integration.
 * @returns {boolean} True for a communication integration.
 * @example
 * if (isCommunicationIntegration(integration)) { ... }
 */
function isCommunicationIntegration(integration) {
  return Boolean(integration.manifest) && integration.manifest.type === COMMUNICATION_TYPE;
}

/**
 * @description Public view of an external integration, for a non-admin user.
 * A non-admin only needs to link their own account on a communication
 * integration: they get the display data (status + manifest, which is the
 * public description published by the store), never the runtime fields of
 * the install — the resolved `docker_image`, the containers state, and above
 * all the webhook URLs, which embed the Gladys Plus Open API key. Note that
 * the manifest itself carries the image reference published by the developer
 * (`manifest.docker_image`): it is public store data, not an instance secret.
 * @param {object} integration - The external integration.
 * @returns {object} The reduced integration.
 * @example
 * res.json(toNonAdminView(integration));
 */
function toNonAdminView(integration) {
  return {
    id: integration.id,
    name: integration.name,
    selector: integration.selector,
    status: integration.status,
    store_slug: integration.store_slug,
    manifest: integration.manifest,
  };
}

module.exports = function ExternalIntegrationController(gladys) {
  /**
   * @api {get} /api/v1/external_integration getAll
   * @apiName getAll
   * @apiGroup ExternalIntegration
   * @apiSuccessExample {json} Success-Example
   * [
   *   {
   *     "id": "57ae1702-c071-483a-b532-384a507c1f04",
   *     "name": "ext-dev-open-meteo-demo",
   *     "selector": "ext-dev-open-meteo-demo",
   *     "status": "RUNNING",
   *     "version": "1.2.0",
   *     "docker_image": "ghcr.io/john/gladys-open-meteo-demo:1.2.0",
   *     "store_slug": null,
   *     "manifest": {},
   *     "update_available": false
   *   }
   * ]
   * @apiDescription A non-admin user only gets the installed communication
   * integrations, in their reduced view: that is what the frontend catalog
   * displays to them, so they can link their own account.
   */
  async function getAll(req, res) {
    const integrations = await gladys.externalIntegration.get();
    if (!isAdmin(req)) {
      res.json(integrations.filter(isCommunicationIntegration).map(toNonAdminView));
      return;
    }
    res.json(integrations);
  }

  /**
   * @api {get} /api/v1/external_integration/:selector getBySelector
   * @apiName getBySelector
   * @apiGroup ExternalIntegration
   * @apiDescription A non-admin user gets the reduced view (manifest and
   * status only): the account linking screen needs nothing more, and the
   * operational fields must not leak (the webhook URLs embed the Gladys
   * Plus Open API key). A device integration answers the very same `404`
   * as an unknown selector, the same rule as the list: probing selectors
   * must not reveal an install a non-admin has no business seeing.
   */
  async function getBySelector(req, res) {
    const integration = await gladys.externalIntegration.getBySelector(req.params.selector);
    if (!isAdmin(req)) {
      if (!isCommunicationIntegration(integration)) {
        // the exact error of an unknown selector: a non-admin cannot tell
        // "it exists but it is not for you" from "it does not exist"
        throw new NotFoundError('EXTERNAL_INTEGRATION_NOT_FOUND');
      }
      res.json(toNonAdminView(integration));
      return;
    }
    const containers = await gladys.externalIntegration.getSubContainersState(integration);
    res.json({
      ...integration,
      update_available: gladys.externalIntegration.isUpdateAvailable(integration),
      connection_status: gladys.externalIntegration.getConnectionStatus(integration.id),
      started_at: await gladys.externalIntegration.getContainerStartedAt(integration),
      docs: gladys.externalIntegration.getDocsUrls(integration),
      webhooks: await gladys.externalIntegration.getWebhooks(integration),
      containers,
    });
  }

  /**
   * @api {get} /api/v1/external_integration/hardware getHardware
   * @apiName getHardware
   * @apiGroup ExternalIntegration
   * @apiDescription Best-effort detection of the hardware access classes on
   * the host; feeds the switches of the install screen.
   * @apiSuccessExample {json} Success-Example
   * { "classes": [{ "class": "coral-usb", "detected": true }] }
   */
  async function getHardware(req, res) {
    const detectedClasses = await gladys.system.detectHardwareClasses();
    res.json({
      classes: detectedClasses.map(({ class: hardwareClass, detected }) => ({ class: hardwareClass, detected })),
    });
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/hardware setHardware
   * @apiName setHardware
   * @apiGroup ExternalIntegration
   * @apiDescription Complete list of granted hardware classes (replaces the
   * previous one; classes not requested by the manifest -> 422). The
   * affected sub-containers are recreated and the integration is notified
   * (hardware-updated).
   */
  async function setHardware(req, res) {
    const integration = await gladys.externalIntegration.setGrantedDevices(
      req.params.selector,
      req.body.granted_devices,
    );
    const containers = await gladys.externalIntegration.getSubContainersState(integration);
    res.json({
      ...integration,
      update_available: gladys.externalIntegration.isUpdateAvailable(integration),
      containers,
    });
  }

  /**
   * @api {post} /api/v1/external_integration install
   * @apiName install
   * @apiGroup ExternalIntegration
   * @apiDescription Three install modes: { store_slug } (from the store),
   * { repo_url } (from a GitHub repo URL, indexed or not) or
   * { docker_image, manifest } (dev mode, without a repo).
   */
  async function install(req, res) {
    const {
      store_slug: storeSlug,
      repo_url: repoUrl,
      docker_image: dockerImage,
      manifest,
      granted_devices: grantedDevices,
    } = req.body;
    let integration;
    if (storeSlug) {
      integration = await gladys.externalIntegration.installFromStore(storeSlug, { grantedDevices });
    } else if (repoUrl) {
      integration = await gladys.externalIntegration.installFromRepoUrl(repoUrl, { grantedDevices });
    } else if (dockerImage) {
      integration = await gladys.externalIntegration.install({ dockerImage, manifest, grantedDevices });
    } else {
      throw new BadParameters('store_slug, repo_url or docker_image is required');
    }
    res.status(201).json(integration);
  }

  /**
   * @api {get} /api/v1/external_integration/store getStore
   * @apiName getStore
   * @apiGroup ExternalIntegration
   * @apiDescription The store catalog from the server index cache, with
   * search and the installed / update available / compatible flags.
   */
  async function getStore(req, res) {
    const catalog = await gladys.externalIntegration.getCatalog({ search: req.query.search });
    res.json(catalog);
  }

  /**
   * @api {post} /api/v1/external_integration/store/refresh refreshStore
   * @apiName refreshStore
   * @apiGroup ExternalIntegration
   * @apiDescription Re-download the store index on demand. An unreachable
   * store is not an error: the cached catalog is returned with
   * `refreshed: false`, so the caller can say so instead of claiming the
   * catalog is up to date.
   */
  async function refreshStore(req, res) {
    const catalog = await gladys.externalIntegration.refreshCatalog();
    res.json(catalog);
  }

  /**
   * @api {get} /api/v1/external_integration/store/docs getStoreDocs
   * @apiName getStoreDocs
   * @apiGroup ExternalIntegration
   * @apiDescription The re-hosted documentation markdown of a store
   * integration, resolved from the index cache (404 when the integration
   * has no doc), so the frontend renders it instead of linking to a raw
   * .md file.
   */
  async function getStoreDocs(req, res) {
    if (!req.query.store_slug) {
      throw new BadParameters('store_slug is required');
    }
    const docs = await gladys.externalIntegration.getDocsMarkdown(req.query.store_slug, req.query.lang);
    res.json(docs);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/update update
   * @apiName update
   * @apiGroup ExternalIntegration
   * @apiDescription Pull the new image and recreate the container (the
   * previous integration token is invalidated).
   */
  async function update(req, res) {
    const integration = await gladys.externalIntegration.update(req.params.selector);
    res.json(integration);
  }

  /**
   * @api {get} /api/v1/external_integration/:selector/discovered_device getDiscoveredDevices
   * @apiName getDiscoveredDevices
   * @apiGroup ExternalIntegration
   * @apiDescription In-memory list of the supervisor, with the "created" flag.
   */
  async function getDiscoveredDevices(req, res) {
    const devices = await gladys.externalIntegration.getDiscoveredDevices(req.params.selector);
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/scan scan
   * @apiName scan
   * @apiGroup ExternalIntegration
   * @apiDescription Relay a scan-request to the integration (400 if the
   * integration is disconnected).
   */
  async function scan(req, res) {
    await gladys.externalIntegration.requestScan(req.params.selector);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/external_integration/:selector/config getConfig
   * @apiName getConfig
   * @apiGroup ExternalIntegration
   * @apiDescription Secrets are always null; configured_secrets says if
   * they are set.
   */
  async function getConfig(req, res) {
    const config = await gladys.externalIntegration.getConfigForFront(req.params.selector);
    res.json(config);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/config saveConfig
   * @apiName saveConfig
   * @apiGroup ExternalIntegration
   * @apiDescription Validated against the manifest config_schema (422
   * otherwise), then pushed to the integration (config-updated). A secret
   * set to null means unchanged.
   */
  async function saveConfig(req, res) {
    const config = await gladys.externalIntegration.saveConfigFromFront(req.params.selector, req.body.config);
    res.json(config);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/oauth/authorize_url getOAuthAuthorizeUrl
   * @apiName getOAuthAuthorizeUrl
   * @apiGroup ExternalIntegration
   * @apiDescription Relay of the oauth.get-authorize-url WS command: the
   * integration builds the authorize URL itself (the Gladys server knows no
   * provider). 400 when the field is not oauth2 or the integration is
   * disconnected.
   */
  async function getOAuthAuthorizeUrl(req, res) {
    const result = await gladys.externalIntegration.getOAuthAuthorizeUrl(req.params.selector, req.body);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/oauth/callback oauthCallback
   * @apiName oauthCallback
   * @apiGroup ExternalIntegration
   * @apiDescription Relay of the provider redirect (code + state) to the
   * integration, which verifies the state and exchanges the tokens. An
   * explicit failure of the integration comes back as a 422 with its
   * message.
   */
  async function oauthCallback(req, res) {
    const result = await gladys.externalIntegration.relayOAuthCallback(req.params.selector, req.body);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/action/:key runAction
   * @apiName runAction
   * @apiGroup ExternalIntegration
   * @apiDescription Run an action declared in the manifest: the form values
   * are validated against the action fields (422 otherwise), relayed over
   * WebSocket and acked within the timeout declared by the action. 404 on
   * an undeclared key, 400 when the integration is disconnected, 422 with
   * the integration message on an explicit failure.
   */
  async function runAction(req, res) {
    const result = await gladys.externalIntegration.runAction(req.params.selector, req.params.key, req.body.fields);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/start start
   * @apiName start
   * @apiGroup ExternalIntegration
   */
  async function start(req, res) {
    const integration = await gladys.externalIntegration.start(req.params.selector);
    res.json(integration);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/stop stop
   * @apiName stop
   * @apiGroup ExternalIntegration
   */
  async function stop(req, res) {
    const integration = await gladys.externalIntegration.stop(req.params.selector);
    res.json(integration);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/restart restart
   * @apiName restart
   * @apiGroup ExternalIntegration
   */
  async function restart(req, res) {
    const integration = await gladys.externalIntegration.restart(req.params.selector);
    res.json(integration);
  }

  /**
   * @api {get} /api/v1/external_integration/:selector/logs getLogs
   * @apiName getLogs
   * @apiGroup ExternalIntegration
   */
  async function getLogs(req, res) {
    const logs = await gladys.externalIntegration.getLogs(req.params.selector, req.query.lines, req.query.container);
    res.json({ logs });
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/link_code createLinkCode
   * @apiName createLinkCode
   * @apiGroup ExternalIntegration
   * @apiDescription Generate a short link code for the current user
   * ("Link my account" on a communication integration page). Single use,
   * 15 minutes TTL; the user sends it to the bot in the external channel.
   */
  async function createLinkCode(req, res) {
    const result = await gladys.externalIntegration.createLinkCode(req.params.selector, req.user.id);
    res.json(result);
  }

  /**
   * @api {get} /api/v1/external_integration/:selector/contact getOwnContact
   * @apiName getOwnContact
   * @apiGroup ExternalIntegration
   * @apiDescription The link state of the CURRENT user on this
   * communication integration (each user only sees their own account).
   */
  async function getOwnContact(req, res) {
    const integration = await gladys.externalIntegration.getBySelector(req.params.selector);
    const contact = await gladys.externalIntegration.getContactForUser(integration, req.user.id);
    res.json({
      linked: contact !== null,
      contact_id: contact ? contact.contact_id : null,
      contact_name: contact ? contact.contact_name : null,
      linked_at: contact ? contact.linked_at : null,
    });
  }

  /**
   * @api {delete} /api/v1/external_integration/:selector/contact unlinkOwnContact
   * @apiName unlinkOwnContact
   * @apiGroup ExternalIntegration
   * @apiDescription Revoke the link of the CURRENT user (each user unlinks
   * their own account).
   */
  async function unlinkOwnContact(req, res) {
    await gladys.externalIntegration.unlinkContact(req.params.selector, req.user.id);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/external_integration/:selector/contact_profile getOwnContactProfile
   * @apiName getOwnContactProfile
   * @apiGroup ExternalIntegration
   * @apiDescription The "My account" values of the CURRENT user on a
   * send-only communication integration (contact_schema): secrets are never
   * echoed back, only the configured flags.
   */
  async function getOwnContactProfile(req, res) {
    const integration = await gladys.externalIntegration.getBySelector(req.params.selector);
    const profile = await gladys.externalIntegration.getContactProfileForFront(integration, req.user.id);
    res.json(profile);
  }

  /**
   * @api {post} /api/v1/external_integration/:selector/contact_profile saveOwnContactProfile
   * @apiName saveOwnContactProfile
   * @apiGroup ExternalIntegration
   * @apiDescription Save the "My account" values of the CURRENT user
   * (partial merge validated against the contact_schema; a secret set to
   * null means unchanged).
   */
  async function saveOwnContactProfile(req, res) {
    const integration = await gladys.externalIntegration.getBySelector(req.params.selector);
    const profile = await gladys.externalIntegration.saveContactProfile(integration, req.user.id, req.body.values);
    res.json(profile);
  }

  /**
   * @api {delete} /api/v1/external_integration/:selector/contact_profile deleteOwnContactProfile
   * @apiName deleteOwnContactProfile
   * @apiGroup ExternalIntegration
   * @apiDescription Delete the "My account" values of the CURRENT user: the
   * revocation gesture of a notification channel. Idempotent.
   */
  async function deleteOwnContactProfile(req, res) {
    const integration = await gladys.externalIntegration.getBySelector(req.params.selector);
    await gladys.externalIntegration.deleteContactProfile(integration, req.user.id);
    res.json({ success: true });
  }

  /**
   * @api {delete} /api/v1/external_integration/:selector destroy
   * @apiName destroy
   * @apiGroup ExternalIntegration
   * @apiDescription Removes everything: container, devices, config
   * variables and the t_service row.
   */
  async function destroy(req, res) {
    await gladys.externalIntegration.uninstall(req.params.selector);
    res.json({ success: true });
  }

  return Object.freeze({
    getAll: asyncMiddleware(getAll),
    getBySelector: asyncMiddleware(getBySelector),
    getHardware: asyncMiddleware(getHardware),
    setHardware: asyncMiddleware(setHardware),
    getStore: asyncMiddleware(getStore),
    refreshStore: asyncMiddleware(refreshStore),
    getStoreDocs: asyncMiddleware(getStoreDocs),
    install: asyncMiddleware(install),
    update: asyncMiddleware(update),
    getDiscoveredDevices: asyncMiddleware(getDiscoveredDevices),
    scan: asyncMiddleware(scan),
    getConfig: asyncMiddleware(getConfig),
    saveConfig: asyncMiddleware(saveConfig),
    getOAuthAuthorizeUrl: asyncMiddleware(getOAuthAuthorizeUrl),
    oauthCallback: asyncMiddleware(oauthCallback),
    runAction: asyncMiddleware(runAction),
    start: asyncMiddleware(start),
    stop: asyncMiddleware(stop),
    restart: asyncMiddleware(restart),
    getLogs: asyncMiddleware(getLogs),
    createLinkCode: asyncMiddleware(createLinkCode),
    getOwnContact: asyncMiddleware(getOwnContact),
    unlinkOwnContact: asyncMiddleware(unlinkOwnContact),
    getOwnContactProfile: asyncMiddleware(getOwnContactProfile),
    saveOwnContactProfile: asyncMiddleware(saveOwnContactProfile),
    deleteOwnContactProfile: asyncMiddleware(deleteOwnContactProfile),
    destroy: asyncMiddleware(destroy),
  });
};
