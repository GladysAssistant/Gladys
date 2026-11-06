// Dismiss a modal or a sheet on a click on its backdrop — but only when the
// press also started on the backdrop.
//
// A gesture that starts inside the dialog and is released over the backdrop
// (a slider dragged past the edge of the sheet, the color wheel, a text
// selection in an input) makes the browser dispatch its `click` on the common
// ancestor of the press and the release targets: the backdrop itself.
// Testing `event.target === event.currentTarget` on the click alone reads
// that as a click on the backdrop and closes the dialog in the middle of the
// user's gesture.
//
// Usage: spread the returned handlers on the backdrop element.
//   backdropDismiss = createBackdropDismiss(() => this.props.onClose());
//   <div class={style.overlay} {...this.backdropDismiss}>
const createBackdropDismiss = onDismiss => {
  let pressStartedOnBackdrop = false;

  return {
    onPointerDown: event => {
      pressStartedOnBackdrop = event.target === event.currentTarget;
    },
    onClick: event => {
      const dismiss = pressStartedOnBackdrop && event.target === event.currentTarget;
      pressStartedOnBackdrop = false;
      if (dismiss) {
        onDismiss();
      }
    }
  };
};

export default createBackdropDismiss;
