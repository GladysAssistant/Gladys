/**
 * Transform Todoist's flat list of projects into a tree
 * @param {Object} projects
 */
function generateProjectsTree(projects) {
  let rootProjects = [];
  let projectsByParentId = {};

  for (const project of projects) {
    if ('parent_id' in project) {
      projectsByParentId[project.parent_id] = projectsByParentId[project.parent_id] || [];
      projectsByParentId[project.parent_id].push(project);
    } else {
      rootProjects.push(project);
    }
  }

  function getProjectWithChildren(project) {
    const { id, name } = project;
    return {
      id,
      name,
      children: (projectsByParentId[project.id] || [])
        .map(getProjectWithChildren)
    };
  }

  return rootProjects.map(getProjectWithChildren);
}

module.exports = { generateProjectsTree };
