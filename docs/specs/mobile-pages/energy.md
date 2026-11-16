# Energy monitoring on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.** What these pages do — the contracts, the
> tariff, the preview, the hierarchy of the meters — is owned by
> [`energy-contracts.md`](../energy-contracts.md) (section 8) and
> [`energy-hierarchy.md`](../energy-hierarchy.md) (section E): this file only owns how they are
> presented on a phone.

## A. Context

The energy monitoring integration (`front/src/routes/integration/all/energy-monitoring/`) has four
screens: "My devices", the contracts, the contract wizard and the settings (recalculations and
tariff calendars). On a phone they were the desktop cards, wrapped:

- the wizard — the largest form of the app — laid its parameters out in `col-md-3` columns that
  stacked into one long card, its four steps were small buttons at the top, "Next" and "Save" were
  wherever the step ended, the preview was a five-column table scrolling sideways in a box that
  scrolled inside the page, and the off-peak hours were a grid of 48 buttons of 30 px;
- a contract was deleted from a small button, confirmed by a dialog of the browser;
- the calendars were a five-column table;
- the two recalculations, which reprice the whole history, started on a single tap.

A contract is configured rarely, but it is configured by someone standing in front of the meter
or holding the bill: on a phone.

## B. "My devices" (`MobileMyDevices.jsx`)

A consultation page: it keeps the app's top bar and the tabs of the integration.

- The explanation of the page, then **one group per meter**: the meter first (its name, its
  energy features, the "Electric meter" pill under its name), then one row per device it prices.
  A meter that prices nothing says so under its group.
- **"Not attached to a meter"**: the devices that are on no meter, each row ending with "Choose a
  meter", and a footnote saying they are not priced.
- **The meter of a device is chosen in a sheet.** Tapping a device (attached or not) opens "Meter
  of ‹device›": the meters as radio rows, the current one checked. Tapping a meter attaches the
  device (`PATCH /device/:selector/electric_meter`, the request of the desktop select) and closes
  the sheet; a toast confirms ("‹device› is now priced by ‹meter›"). Tapping the meter the device
  is already on changes nothing. A refusal shows under the row of the device. With no meter at
  all a device is not a button.
- No meter: the notice of the desktop page, and a **Create a contract** button opening the
  wizard. Contracts that cannot be loaded: the error, and neither the notice nor the unattached
  devices (as on the desktop page).

- One attachment at a time: while a device is being attached, the rows of the other devices do
  not open their sheet (a sheet opened meanwhile would hold the meter the first device was on).

## C. Contracts (`contracts/MobileContracts.jsx`)

A consultation page, with the tabs.

- **One section per meter**, **one row per contract**: its name (two lines at most), its period
  with dates written for a reader ("Jan 1, 2025 → ongoing"), then its status as a pill (active,
  scheduled, expired, orphaned — always with its word) with its currency and its provider. An
  orphaned contract and a migrated one carry their notice in their card.
- **Tapping the row opens the contract** in the wizard. A **"•••"** button (44 px) beside the row
  — a second target next to the first, never inside it — opens the actions of the contract in a
  sheet: **Edit contract**, **Delete contract**.
- **Deleting is confirmed in a sheet** (README C.5) naming the contract and saying what happens
  to its costs; the button shows a spinner while the request runs, and a toast confirms. The
  desktop list keeps its dialog.
- A **floating "+"** creates a contract. An empty list says what a contract is for.

## D. The contract wizard (`contracts/MobileContractWizard.jsx`)

### D.1 One container, two presentations

`ContractWizard.jsx` is the container: the state, the requests (`loadTemplates`,
`selectTemplate`, `runPreview`, `save`…), the payload. It renders one of two presentations from
the same view (`getView()`: the state and the actions): `ContractWizardDesktop.jsx`, the card of
the desktop wizard as it was, and `MobileContractWizard.jsx`. Nothing is computed twice, and
crossing the breakpoint in the middle of a contract (a phone turned, a window resized) swaps the
presentation and keeps what was typed.

### D.2 The flow

- **A focus page** (README C.1): "‹ Contracts" on the left, "New contract" / "Edit contract" as
  the title; the chrome of the integration gives way.
- **"Step 2 of 4 · Template"** above a progress bar (`MobileSteps`), then **one step per
  screen**, each starting at the top of the page.
- **The way forward is in the bottom bar** (README C.4):

  | Step | Bottom bar |
  | --- | --- |
  | 1. Meter | **Next**, disabled until a meter is chosen |
  | 2. Template | **Back** — choosing a template is what moves forward |
  | 3. Parameters | **Back** (not when editing) · **Preview**, disabled until the name, the start date and the currency are filled and the JSON is valid. A delegated contract shows **Save** instead (it cannot be previewed) |
  | 4. Preview | **Back** · **Save**, disabled until the preview is there, a spinner while saving |

- **Errors show in the bar**, with a close button: the templates that could not be loaded, a
  preview the server refuses, a save it refuses (a period that overlaps another contract). "Back"
  returns to the parameters with everything that was typed.
- **Leave guard.** The back control of the navigation bar asks before leaving once there is work
  to lose — a new contract whose template (or manual entry) was chosen, an edited contract that
  differs from what was loaded: **Leave without saving** (destructive) / **Keep editing**. There
  is no "Save and leave": a contract is saved from its preview. Before that the back control
  leaves at once. `beforeunload` is registered meanwhile.
- A saved contract goes back to the list.

### D.3 The steps

1. **Meter.** The devices carrying an energy feature as **radio rows** (the list of the desktop
   select), and a row **Create a new meter** that creates the MQTT meter and selects it.
