/**
 * @description Transform Todoist's flat list of projects into a tree.
 *
 * @param {Object} projects - Raw Todoist project list.
 * @returns {Object[]} - Tree of projects.
 * @example
 * generateProjectsTree([])
 */
function generateProjectsTree(projects) {
  const rootProjects = [];
  const projectsByParentId = {};

  for (let index = 0; index < projects.length; index += 1) {
    const project = projects[index];
    if ('parent_id' in project) {
      projectsByParentId[project.parent_id] = projectsByParentId[project.parent_id] || [];
      projectsByParentId[project.parent_id].push(project);
    } else {
      rootProjects.push(project);
    }
  }

  /**
   * @description Take one project and recursively add children.
   * @param {Object} project - Raw Todoist project.
   * @example
   * getProjectWithChildren(project)
   */
  function getProjectWithChildren(project) {
    const { id, name } = project;
    return {
      id,
      name,
      children: (projectsByParentId[project.id] || []).map(getProjectWithChildren),
    };
  }

  return rootProjects.map(getProjectWithChildren);
}

module.exports = { generateProjectsTree };
