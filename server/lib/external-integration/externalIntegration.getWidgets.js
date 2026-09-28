/**
 * @description List the dashboard widgets declared by every installed
 * integration, for the box picker of the dashboard editor (section 2 of
 * capabilities/dashboard-widgets.md). Open to every authenticated user: the
 * declaration (key, label, description, icon, settings) plus ONE operational
 * field, on purpose, `integration_status` — the dashboard cannot show a
 * stopped integration as stopped, never as a spinner, without it. Nothing
 * else operational travels (no version, no update flag, no containers, no
 * config): a deliberate, bounded exception to the non-admin reduced view.
 * @returns {Promise<Array>} The widgets of every installed integration.
 * @example
 * const widgets = await gladys.externalIntegration.getWidgets();
 */
async function getWidgets() {
  const integrations = await this.get();
  const widgets = [];
  integrations.forEach((integration) => {
    const manifest = integration.manifest || {};
    (manifest.widgets || []).forEach((widget) => {
      widgets.push({
        integration_selector: integration.selector,
        integration_name: manifest.name || integration.name,
        integration_status: integration.status,
        key: widget.key,
        label: widget.label,
        description: widget.description,
        icon: widget.icon,
        settings: widget.settings || [],
      });
    });
  });
  return widgets;
}

module.exports = {
  getWidgets,
};
