# Thermostat Dashboard Box Component

The Thermostat box is a dashboard widget that displays and controls thermostat settings through an interactive radial gauge interface. It allows users to view current temperature and adjust temperature setpoints (minimum, maximum, and target).

## Overview

The Thermostat component provides a visual and interactive way to manage heating and cooling systems. It displays temperature data from multiple device features and allows users to adjust setpoints through an intuitive circular gauge interface.

## Components

### `ThermostatBox.jsx`

The main display component that renders the thermostat gauge.

**Key Features:**
- **Radial Gauge Display**: Displays temperature using ApexCharts' radial bar chart
- **Temperature Monitoring**: Tracks actual temperature readings from configured sensors
- **Interactive Controls**: Allows dragging handles to adjust temperature setpoints
- **Real-time Updates**: Listens for WebSocket events to update device states
- **Automatic Reconnection**: Refreshes data when WebSocket connection is restored
- **Unit Conversion**: Supports temperature unit conversion (Celsius/Fahrenheit)

**State Management:**
- `graphValues`: Object containing all temperature values (actual, min, max, target, heating state, etc.)
- `annotations`: Array of visual tick markers on the gauge
- `error`: Boolean indicating if there was an error loading device data
- `noDeviceFeatureSelector`: Boolean indicating if device features weren't properly selected

**Key Methods:**
- `getDevice()`: Fetches the initial device data and feature values from the API
- `updateDeviceStateWebsocket()`: Updates state when device changes are received via WebSocket
- `initChart()`: Initializes the ApexCharts radial gauge
- `updateChartValue()`: Updates the gauge with new temperature values
- `formatValueWithUnit()`: Formats values with appropriate units for display
- `getGraphMinMax()`: Calculates min/max boundaries for the gauge display
- `renderTicks()`: Renders temperature scale ticks around the gauge

**Device Feature Configuration:**
The component expects the box configuration to include a `device_features` array with the following indices:
- Index 0: Actual temperature sensor
- Index 1: Minimum temperature setpoint
- Index 2: Maximum temperature setpoint
- Index 3: Target temperature setpoint
- Index 4: Heating active sensor (optional)
- Index 5: Auto/Manual setting (optional)

### `EditThermostatBox.jsx`

The configuration/edit component that allows users to select which device features to use.

**Key Features:**
- **Device Feature Selection**: Dropdown selectors for each required feature
- **Grouped Options**: Device features are grouped by device for easy navigation
- **Unit Detection**: Automatically detects temperature units from device parameters
- **Persistent Configuration**: Saves selections to the dashboard box configuration

**State Management:**
- `deviceOptions`: Array of available device features grouped by device
- `deviceFeatures`: Array of currently selected feature selectors
- `deviceFeatureNames`: Array of names for selected features (actual_temp_sensor, min_temp_setpoint, etc.)
- `unit`: Detected temperature unit from device parameters
- `loading`: Boolean indicating if features are being loaded

**Key Methods:**
- `getDeviceFeatures()`: Fetches all available device features from the API
- `getSelectedDeviceFeatureAndOptions()`: Processes devices and features into dropdown options
- `updateDeviceFeature()`: Updates a selected feature and saves to box config

## Usage

### Adding a Thermostat Box to Dashboard

1. Edit your dashboard
2. Select "Thermostat" from the box type selector
3. In the configuration panel, select:
   - **Actual Temperature Sensor**: The device feature that reports current temperature
   - **Min Temperature Setpoint**: The device feature for minimum temperature threshold
   - **Max Temperature Setpoint**: The device feature for maximum temperature threshold
   - **Target Temperature Setpoint**: The device feature for desired temperature
   - **Heating Active Sensor** (optional): Binary sensor indicating if heating is active
   - **Auto/Manual Setting** (optional): Selector for operation mode

4. Save the configuration

### Display Features

The thermostat box displays:
- A radial gauge showing current temperature within configured range
- Temperature scale markings around the gauge
- Interactive handles (colored circles) at setpoint positions:
  - **Green**: Minimum temperature setpoint
  - **Red**: Maximum temperature setpoint
  - **Purple**: Target temperature setpoint
- Current temperature value with unit in the center

### Interactive Controls

Users can drag the colored handles to adjust temperature setpoints (functionality currently in development).

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ ThermostatBox (Display)                                 │
├─────────────────────────────────────────────────────────┤
│ • Fetches device features via API                        │
│ • Listens to WebSocket for state updates                │
│ • Renders ApexCharts gauge                              │
│ • Displays current and target temperatures              │
└─────────────────────────────────────────────────────────┘
              ↓                          ↑
        API Requests            WebSocket Updates
              ↓                          ↑
┌─────────────────────────────────────────────────────────┐
│ Backend Services                                        │
├─────────────────────────────────────────────────────────┤
│ • Tuya Service (thermostat devices)                      │
│ • Netatmo Service (temperature sensors)                  │
│ • Other Device Services                                  │
└─────────────────────────────────────────────────────────┘
```

## Styling

The component uses inline styles for positioning interactive elements and the gauge container. The layout is responsive and centered on the page.

## Integration with Other Services

The Thermostat box works with any device service that provides:
- Temperature sensors (for actual temperature)
- Numeric features with min/max values (for setpoints)
- Boolean or enum features (for heating state and operation modes)

Compatible services include:
- **Tuya Service**: Tuya-compatible smart thermostats
- **Netatmo Service**: Netatmo thermostat devices
- **Other Smart Home Protocols**: Zigbee2MQTT, Z-Wave, etc.

## Known Limitations

- Interactive dragging of handles is currently implemented but commented out (needs API integration)
- Only supports Celsius display internally (conversion to Fahrenheit happens during formatting)
- WebSocket reconnection only refreshes data if previously connected

## Future Enhancements

- Enable interactive handle dragging with API calls to update setpoints
- Add scheduling support for temperature profiles
- Support for multiple zones/devices in a single box
- Enhanced animations and visual feedback
- Voice control integration
