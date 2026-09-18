/**
 * Two community integrations can display the same name (two repositories
 * publishing a manifest with the same name, or two dev installs of the same
 * integration): those are the only ones that carry their technical identity
 * next to their name, so the common case stays readable. Built-in integrations
 * have unique names, and are told apart from community ones by the "community"
 * tag displayed next to them.
 *
 * Integrations are described by:
 * - slug: identity of the integration, the key of the returned map
 * - name: name to display, before disambiguation
 * - external: true for a community integration
 * - discriminant: technical identity, appended to the name when needed
 *
 * @param {Array} integrations - Listed integrations, duplicates allowed.
 * @returns {Map} Name to display, by integration slug.
 */
function disambiguateIntegrationNames(integrations) {
  // names are compared lowercased: two manifests differing only by case read
  // as the same name in the list
  const slugsByName = new Map();
  integrations.forEach(integration => {
    if (integration && integration.external) {
      const key = integration.name.toLowerCase();
      const slugs = slugsByName.get(key) || new Set();
      slugs.add(integration.slug);
      slugsByName.set(key, slugs);
    }
  });
  const nameBySlug = new Map();
  integrations.forEach(integration => {
    if (!integration || nameBySlug.has(integration.slug)) {
      return;
    }
    const isDuplicated = integration.external && slugsByName.get(integration.name.toLowerCase()).size > 1;
    nameBySlug.set(
      integration.slug,
      isDuplicated ? `${integration.name} (${integration.discriminant})` : integration.name
    );
  });
  return nameBySlug;
}

export default disambiguateIntegrationNames;
