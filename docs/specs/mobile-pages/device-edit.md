# Editing a device on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.**

## A. Context

`components/device/UpdateDevice.jsx` is the page of a device for the integrations that have one
(Zigbee2mqtt, Tasmota, Tuya, eWeLink, MELCloud, Xiaomi, Bluetooth, Broadlink). The devices list
— already a phone list — links to it. On a phone it was a card holding one `col-md-4` card per
feature: for a three-feature sensor, six screens of repeated fields (the same explanation about
the history under each card), with "Save" at the very end.

What people come to do there: **rename** the device or one of its features, **move it to another
room**, and **choose which features keep their history**.

## B. The page (< 768 px)

- **A focus page** (README C.1): the navigation bar shows the way back, and the device name as
  its title. The chrome of the integration page around it (back to the catalog, title, tabs —
  `hz-subpage-chrome` in `IntegrationSubPageLayout`) and the gutters of its container give way
  while a focus page is shown on a phone, for every integration.
- **Where "back" leads.** The devices list links to the device with `?from=devices`
  (`routes/devices/integrationLinks.js`): the page then goes back to **the devices list**
  ("‹ Devices"), otherwise to the page of its integration ("‹ Back"). This holds from 768 px
  too: the "Back" buttons of the desktop card lead to the same place.
- **The device**: its name (a text field), its room (the native select of the system, the rooms
  grouped by house, "No room" first), and its refresh frequency when the device is polled.
- **"N features"**: one row per feature, in one group — the icon of its type, its name (the
  label of its type when it has none), its type and its unit, and whether its history is kept
  ("History kept · 1 204 states (≈ 56 kB)" — the size is the one the desktop card shows, from the
  same request, left out when the history is empty). A footnote under the group says what a tap
  does and where the retention period is set. A device with no feature says so.
- **Bottom bar** (README C.4): "● Unsaved changes" and **Save**, disabled while nothing differs
  from the device as loaded or last saved. A failed save (error, or conflict on the external
  ids) shows in the bar; a successful one shows the "Saved" toast, and what the server returned
  becomes the saved version.
- **Leave guard** (README C.4) on the back control, and `beforeunload` while there are unsaved
  changes. "Save and leave" leaves once the save went through; a failed save stays on the page.
- A device that does not exist (or belongs to another integration) shows "Device not found"; the
  back control still works.

- **A link of the page leaves it through the same guard.** The footnotes link to the System
  page: with unsaved changes, a tap on such a link (in the page or in the sheet of a feature)
  opens the leave sheet, and "Save and leave" / "Leave without saving" then lead where the link
  pointed.
- **The saved version outlives a change of layout.** The device as loaded or last saved is kept
  by `UpdateDevice`, which stays mounted when a window resized across the breakpoint (or a
  tablet turned) swaps the phone layout and the card: coming back to the phone layout with
  edits made meanwhile, they are still unsaved changes, with their Save and their leave guard.

## C. The sheet of a feature

Tapping a row opens the feature in a sheet titled with the label of its type, closed with **OK**
(the changes are kept in the page, saved with the device):

- its **name**;
- its **category**, only where the desktop card offers it (the integration allows it, and the
  current category is one of the compatible ones: light / switch, shutter / curtain);
- its **unit**, when its category and type have several;
- **Keep the history**: a switch row, with the size of the history under its label, and one
  footnote explaining what it does. Not shown for a music feature (the core never keeps its
  history);
- its **external id**: a value to read and select, not a disabled field, with the sentence that
  explains what it is for (the notice at the top of the desktop card).

When an integration lets features be edited (`allowModifyFeatures`), the sheet also holds the
minimum and maximum, an editable external id and "Delete the feature", and the page an
"Add a feature" button opening the list of types in a sheet.

## D. What does not change

- From 768 px: the card and its feature cards, as before.
- The container (`components/device/index.js`), the Broadlink page that renders `UpdateDevice`
  itself, the payload of the save and the rules on the external id: the phone layout calls the
  same `updateDeviceProperty` / `updateFeatureProperty` / `saveDevice`.

## E. Tests

Cypress, phone viewport, `front/cypress/e2e/routes/devices/DeviceEditMobile.cy.js`: the fields
and the feature rows with nothing to save, the chrome of the integration hidden, 16 px fields; a
feature renamed and its history turned off from its sheet, the bottom bar switching to unsaved,
the saved payload and the toast; the leave guard (keep editing, leave without saving); save and
leave back to the devices list with `?from=devices`; a link of the page going through the leave
guard; the changes still unsaved after the layout changed and came back; the cards kept on a
wider screen.
