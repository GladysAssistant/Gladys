# Tuya Service

The Tuya service in Gladys allows users to integrate and control Tuya-compatible devices through the Tuya cloud. This document provides an overview of how the system registers and controls Tuya devices, including the recent enhancements for better device type support and parameter handling.

## How the System Registers Tuya Devices

1. **Initialization**:
   - The service initializes by loading the configuration and connecting to the Tuya cloud.
   - Code reference: [`tuya.init.js`](lib/tuya.init.js).

2. **Discovering Devices**:
   - The `discoverDevices` function is responsible for discovering Tuya devices connected to the Tuya cloud.
   - If the service is not properly configured, the discovery process will throw an error.
   - Code reference: [`tuya.discoverDevices.js`](lib/tuya.discoverDevices.js).

3. **Converting Devices**:
   - Once devices are discovered, they are converted into the Gladys device format using the `convertDevice` function.
   - This function maps Tuya device properties (e.g., name, model, features) to the Gladys device schema.
   - Device features are extracted from both `status` (read-only) and `functions` (writable) specifications.
   - Extracted parameters are stored for later use in value transformations.
   - Code reference: [`tuya.convertDevice.js`](lib/device/tuya.convertDevice.js).

## Device Feature Conversion

### Feature Type Mapping

The Tuya service maps device feature types to Gladys categories and types using the `tuya.deviceMapping.js` file. Recent updates added support for additional feature types:

- **Boolean Type**: Maps to `SWITCH.BINARY` category
- **Integer Type**: Maps to `NUMBER.INTEGER` category with min/max/step/unit/scale parameters
- **Enum Type**: Maps to `NUMBER.ENUM` category with pipe-delimited values
- **String Type**: Maps to `TEXT.TEXT` category
- **Light Features**:
  - `switch_led`: Light binary control
  - `bright_value_v2`: Light brightness (0-255)
  - `temp_value_v2`: Light temperature (inverted scale: 1000 - value)
  - `colour_data_v2`: RGB color data
- **Curtain/Cover Features**:
  - `control`: Open/Close/Stop states
  - `percent_control`: Position control (0-100%)
- **Power Features**:
  - `cur_power`: Power consumption (Watts)
  - `cur_current`: Current draw (mA)
  - `cur_voltage`: Voltage (Volts)
  - `add_ele`: Energy consumption (kWh)

### Parameter Storage

Device parameters are extracted and stored separately for each feature:
- **Integer Parameters**: Includes `step`, `unit`, and `scale` values from Tuya specifications
- **Enum Parameters**: Stores pipe-delimited enum values for later transformation
- **Unit Information**: Automatically extracted from device specifications

## How the System Controls Tuya Devices

1. **Sending Commands**:
   - The service sends commands to Tuya devices using the `setValue` function.
   - This function communicates with the Tuya cloud to update the state of a device (e.g., turning it on/off, changing brightness).
   - Values are transformed based on device type (Boolean, Integer, Enum, etc.) before sending.
   - Parameters are looked up and passed to transformation functions for accurate value conversion.
   - Code reference: [`tuya.setValue.js`](lib/tuya.setValue.js).

2. **Polling Device State**:
   - The service periodically polls the state of Tuya devices to ensure their status is up-to-date in Gladys.
   - Polling frequency is defined in the device configuration (default: every 30 seconds).
   - Polled values are transformed based on feature type and stored parameters.
   - Transformation functions account for scaling factors and enum mappings.
   - Code reference: [`tuya.poll.js`](lib/tuya.poll.js).

3. **Event Handling**:
   - The service listens for events from the Tuya cloud and updates the state of devices in Gladys accordingly.
   - State updates use the same transformation pipeline as polling.

## Value Transformation

### Read Values (Device → Gladys)

The `readValues` mapping in `tuya.deviceMapping.js` transforms device values to Gladys format:

**Integer Transformation**:
```javascript
// Example: Tuya returns 200 (scale=1), converts to 20.0
value = 200
scale = 1
value = value / 10^scale  // 200 / 10 = 20
result = "20"
```

