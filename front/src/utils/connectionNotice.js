// Whether the "Gladys is unreachable" notice of the app shell is on screen
// (components/header/ConnectionLostNotice.jsx). Other messages about the same trouble read it
// to stay quiet: the device command toast does not add "Gladys may not have received the
// command" under a notice which already says that Gladys is away.
let shown = false;

export const setConnectionNoticeShown = value => {
  shown = Boolean(value);
};

export const isConnectionNoticeShown = () => shown;
