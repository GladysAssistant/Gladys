/**
 * @description Return the Docker image name of the running Gladys container.
 * Used to launch a short-lived helper container from the SAME image (which
 * already ships the `dbus-send` client), so no extra image needs to be pulled.
 * @returns {Promise<string>} Resolve with the image reference (e.g. `gladysassistant/gladys:v4`).
 * @example
 * const image = await system.getGladysImageName();
 */
async function getGladysImageName() {
  const containerId = await this.getGladysContainerId();
  const containerDescription = await this.inspectContainer(containerId);
  return containerDescription.Config.Image;
}

module.exports = {
  getGladysImageName,
};
