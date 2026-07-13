import Select from 'react-select';

// Wrapper around React Select that renders the dropdown menu in document.body via a portal.
// This prevents clipping by any ancestor with overflow: auto/hidden (e.g. the canvas config panel).
const SceneSelect = props => (
  <Select menuPortalTarget={typeof document !== 'undefined' ? document.body : null} menuPosition="fixed" {...props} />
);

export default SceneSelect;