**Enum Transformation**:
```javascript
// Example: Tuya enum ['low', 'medium', 'high'] returns 'medium'
enumValues = ['low', 'medium', 'high']
result = enumValues.indexOf('medium')  // 1
```

### Write Values (Gladys → Device)

The `writeValues` mapping transforms Gladys values to Tuya format:

**Integer Transformation**:
```javascript
// Example: User sets 20°, scale=1, sends to Tuya
value = 20
scale = 1
while (scale > 0) {
  value *= 10  // 20 * 10 = 200
  scale--
}
result = "200"
```

**Enum Transformation**:
```javascript
// Example: User selects index 1 for mode
enumValues = ['manual', 'auto']
result = 1  // Index of selected value
```

**Light Transformations**:
- **Brightness**: Direct value (0-255)
- **Temperature**: Inverted (1000 - value)
- **Color**: RGB to HSV conversion

## Key Files

- **`tuya.init.js`**: Initializes the service and connects to the Tuya cloud.
- **`tuya.discoverDevices.js`**: Discovers Tuya devices.
- **`tuya.convertDevice.js`**: Converts Tuya devices to the Gladys device format with parameter extraction.
- **`tuya.convertFeature.js`**: Converts individual Tuya features and extracts parameters.
- **`tuya.deviceMapping.js`**: Maps Tuya feature types to Gladys categories and defines value transformation functions.
- **`tuya.setValue.js`**: Sends commands to Tuya devices with value transformation.
- **`tuya.poll.js`**: Polls the state of Tuya devices with parameter-aware transformations.

## Recent Changes (Enhanced Device Type Support)

### Feature Type Mapping Improvements
- Added support for **Boolean**, **Integer**, **Enum**, and **String** types
- These map to the new `NUMBER` device feature category
- Integer features now properly extract and store `min`, `max`, `step`, `unit`, and `scale` parameters

### Parameter-Aware Value Transformation
- **Updated `tuya.poll.js`**: Now passes device parameters to transformation functions for accurate scaling
- **Updated `tuya.setValue.js`**: Uses parameters when transforming values before sending to Tuya
- **Updated `tuya.convertFeature.js`**: Extracts feature parameters based on type and stores them in the device

### Device Conversion Enhancement
- **Updated `tuya.convertDevice.js`**: Now builds a `device.params` array containing parameter metadata for each feature
- Parameters are extracted from feature specifications and made available throughout the service lifecycle

## Supported Devices

The enhanced Tuya service now supports a wider range of device types:

- **Smart Thermostats**: Integer features for temperature setpoints
- **Smart Switches**: Boolean features with power monitoring (Watts, Amps, Volts)
- **Smart Lights**: Brightness, color temperature, and RGB color control
- **Smart Curtains/Blinds**: Position control and open/close states
- **Smart Plugs**: Energy monitoring and consumption tracking
- **Tuya-Compatible Devices**: Any device using Tuya's generic type system (Boolean, Integer, Enum, String)

## Example: Thermostat Integration

A Tuya thermostat device may provide features like:
- `temp_set` (Integer): Current setpoint temperature
- `temp_current` (Integer): Measured room temperature
- `mode` (Enum): Operation mode (manual/auto/schedule)
- `heating_active` (Boolean): Heating is active state

The Tuya service automatically:
1. Maps these to appropriate Gladys feature types
2. Extracts min/max/scale parameters for temperature features
3. Creates enum mappings for mode selection
4. Applies correct transformations when reading or writing values

## Notes

- Ensure the Tuya service is properly configured with valid credentials before attempting to discover or control devices.
- The service relies on the Tuya cloud API, so an active internet connection is required.
- When devices provide scaling factors (e.g., scale: 1 for decimals), values are automatically transformed for both reading and writing.
- Enum features are converted to numeric indices for storage in Gladys and back to string values when sent to Tuya.

For more details, refer to the source code in the `lib/` directory.