# Tuya service

- [Tuya service](#tuya-service)
  - [References](#references)
  - [Development](#development)
  - [Gladys integration](#gladys-integration)
    - [Service](#service)
    - [Model](#model)
      - [Device](#device)
      - [Feature](#feature)
    - [Methods](#methods)
      - [setValue](#setvalue)
      - [poll or handle from cloud status notification](#poll-or-handle-from-cloud-status-notification)
  - [Tasks / status](#tasks--status)
  - [Known issues](#known-issues)

## References

- Cloud configuration: https://www.home-assistant.io/integrations/tuya/
- Offical links:
  - Cloud: https://iot.tuya.com/cloud/
  - API: https://developer.tuya.com/en/docs/iot/industrial-general-api?id=Kainbj5886ptz
  - API Explorer: https://iot.tuya.com/cloud/explorer
  - Devices: https://developer.tuya.com/en/docs/iot/standarddescription?id=K9i5ql6waswzq

## Development

Prefix all server files with `tuya.` to easily retrieve file accoring to service.
Add `@see` attribute in method comment to keep a link on official documentation.

## Gladys integration

### Service

We store Tuya parameters in Gladys service parameters:

| Parameter name  | Description           | How to value it?                                                                                                                                 |
|:----------------|:----------------------| :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENDPOINT`      | Tuya cloud endpoint   | This can be America / Europe / Asia regions.<br />So this should be configurable with a select box in front configuration page.                  |
| `ACCESS_KEY`    | Tuya cloud access key | This should be configurable with a select box in front configuration page.                                                                       |
| `SECRET_KEY`    | Tuya cloud secret key | This should be configurable with a select box in front configuration page.                                                                       |
| `ACCESS_TOKEN`  | Tuya access token     | Hidden parameter.<br/>Once well connected on Tuya cloud, we store access token in database to be able to concat Tuya cloud after Gladys restart  |
| `REFRESH_TOKEN` | Tuya refresh token    | Hidden parameter.<br/>Once well connected on Tuya cloud, we store refresh token in database to be able to concat Tuya cloud after Gladys restart |

### Model

#### Device

**TO DO**

See `./lib/device/tuya.convertDevice.js`.

#### Feature

**TO BE CONTINUED**

See `./lib/device/feature/tuya.convertFeature.js` and `./lib/device/feature/tuya.categoryAndTypeMapping.js`.

See [Standard Instruction Set](https://developer.tuya.com/en/docs/iot/standarddescription?id=K9i5ql6waswzq) and [API Explorer](https://eu.iot.tuya.com/cloud/explorer?id=p1647713582274pcmspf&groupId=group-1374245668893237312&interfaceId=1468907137894715400).

| Gladys attribute | Tuya attribute                      | Description                                                                                                                                                                                                                                                                     | File                                         |
| :--------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------- |
| `name`           | `(functions\|status)[].name`        | Each Tuya device has alread a name                                                                                                                                                                                                                                              | `tuya.convertFeature.js`                     |
| `category`       | `category`                          | Each Tuya device is identified by a category (ex. "dj" for simple Light).<br /> But we have to map each Tuya known category to Gladys category.<br />This mapping can't be dynamic.                                                                                             | `tuya.categoryAndTypeMapping.js`             |
| `type`           | `(functions\|status)[].code`        | Each device code defines a feature.<br />A code can be in "functions" (refers "instruction set"), or in "status" (refers "status set"), or both.                                                                                                                                |                                              |
| `unit`           | `(functions\|status)[].values.unit` | If a unit is defined in Tuya value definition, we map it.<br /> Units are mapped only for Tuya "integer" type.                                                                                                                                                                  | `tuya.convertUnit.js`<br />`tuya.integer.js` |
| `min`            | `(functions\|status)[].values.min`  | If a minimum value is defined in Tuya value definition, we map it.<br /> Minimum values are mapped only for Tuya "integer" and "enum" types.                                                                                                                                    | `tuya.integer.js`<br />`tuya.enum.js`        |
| `max`            | `(functions\|status)[].values.max`  | If a maximum value is defined in Tuya value definition, we map it.<br /> Maximum values are mapped only for Tuya "integer" type, but is defined on according available value length for "enum" type.                                                                            | `tuya.integer.js`<br />`tuya.enum.js`        |
| `read_only`      | N/A                                 | The read only flag should be based on Tuya "instruction set" for actuator, "status set" for sensor. <br />If a Tuya feature code is only in "status set", so Gladys should consider it as read only.                                                                            |                                              |
| `has_feedback`   | N/A                                 | The feedback flag should be set to true only once [Device status notification](#tasks--status) is done. based on Tuya "instruction set" for actuator, "status set" for sensor. <br />If a Tuya feature code is only in "status set", so Gladys should consider it as read only. |                                              |

### Methods

**TO DO**

#### setValue

**TO DO**

#### poll or handle from cloud status notification

**TO DO**

## Tasks / status

- **DONE** Gladys to Tuya connection
  - **DONE** Store Tuya parameters (credentials, URL...)
  - **DONE** CLoud connection
  - **DONE** Connect on boot
  - **DONE** Disconnect on shutdown
- **IN PROGRESS** Device
  - **DONE** Cloud discover
  - **IN PROGRESS** Feature mapping
  - **IN PROGRESS** Device mapping
  - **TO DO** Device status notification (MQTT ?)
  - **TO DO** Send device action to Tuya cloud (Gladys setValue)
- **TO DO** Front part
- **TO DO** Cypress automation tests

## Known issues

- Login error: https://community.home-assistant.io/t/tuya-integration-problem-login-error-1013-request-time-is-invalid/386231