2. **Template.** A search field, the countries as chips when the templates cover several
   ("All countries" first), then **one row per template**: its name, "FR · EUR · rule engine",
   the provider as a pill and "integration stopped" when it is. Tapping a row loads the template
   and opens the parameters. Under the list, "Your contract is not in the list?": **Create a
   contract manually** (one tap, the JSON mode of step 3) and **Propose it to the community**,
   which opens the explanations of the desktop block in a sheet, with the link to the repository.
3. **Parameters.** The template chosen, then:
   - the **name**, the **start date** and the **end date** (the native date field of the system);
   - **Currency and billing**: one row summing up the currency, the timezone, the billing day and
     the subscribed power ("EUR · Europe/Paris · billed from day 1 · 6 kVA"), opening them in a
     sheet — they are set once and rarely changed, and come filled from the template;
   - the **inputs of the template**: a number with its unit in the same control and the decimal
     keyboard, a list, a text, and the time ranges of D.4;
   - **Advanced**: "Edit the tariff as JSON" (a switch; the definition is then a monospace field
     of 16 px, so iOS does not zoom into it, with its error under it) and "Export as template".
4. **Preview.** While the server prices the last 7 days, a loader. Then the **total as a
   headline** with the kWh and the number of intervals, the notice of a synthetic profile, the
   **components as rows** (their key, their amount), the warnings, and the **sample intervals as
   rows** — the instant, "0.5 kWh × €0.2146 · rate", the cost on the right — eight of them, the
   others on demand ("Show the 48 intervals"). No table, no box scrolling inside the page.

An **edited contract** opens on step 3 in JSON mode, as on the desktop wizard, and has no way
back to the meter and the template.

### D.4 Time ranges (`contracts/MobileHourRanges.jsx`)

A `time_intervals` input (off-peak hours) is a list of ranges, and that is how it is shown on a
phone instead of the 48 buttons of `HourSlotGrid`:

- **the day as a bar** (48 half hours, the selected ones filled, 00:00 – 24:00 under it);
- **one row per range** ("22:00 → 06:00 · next day"); tapping it changes it, its **×** (44 px)
  removes it;
- **Add a time range** opens a sheet with two lists, "From" and "To", by half hours ("To" goes up
  to 24:00). A range ending before it starts ends the next day, and the sheet says so; a range
  ending when it starts cannot be validated.

The value is unchanged — a list of `["HH:MM", "HH:MM"]` — and goes through the same half-hour
slots as the grid (`intervalsToSlots` / `slotsToIntervals`), so ranges that touch or overlap
merge exactly as two neighboring buttons do.

- **The whole day is a range**: "00:00 → 24:00" is what the grid stores when every slot is on,
  and it can be picked and validated in the sheet. Only two identical ends ("12:00 → 12:00") are
  an empty range, which cannot be validated.

- **Preview**: the usual components of a tariff are named in the language of the user
  (`mobile.previewComponents`: energy, subscription); another key is shown as the tariff writes
  it. Quantities (kWh, number of intervals) and amounts are written in the language of the
  user, with the same separators. The label of a rate comes from the tariff itself.

## E. Settings (`MobileEnergySettings.jsx`, `contracts/MobileCalendars.jsx`)

- **Recalculations**: "Recalculate consumption" and "Calculate cost from the beginning" are two
  rows. Tapping one opens a **confirmation sheet** holding its explanation (the paragraph the
  desktop page shows above its button) and **Start the calculation**. Started, it leaves for the
  background jobs as on desktop; refused, the error shows above the rows.
- **Tariff calendars**: one row per calendar — its key, its provider (or the "no provider" pill)
  and its granularity, then its coverage — opening its **last values in a sheet**.
- **Recalculate the costs**: the native date field, then the button, disabled until a date is
  chosen; the confirmation of the desktop page once started.

## F. What does not change

- From 768 px: every page as before. The desktop wizard renders the same markup from
  `ContractWizardDesktop.jsx`.
- No request and no payload: the phone pages call the handlers of their containers
  (`MyDevices.jsx`, `Contracts.jsx`, `ContractWizard.jsx`, `Calendars.jsx`,
  `EnergyMonitoring.jsx`).
- The meter picker of the price widget and of the price scenes
  (`components/energy-contract/ElectricMeterSelect.jsx`) is a field of other forms — the
  dashboard editor and the scene sheets dress it.

## G. Tests

- Cypress, phone viewport,
  `front/cypress/e2e/routes/integration/energy-monitoring/ContractsMobile.cy.js`: the empty list
  and its floating button; a manual contract created step by step (the focus page, the meter as
  a radio row, 16 px fields, the billing sheet and its summary, the preview, the saved payload,
  the row under its meter); a template picked after a search, its time ranges added, merged and
  removed from the sheet, and the inputs sent to the preview; the leave guard (nothing asked
  before a template is chosen, keep editing, leave); a refused save shown in the bottom bar; a
  contract opened from its row and renamed; the meter of a device chosen in a sheet; a contract
  deleted from its actions once confirmed; a recalculation confirmed before it starts, the
  calendars as rows and their values in a sheet; the card of the wizard kept on a wider screen.
- Cypress, desktop viewport: `Contracts.cy.js` and `MyDevices.cy.js` pass unchanged.
- In a phone emulation with a real touch screen (Playwright; iPhone 13, 320 px, landscape, light
  and dark): no horizontal scroll, no field below 16 px, no target below 44 px on every screen
  above; the wizard kept in landscape; the form kept when the breakpoint is crossed both ways; a
  sheet dragged down by its header.
