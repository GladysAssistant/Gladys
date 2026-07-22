# Matter compatibility in Gladys

This file documents Matter cluster compatibility in the Gladys Matter integration.

- `matter.js` source: `@matter/main` / `@matter/types` `0.17.4`
- Clusters exposed by `matter.js`: **132**
- Clusters handled by Gladys today: **26**
- Compatibility progress: **19.7%**
- Clusters with an existing Gladys feature (easy to wire): **26** additional

A cluster is marked as handled when the current Gladys Matter integration contains explicit mapping logic for discovery, state reading/listening, and/or commands for that cluster.

The **Gladys feature** column lists matching `category/type` pairs from `server/utils/constants.js`. Values marked `(easy)` mean Gladys already has the device feature model and the cluster mainly needs Matter mapping code. Infrastructure clusters (commissioning, security, diagnostics) have no Gladys device feature and are shown as `—`.

| Matter cluster | Purpose | Gladys | Gladys feature | Notes |
| --- | --- | --- | --- | --- |
| `AccessControl` | The Access Control Cluster exposes a data model view of a Node's Access Control List (ACL), which codifies the rules used to manage and enforce Access Control for the Node's endpoints and their associated cluster instances. | No | — | Not explicitly handled in `server/services/matter`. |
| `AccountLogin` | This cluster provides commands that facilitate user account login on a Content App or a node. | No | — | Not explicitly handled in `server/services/matter`. |
| `Actions` | This cluster provides a standardized way for a Node (typically a Bridge, but could be any Node) to expose logical grouping and actions. | No | — | Not explicitly handled in `server/services/matter`. |
| `ActivatedCarbonFilterMonitoring` | Reports the condition and remaining lifetime of an activated carbon filter. | No | hepa-filter-monitoring/filter-life-remaining (easy) | Not explicitly handled in `server/services/matter`. |
| `AdministratorCommissioning` | This cluster is used to trigger a Node to allow a new Administrator to commission it. | No | — | Not explicitly handled in `server/services/matter`. |
| `AirQuality` | This cluster provides an interface to air quality classification using distinct levels with human-readable labels. | No | airquality-sensor/aqi (easy) | Not explicitly handled in `server/services/matter`. |
| `ApplicationBasic` | This cluster provides information about a Content App running on a Video Player device which is represented as an endpoint (see Device Type Library document). | No | — | Not explicitly handled in `server/services/matter`. |
| `ApplicationLauncher` | This cluster provides an interface for launching applications on a Video Player device such as a TV. | No | — | Not explicitly handled in `server/services/matter`. |
| `AudioOutput` | This cluster provides an interface for controlling the Output on a Video Player device such as a TV. | No | television/volume (easy) | Not explicitly handled in `server/services/matter`. |
| `BasicInformation` | This cluster provides attributes and events for determining basic information about Nodes, which supports both Commissioning and operational determination of Node characteristics, such as Vendor ID, Product ID and serial number, which apply to the whole Node. | Yes | device metadata (vendor, product, serial) | Used to populate device vendor/product identity and onboarding params (via Matter node basic information). |
| `Binding` | Defines bindings between local endpoints and remote targets so commands and reports can be routed automatically. | No | — | Not explicitly handled in `server/services/matter`. |
| `BooleanState` | This cluster provides an interface to a boolean state. | Yes | switch/binary | Binary state, read-only. |
| `BooleanStateConfiguration` | This cluster is used to configure a boolean sensor, including optional state change alarm features and configuration of the sensitivity level associated with the sensor. | No | — | Not explicitly handled in `server/services/matter`. |
| `BridgedDeviceBasicInformation` | This cluster provides attributes and events for determining basic information about Bridged Nodes. | Yes | device metadata (bridged endpoint) | Used to populate bridged endpoint metadata (vendorName/nodeLabel/productLabel/productName/uniqueId/serialNumber). |
| `CameraAvSettingsUserLevelManagement` | This cluster provides an interface into controls associated with the operation of a camera that provides pan, tilt, and zoom functions, either mechanically, or against a digital image. | No | — | Not explicitly handled in `server/services/matter`. |
| `CameraAvStreamManagement` | This cluster is used to allow clients to manage, control, and configure various audio, video, and snapshot streams on a camera. | No | camera/image (easy) | Not explicitly handled in `server/services/matter`. |
| `CarbonDioxideConcentrationMeasurement` | Measures carbon dioxide concentration values reported by a sensor. | Yes | co2-sensor/decimal | CO2 concentration in ppm, read-only. |
| `CarbonMonoxideConcentrationMeasurement` | Measures carbon monoxide concentration values reported by a sensor. | No | co-sensor/decimal (easy) | Not explicitly handled in `server/services/matter`. |
| `Channel` | This cluster provides an interface for controlling the current Channel on a device or endpoint. | No | television/channel (easy) | Not explicitly handled in `server/services/matter`. |
| `Chime` | This cluster provides facilities to configure and play Chime sounds, such as those used in a doorbell. | No | siren/binary (easy) | Not explicitly handled in `server/services/matter`. |
| `ClosureControl` | This cluster provides an interface for controlling a Closure. | No | shutter/position, shutter/state (easy) | Not explicitly handled in `server/services/matter`. |
| `ClosureDimension` | This cluster provides an interface for controlling a single degree of freedom (also referred to as a "dimension" or an "axis" below) of a composed closure. | No | shutter/position (easy) | Not explicitly handled in `server/services/matter`. |
| `ColorControl` | Provides attributes and commands for controlling color, hue, saturation, and related lighting properties. | Yes | light/color | Color control via hue/saturation. |
| `CommissionerControl` | The Commissioner Control Cluster supports the ability for clients to request the commissioning of themselves or other nodes onto a fabric which the cluster server can commission onto. | No | — | Not explicitly handled in `server/services/matter`. |
| `CommodityMetering` | The Commodity Metering Cluster provides the mechanism for communicating commodity consumption information within a premises. | No | energy-sensor/index (easy) | Not explicitly handled in `server/services/matter`. |
| `CommodityPrice` | The Commodity Price Cluster provides the mechanism for communicating Gas, Energy, or Water pricing information within the premises. | No | — | Not explicitly handled in `server/services/matter`. |
| `CommodityTariff` | The CommodityTariffCluster provides the mechanism for communicating Commodity Tariff information within the premises. | No | — | Not explicitly handled in `server/services/matter`. |
| `ContentAppObserver` | This cluster provides an interface for sending targeted commands to an Observer of a Content App on a Video Player device such as a Streaming Media Player, Smart TV or Smart Screen. | No | — | Not explicitly handled in `server/services/matter`. |
| `ContentControl` | This cluster is used for managing the content control (including "parental control") settings on a media device such as a TV, or Set-top Box. | No | — | Not explicitly handled in `server/services/matter`. |
| `ContentLauncher` | This cluster provides an interface for launching content on a Video Player device such as a Streaming Media Player, Smart TV or Smart Screen. | No | — | Not explicitly handled in `server/services/matter`. |
| `Descriptor` | Describes a node, its endpoints, device types, and the clusters present on each endpoint. | No | — | Not explicitly handled in `server/services/matter`. |
| `DeviceEnergyManagement` | This cluster allows a client to manage the power draw of a device. | No | — | Not explicitly handled in `server/services/matter`. |
| `DeviceEnergyManagementMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for Device Energy Management devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `DiagnosticLogs` | This Cluster supports an interface to a Node. | No | — | Not explicitly handled in `server/services/matter`. |
| `DishwasherAlarm` | This cluster is a derived cluster of the Alarm Base cluster and provides the alarm definition related to dishwasher devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `DishwasherMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for dishwasher devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `DoorLock` | The door lock cluster provides an interface to a generic way to secure a door. | No | lock/binary, lock/state (easy) | Not explicitly handled in `server/services/matter`. |
| `EcosystemInformation` | The Ecosystem Information Cluster provides extended device information for all the logical devices represented by a Bridged Node. | No | — | Not explicitly handled in `server/services/matter`. |
| `ElectricalEnergyMeasurement` | This cluster provides a mechanism for querying data about the electrical energy imported or provided by the server. | Yes | energy-sensor/index | Imported cumulative energy. |
| `ElectricalGridConditions` | The Electrical Grid Conditions Cluster provides the mechanism for communicating electricity grid carbon intensity to devices within the premises in units of Grams of CO2e per kWh. | No | — | Not explicitly handled in `server/services/matter`. |
| `ElectricalPowerMeasurement` | This cluster provides a mechanism for querying data about electrical power as measured by the server. | Yes | energy-sensor/power, energy-sensor/voltage, energy-sensor/current | Power, voltage, and current when exposed. |
| `EnergyEvse` | Electric Vehicle Supply Equipment (EVSE) is equipment used to charge an Electric Vehicle (EV) or Plug-In Hybrid Electric Vehicle. | No | electrical-vehicle-charge/charge-power, electrical-vehicle-charge/plugged (easy) | Not explicitly handled in `server/services/matter`. |
| `EnergyEvseMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for EVSE devices. | No | electrical-vehicle-charge/charge-on (easy) | Not explicitly handled in `server/services/matter`. |
| `EnergyPreference` | This cluster provides an interface to specify preferences for how devices should consume energy. | No | — | Not explicitly handled in `server/services/matter`. |
| `EthernetNetworkDiagnostics` | The Ethernet Network Diagnostics Cluster provides a means to acquire standardized diagnostics metrics that may be used by a Node to assist a user or Administrator in diagnosing potential problems. | No | — | Not explicitly handled in `server/services/matter`. |
| `FanControl` | This cluster specifies an interface to control the speed of a fan. | Yes | fan/mode, fan/percent, fan/speed, fan/rock-setting, fan/wind-setting, fan/airflow-direction | Mode, percentage, speed, oscillation, wind, and airflow direction depending on supported features. |
| `FixedLabel` | This cluster is derived from the Label cluster and provides a feature for the device to tag an endpoint with zero or more read-only labels. | No | — | Not explicitly handled in `server/services/matter`. |
| `FlowMeasurement` | This cluster provides an interface to flow measurement functionality, including configuration and provision of notifications of flow measurements. | No | volume-sensor/decimal (easy) | Not explicitly handled in `server/services/matter`. |
| `FormaldehydeConcentrationMeasurement` | Measures formaldehyde concentration values reported by a sensor. | Yes | formaldehyd-sensor/decimal | Formaldehyde measurement. |
| `GeneralCommissioning` | This cluster is used to manage basic commissioning lifecycle. | No | — | Not explicitly handled in `server/services/matter`. |
| `GeneralDiagnostics` | The General Diagnostics Cluster, along with other diagnostics clusters, provide a means to acquire standardized diagnostics metrics that may be used by a Node to assist a user or Administrator in diagnosing potential problems. | No | — | Not explicitly handled in `server/services/matter`. |
| `GroupKeyManagement` | The Group Key Management cluster manages group keys for the node. | No | — | Not explicitly handled in `server/services/matter`. |
| `Groups` | The Groups cluster manages, per endpoint, the content of the node-wide Group Table that is part of the underlying interaction layer. | No | — | Not explicitly handled in `server/services/matter`. |
| `HepaFilterMonitoring` | Reports the condition and remaining lifetime of a HEPA filter. | Yes | hepa-filter-monitoring/filter-life-remaining | HEPA filter status/lifetime. |
| `IcdManagement` | ICD Management Cluster enables configuration of the ICD's behavior and ensuring that listed clients can be notified when an intermittently connected device, ICD, is available for communication. | No | — | Not explicitly handled in `server/services/matter`. |
| `Identify` | This cluster supports an endpoint identification state (e.g., flashing a light), that indicates to an observer (e.g., an installer) which of several nodes and/or endpoints it is. | No | — | Not explicitly handled in `server/services/matter`. |
| `IlluminanceMeasurement` | The Illuminance Measurement cluster provides an interface to illuminance measurement functionality, including configuration and provision of notifications of illuminance measurements. | Yes | light-sensor/decimal | Illuminance sensor. |
| `JointFabricAdministrator` | An instance of the Joint Fabric Administrator Cluster only applies to Joint Fabric Administrator nodes fulfilling the role of Anchor CA. | No | — | Not explicitly handled in `server/services/matter`. |
| `JointFabricDatastore` | The Joint Fabric Datastore Cluster is a cluster that provides a mechanism for the Joint Fabric Administrators to manage the set of Nodes, Groups, and Group membership among Nodes in the Joint Fabric. | No | — | Not explicitly handled in `server/services/matter`. |
| `KeypadInput` | This cluster provides an interface for key code based input and control on a device like a Video Player or an endpoint like a Content App. | No | television/enter, television/up, television/down, television/left, television/right (easy) | Not explicitly handled in `server/services/matter`. |
| `LaundryDryerControls` | This cluster provides a way to access options associated with the operation of a laundry dryer device type. | No | — | Not explicitly handled in `server/services/matter`. |
| `LaundryWasherControls` | This cluster provides a way to access options associated with the operation of a laundry washer device type. | No | — | Not explicitly handled in `server/services/matter`. |
| `LaundryWasherMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for laundry washer as well as laundry dryer devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `LevelControl` | Provides attributes and commands for changing a device level, typically brightness. | Yes | light/brightness | Brightness control. |
| `LocalizationConfiguration` | Nodes should be expected to be deployed to any and all regions of the world. | No | — | Not explicitly handled in `server/services/matter`. |
| `LowPower` | This cluster provides an interface for managing low power mode on a device. | No | — | Not explicitly handled in `server/services/matter`. |
| `MediaInput` | This cluster provides an interface for controlling the Input Selector on a media device such as a Video Player. | No | television/source (easy) | Not explicitly handled in `server/services/matter`. |
| `MediaPlayback` | This cluster provides an interface for controlling Media Playback (PLAY, PAUSE, etc) on a media device such as a TV, Set-top Box, or Smart Speaker. | No | television/play, television/pause, television/stop (easy) | Not explicitly handled in `server/services/matter`. |
| `Messages` | This cluster provides an interface for passing messages to be presented by a device. | No | — | Not explicitly handled in `server/services/matter`. |
| `MeterIdentification` | This Meter Identification Cluster provides attributes for determining advanced information about utility metering device. | No | — | Not explicitly handled in `server/services/matter`. |
| `MicrowaveOvenControl` | This cluster defines the requirements for the Microwave Oven Control cluster. | No | — | Not explicitly handled in `server/services/matter`. |
| `MicrowaveOvenMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for microwave oven devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `ModeSelect` | This cluster provides an interface for controlling a characteristic of a device that can be set to one of several predefined values. | No | — | Not explicitly handled in `server/services/matter`. |
| `NetworkCommissioning` | Network commissioning is part of the overall Node commissioning. | No | — | Not explicitly handled in `server/services/matter`. |
| `NitrogenDioxideConcentrationMeasurement` | Measures nitrogen dioxide concentration values reported by a sensor. | Yes | no2-matter-index-sensor/integer | NO2 index. |
| `OccupancySensing` | The server cluster provides an interface to occupancy sensing functionality based on one or more sensing modalities, including configuration and provision of notifications of occupancy status. | Yes | motion-sensor/binary | Presence/motion sensing. |
| `OnOff` | Provides attributes and commands for turning a device on and off. | Yes | switch/binary | Binary switch, read/write. |
| `OperationalCredentials` | This cluster is used to add or remove Node Operational credentials on a Commissionee or already-configured Node, as well as manage the associated Fabrics. | No | — | Not explicitly handled in `server/services/matter`. |
| `OperationalState` | This cluster supports remotely monitoring and, where supported, changing the operational state of any device where a state machine is a part of the operation. | No | — | Not explicitly handled in `server/services/matter`. |
| `OtaSoftwareUpdateProvider` | This cluster implements the Provider role in the OTA process. | No | — | Not explicitly handled in `server/services/matter`. |
| `OtaSoftwareUpdateRequestor` | This cluster implements the Requestor role in the OTA process. | No | — | Not explicitly handled in `server/services/matter`. |
| `OvenCavityOperationalState` | This cluster is derived from the Operational State cluster and provides an interface for monitoring the operational state of an oven. | No | — | Not explicitly handled in `server/services/matter`. |
| `OvenMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for oven devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `OzoneConcentrationMeasurement` | Measures ozone concentration values reported by a sensor. | No | voc-sensor/decimal (easy) | Not explicitly handled in `server/services/matter`. |
| `Pm10ConcentrationMeasurement` | Measures PM10 particulate concentration values reported by a sensor. | Yes | pm10-sensor/decimal | PM10 measurement. |
| `Pm1ConcentrationMeasurement` | Measures PM1 particulate concentration values reported by a sensor. | No | pm25-sensor/decimal (easy) | Not explicitly handled in `server/services/matter`. |
| `Pm25ConcentrationMeasurement` | Measures PM2.5 particulate concentration values reported by a sensor. | Yes | pm25-sensor/decimal | PM2.5 measurement. |
| `PowerSource` | Describes the power source of a device, including battery-related information when applicable. | Yes | battery/integer | Battery support when the `battery` feature is exposed. |
| `PowerSourceConfiguration` | This cluster is used to describe the configuration and capabilities of a Device's power system. | No | — | Not explicitly handled in `server/services/matter`. |
| `PowerTopology` | The Power Topology Cluster provides a mechanism for expressing how power is flowing between endpoints. | No | — | Not explicitly handled in `server/services/matter`. |
| `PressureMeasurement` | This cluster provides an interface to pressure measurement functionality, including configuration and provision of notifications of pressure measurements. | No | pressure-sensor/decimal (easy) | Not explicitly handled in `server/services/matter`. |
| `PumpConfigurationAndControl` | The Pump Configuration and Control cluster provides an interface for the setup and control of pump devices, and the automatic reporting of pump status information. | No | — | Not explicitly handled in `server/services/matter`. |
| `PushAvStreamTransport` | This cluster implements the upload of Audio and Video streams from the Camera AV Stream Management Cluster using suitable push-based transports. | No | — | Not explicitly handled in `server/services/matter`. |
| `RadonConcentrationMeasurement` | Measures radon concentration values reported by a sensor. | No | — | Not explicitly handled in `server/services/matter`. |
| `RefrigeratorAlarm` | This cluster is a derived cluster of Alarm Base cluster and provides the alarm definition related to refrigerator and temperature controlled cabinet devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `RefrigeratorAndTemperatureControlledCabinetMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for refrigerator and temperature controlled cabinet devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `RelativeHumidityMeasurement` | Measures relative humidity values reported by a sensor. | Yes | humidity-sensor/decimal | Relative humidity. |
| `RvcCleanMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for the cleaning type of robotic vacuum cleaner devices. | Yes | vacuum-cleaner/clean-mode | Robot vacuum cleaning mode. |
| `RvcOperationalState` | This cluster is derived from the Operational State cluster and provides an interface for monitoring the operational state of a robotic vacuum cleaner. | Yes | vacuum-cleaner/state, vacuum-cleaner/dock | State + return-to-base command. |
| `RvcRunMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for the running modes of robotic vacuum cleaner devices. | Yes | vacuum-cleaner/run-mode | Robot vacuum run mode. |
| `ScenesManagement` | The Scenes Management cluster provides attributes and commands for setting up and recalling scenes. | No | — | Not explicitly handled in `server/services/matter`. |
| `ServiceArea` | This cluster provides an interface for controlling the areas where a device should operate, for reporting the status at each area, and for querying the current area. | No | — | Not explicitly handled in `server/services/matter`. |
| `SmokeCoAlarm` | This cluster provides an interface for observing and managing the state of smoke and CO alarms. | No | smoke-sensor/binary, co-sensor/binary (easy) | Not explicitly handled in `server/services/matter`. |
| `SoftwareDiagnostics` | The Software Diagnostics Cluster provides a means to acquire standardized diagnostics metrics that may be used by a Node to assist a user or Administrator in diagnosing potential problems. | No | — | Not explicitly handled in `server/services/matter`. |
| `SoilMeasurement` | This cluster provides an interface to soil measurement functionality, including configuration and provision of notifications of soil measurements. | No | soil-moisture-sensor/decimal (easy) | Not explicitly handled in `server/services/matter`. |
| `Switch` | Provides switch state and button press/release events for user input devices. | Yes | button/click | Button press/release events. |
| `TargetNavigator` | This cluster provides an interface for UX navigation within a set of targets on a device or endpoint. | No | — | Not explicitly handled in `server/services/matter`. |
| `TemperatureControl` | This cluster provides an interface to the setpoint temperature on devices such as washers, refrigerators, and water heaters. | No | thermostat/target-temperature (easy) | Not explicitly handled in `server/services/matter`. |
| `TemperatureMeasurement` | This cluster provides an interface to temperature measurement functionality, including configuration and provision of notifications of temperature measurements. | Yes | temperature-sensor/decimal | Temperature sensor. |
| `Thermostat` | Provides temperature setpoints, local temperature, and HVAC control-related attributes and commands. | Yes | temperature-sensor/decimal, thermostat/target-temperature, air-conditioning/target-temperature | Local temperature + heating/cooling setpoints. |
| `ThermostatUserInterfaceConfiguration` | This cluster provides an interface to allow configuration of the user interface for a thermostat, or a thermostat controller device, that supports a keypad and LCD screen. | No | — | Not explicitly handled in `server/services/matter`. |
| `ThreadBorderRouterManagement` | This cluster provides an interface for managing a Thread Border Router and the Thread network that it belongs to. | No | — | Not explicitly handled in `server/services/matter`. |
| `ThreadNetworkDiagnostics` | The Thread Network Diagnostics Cluster provides a means to acquire standardized diagnostics metrics that may be used by a Node to assist a user or Administrator in diagnosing potential problems. | No | — | Not explicitly handled in `server/services/matter`. |
| `ThreadNetworkDirectory` | This cluster stores a list of Thread networks (including the credentials required to access each network), as well as a designation of the user's preferred network, to facilitate the sharing of Thread networks across fabrics. | No | — | Not explicitly handled in `server/services/matter`. |
| `TimeFormatLocalization` | Nodes should be expected to be deployed to any and all regions of the world. | No | — | Not explicitly handled in `server/services/matter`. |
| `TimeSynchronization` | Accurate time is required for a number of reasons, including scheduling, display and validating security materials. | No | — | Not explicitly handled in `server/services/matter`. |
| `TlsCertificateManagement` | This cluster is used to manage TLS CA Root and Client Certificates on a Node, which are then used by other clusters to provision and manage their usage of TLS. | No | — | Not explicitly handled in `server/services/matter`. |
| `TlsClientManagement` | This Cluster is used to provision TLS Endpoints with enough information to facilitate subsequent connection. | No | — | Not explicitly handled in `server/services/matter`. |
| `TotalVolatileOrganicCompoundsConcentrationMeasurement` | Measures total volatile organic compounds concentration values reported by a sensor. | Yes | voc-matter-index-sensor/integer | TVOC index. |
| `UnitLocalization` | Nodes should be expected to be deployed to any and all regions of the world. | No | — | Not explicitly handled in `server/services/matter`. |
| `UserLabel` | This cluster is derived from the Label cluster and provides a feature to tag an endpoint with zero or more writable labels. | No | — | Not explicitly handled in `server/services/matter`. |
| `ValveConfigurationAndControl` | This cluster is used to configure a valve. | No | switch/binary (easy) | Not explicitly handled in `server/services/matter`. |
| `WakeOnLan` | This cluster provides an interface for managing low power mode on a device that supports the Wake On LAN or Wake On Wireless LAN (WLAN) protocol (see [Wake On LAN]). | No | — | Not explicitly handled in `server/services/matter`. |
| `WaterHeaterManagement` | This cluster is used to allow clients to control the operation of a hot water heating appliance so that it can be used with energy management. | No | — | Not explicitly handled in `server/services/matter`. |
| `WaterHeaterMode` | This cluster is derived from the Mode Base cluster and defines additional mode tags and namespaced enumerated values for water heater devices. | No | — | Not explicitly handled in `server/services/matter`. |
| `WaterTankLevelMonitoring` | Reports the level or remaining fill state of a water tank. | No | level-sensor/liquid-level-percent (easy) | Not explicitly handled in `server/services/matter`. |
| `WebRtcTransportProvider` | The WebRTC transport provider cluster provides a way for stream providers (e.g. | No | — | Not explicitly handled in `server/services/matter`. |
| `WebRtcTransportRequestor` | The WebRTC transport requestor cluster provides a way for stream consumers (e.g. | No | — | Not explicitly handled in `server/services/matter`. |
| `WiFiNetworkDiagnostics` | The Wi-Fi Network Diagnostics Cluster provides a means to acquire standardized diagnostics metrics that may be used by a Node to assist a user or Administrator in diagnosing potential problems. | No | — | Not explicitly handled in `server/services/matter`. |
| `WiFiNetworkManagement` | This cluster provides an interface for getting information about the Wi-Fi network that a Network Infrastructure Manager device type provides. | No | — | Not explicitly handled in `server/services/matter`. |
| `WindowCovering` | The window covering cluster provides an interface for controlling and adjusting automatic window coverings such as drapery motors, automatic shades, curtains and blinds. | Yes | shutter/position, shutter/state | Position + open/close/stop commands. |
| `ZoneManagement` | This cluster provides an interface to manage regions of interest, or Zones, which can be either manufacturer or user defined. | No | — | Not explicitly handled in `server/services/matter`. |

## How the percentage is calculated

`26 / 132 = 19.7%`

This percentage reflects the number of Matter cluster definitions exported by `matter.js` that have explicit support in the current Gladys integration. It is a cluster support coverage indicator, not a guarantee that every device implementing a supported cluster will be fully interoperable across all feature combinations.

Clusters marked `(easy)` in the Gladys feature column are not counted in this percentage until Matter mapping is implemented, but they represent the lowest-effort integration candidates because the corresponding Gladys feature types already exist.
