// The pages that can be reloaded without asking: nothing the user typed, drew or arranged
// would be lost with them. The "Gladys is unreachable" notice (components/header/
// ConnectionLostNotice.jsx) reloads such a page by itself when Gladys is back and the page is
// not — a dashboard on a wall, with nobody in front of it to press "Reload". Every other
// page only offers the button.
//
// A page declares itself while it is mounted:
//
//   componentDidMount() { this.pageIsNoLongerReloadable = declareReloadablePage(); }
//   componentWillUnmount() { this.pageIsNoLongerReloadable(); }

let reloadablePages = 0;

export const declareReloadablePage = () => {
  reloadablePages += 1;
  let declared = true;
  return () => {
    if (declared) {
      declared = false;
      reloadablePages -= 1;
    }
  };
};

export const isPageReloadable = () => reloadablePages > 0;
