import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import BatteryLevelFeature from '../../../../components/device/view/BatteryLevelFeature';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import {
  GITHUB_BASE_URL,
  PARAMS,
  SUPPORTED_CATEGORY_TYPE
} from '../../../../../../server/services/tessie/lib/utils/tessie.constants';
import styles from './style.css';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

const createGithubUrl = device => {
  const title = encodeURIComponent(`Tessie: Add device ${device.model}`);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(device, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

class TessieDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device,
      user: this.props.user
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      device: nextProps.device
    });
  }

  updateName = e => {
    this.setState({
      device: {
        ...this.state.device,
        name: e.target.value
      }
    });
  };

  updateRoom = e => {
    this.setState({
      device: {
        ...this.state.device,
        room_id: e.target.value
      }
    });
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      this.state.device = {
	"id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
	"service_id": "3b6e05eb-708c-422d-a6a3-a94c12518839",
	"room_id": null,
	"name": "Tahiti",
	"selector": "tessie-xp7ygces3sb598663",
	"model": "tesla-modely-pearlwhite",
	"external_id": "tessie:XP7YGCES3SB598663",
	"should_poll": false,
	"poll_frequency": null,
	"created_at": "2025-06-19T12:48:03.152Z",
	"updated_at": "2025-06-19T12:48:03.152Z",
	"features": [
		{
			"id": "ab0182c9-8b70-4639-8adf-933bfb999884",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Battery Level",
			"selector": "tessie-xp7ygces3sb598663-battery-level",
			"external_id": "tessie:XP7YGCES3SB598663:battery_level",
			"category": "electrical-vehicle-battery",
			"type": "battery-level",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "percent",
			"min": 0,
			"max": 100,
			"last_value": 98,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.898Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.165Z",
			"updated_at": "2025-06-20T09:35:27.898Z",
			"last_value_is_too_old": false
		},
		{
			"id": "a3e688fb-de81-4f88-ac07-75ab3400e80b",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Battery energy remaining",
			"selector": "tessie-xp7ygces3sb598663-battery-energy-remaining",
			"external_id": "tessie:XP7YGCES3SB598663:battery_energy_remaining",
			"category": "electrical-vehicle-battery",
			"type": "battery-energy-remaining",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour",
			"min": 0,
			"max": 74,
			"last_value": 76.259995,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.899Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.166Z",
			"updated_at": "2025-06-20T09:35:27.899Z",
			"last_value_is_too_old": false
		},
		{
			"id": "22178abf-72b4-4493-9656-444cdc69a9ca",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Battery range estimate",
			"selector": "tessie-xp7ygces3sb598663-battery-range-estimate",
			"external_id": "tessie:XP7YGCES3SB598663:battery_range_estimate",
			"category": "electrical-vehicle-battery",
			"type": "battery-range-estimate",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile",
			"min": 0,
			"max": 523,
			"last_value": 318.41,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.899Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.166Z",
			"updated_at": "2025-06-20T09:35:27.899Z",
			"last_value_is_too_old": false
		},
		{
			"id": "fc5a9e04-2915-4f7e-a170-2e658b800e31",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Battery power",
			"selector": "tessie-xp7ygces3sb598663-battery-power",
			"external_id": "tessie:XP7YGCES3SB598663:battery_power",
			"category": "electrical-vehicle-battery",
			"type": "battery-power",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "watt",
			"min": 0,
			"max": 10000,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.899Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.167Z",
			"updated_at": "2025-06-20T09:35:27.899Z",
			"last_value_is_too_old": false
		},
		{
			"id": "63b4f845-80a0-49b2-9aa7-6c8065396dbb",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Battery temperature min",
			"selector": "tessie-xp7ygces3sb598663-battery-temperature-min",
			"external_id": "tessie:XP7YGCES3SB598663:battery_temperature_min",
			"category": "electrical-vehicle-battery",
			"type": "battery-temperature",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "celsius",
			"min": -50,
			"max": 100,
			"last_value": 26,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.900Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.167Z",
			"updated_at": "2025-06-20T09:35:27.900Z",
			"last_value_is_too_old": false
		},
		{
			"id": "dddf6ff5-9079-4968-927b-4c9b393966b9",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Battery temperature max",
			"selector": "tessie-xp7ygces3sb598663-battery-temperature-max",
			"external_id": "tessie:XP7YGCES3SB598663:battery_temperature_max",
			"category": "electrical-vehicle-battery",
			"type": "battery-temperature",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "celsius",
			"min": -50,
			"max": 100,
			"last_value": 26.5,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.902Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.167Z",
			"updated_at": "2025-06-20T09:35:27.902Z",
			"last_value_is_too_old": false
		},
		{
			"id": "ba3a5f1a-5e35-4d32-a737-84cf81573ebc",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Battery voltage",
			"selector": "tessie-xp7ygces3sb598663-battery-voltage",
			"external_id": "tessie:XP7YGCES3SB598663:battery_voltage",
			"category": "electrical-vehicle-battery",
			"type": "battery-voltage",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "volt",
			"min": 0,
			"max": 1000,
			"last_value": 397.16,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.902Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.168Z",
			"updated_at": "2025-06-20T09:35:27.902Z",
			"last_value_is_too_old": false
		},
		{
			"id": "3532ea81-8936-4de1-a8ce-4101b10df834",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Charge current",
			"selector": "tessie-xp7ygces3sb598663-charge-current",
			"external_id": "tessie:XP7YGCES3SB598663:charge_current",
			"category": "electrical-vehicle-charge",
			"type": "charge-current",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "ampere",
			"min": 0,
			"max": 100,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.264Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.168Z",
			"updated_at": "2025-06-20T07:51:38.265Z",
			"last_value_is_too_old": false
		},
		{
			"id": "185a909b-6ee5-4c64-acd0-2b233568737d",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Charge energy added total",
			"selector": "tessie-xp7ygces3sb598663-charge-energy-added-total",
			"external_id": "tessie:XP7YGCES3SB598663:charge_energy_added_total",
			"category": "electrical-vehicle-charge",
			"type": "charge-energy-added-total",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour",
			"min": 0,
			"max": 999999999,
			"last_value": 1655.7499999999998,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.266Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.169Z",
			"updated_at": "2025-06-20T07:51:38.266Z",
			"last_value_is_too_old": false
		},
		{
			"id": "c949ff79-961d-489a-8ee3-f001199d29a4",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Charge energy consumption total",
			"selector": "tessie-xp7ygces3sb598663-charge-energy-consumption-total",
			"external_id": "tessie:XP7YGCES3SB598663:charge_energy_consumption_total",
			"category": "electrical-vehicle-charge",
			"type": "charge-energy-consumption-total",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour",
			"min": 0,
			"max": 999999999,
			"last_value": 1744.930000000001,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.267Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.169Z",
			"updated_at": "2025-06-20T07:51:38.267Z",
			"last_value_is_too_old": false
		},
		{
			"id": "13091433-3c2d-4c1f-9e07-0a4f044074d4",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Charge on",
			"selector": "tessie-xp7ygces3sb598663-charge-on",
			"external_id": "tessie:XP7YGCES3SB598663:charge_on",
			"category": "electrical-vehicle-charge",
			"type": "charge-on",
			"read_only": false,
			"keep_history": true,
			"has_feedback": true,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.268Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.170Z",
			"updated_at": "2025-06-20T07:51:38.268Z",
			"last_value_is_too_old": false
		},
		{
			"id": "a81a77c3-502f-488a-a70e-447359712f04",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Charge power",
			"selector": "tessie-xp7ygces3sb598663-charge-power",
			"external_id": "tessie:XP7YGCES3SB598663:charge_power",
			"category": "electrical-vehicle-charge",
			"type": "charge-power",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "watt",
			"min": 0,
			"max": 1000000,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.269Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.170Z",
			"updated_at": "2025-06-20T07:51:38.269Z",
			"last_value_is_too_old": false
		},
		{
			"id": "329f5156-edba-440e-843f-f727d2dbb6f9",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Charge voltage",
			"selector": "tessie-xp7ygces3sb598663-charge-voltage",
			"external_id": "tessie:XP7YGCES3SB598663:charge_voltage",
			"category": "electrical-vehicle-charge",
			"type": "charge-voltage",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "volt",
			"min": 0,
			"max": 1000,
			"last_value": 1,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.270Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.171Z",
			"updated_at": "2025-06-20T07:51:38.271Z",
			"last_value_is_too_old": false
		},
		{
			"id": "a913585a-bdd1-4ee5-978c-99e61902b4d7",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last charge energy added",
			"selector": "tessie-xp7ygces3sb598663-last-charge-energy-added",
			"external_id": "tessie:XP7YGCES3SB598663:last_charge_energy_added",
			"category": "electrical-vehicle-charge",
			"type": "last-charge-energy-added",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour",
			"min": 0,
			"max": 999999999,
			"last_value": 41.88,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.271Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.171Z",
			"updated_at": "2025-06-20T07:51:38.272Z",
			"last_value_is_too_old": false
		},
		{
			"id": "6c251c46-0ab8-463e-b937-c69ae8d603e6",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last charge energy consumption",
			"selector": "tessie-xp7ygces3sb598663-last-charge-energy-consumption",
			"external_id": "tessie:XP7YGCES3SB598663:last_charge_energy_consumption",
			"category": "electrical-vehicle-charge",
			"type": "last-charge-energy-consumption",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour",
			"min": 0,
			"max": 999999999,
			"last_value": 43.36,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.272Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.171Z",
			"updated_at": "2025-06-20T07:51:38.272Z",
			"last_value_is_too_old": false
		},
		{
			"id": "b2f5c2a6-3f93-4eb2-8f66-c934049cfdfd",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Plugged",
			"selector": "tessie-xp7ygces3sb598663-plugged",
			"external_id": "tessie:XP7YGCES3SB598663:plugged",
			"category": "electrical-vehicle-charge",
			"type": "plugged",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.273Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.172Z",
			"updated_at": "2025-06-20T07:51:38.273Z",
			"last_value_is_too_old": false
		},
		{
			"id": "9808c875-ba9e-481f-a7f5-7d3718238b4a",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Target charge limit",
			"selector": "tessie-xp7ygces3sb598663-target-charge-limit",
			"external_id": "tessie:XP7YGCES3SB598663:target_charge_limit",
			"category": "electrical-vehicle-charge",
			"type": "target-charge-limit",
			"read_only": false,
			"keep_history": true,
			"has_feedback": true,
			"unit": "percent",
			"min": 50,
			"max": 100,
			"last_value": 100,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.274Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.172Z",
			"updated_at": "2025-06-20T07:51:38.274Z",
			"last_value_is_too_old": false
		},
		{
			"id": "494c43cd-df1d-4e95-bdd9-ef8e97b52a2e",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Target current",
			"selector": "tessie-xp7ygces3sb598663-target-current",
			"external_id": "tessie:XP7YGCES3SB598663:target_current",
			"category": "electrical-vehicle-charge",
			"type": "target-current",
			"read_only": false,
			"keep_history": true,
			"has_feedback": true,
			"unit": "ampere",
			"min": 0,
			"max": 16,
			"last_value": 16,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.275Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.181Z",
			"updated_at": "2025-06-20T07:51:38.276Z",
			"last_value_is_too_old": false
		},
		{
			"id": "8ba6ba1e-47e1-4293-bbff-194a468e573c",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Climate on",
			"selector": "tessie-xp7ygces3sb598663-climate-on",
			"external_id": "tessie:XP7YGCES3SB598663:climate_on",
			"category": "electrical-vehicle-climate",
			"type": "climate-on",
			"read_only": false,
			"keep_history": true,
			"has_feedback": true,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.903Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.182Z",
			"updated_at": "2025-06-20T09:35:27.903Z",
			"last_value_is_too_old": false
		},
		{
			"id": "2785c5d9-8a25-4549-81d7-bb016b05c6fb",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Indoor temperature",
			"selector": "tessie-xp7ygces3sb598663-indoor-temperature",
			"external_id": "tessie:XP7YGCES3SB598663:indoor_temperature",
			"category": "electrical-vehicle-climate",
			"type": "indoor-temperature",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "celsius",
			"min": -50,
			"max": 50,
			"last_value": 23.9,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.903Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.182Z",
			"updated_at": "2025-06-20T09:35:27.903Z",
			"last_value_is_too_old": false
		},
		{
			"id": "52528d06-4a80-4228-a656-6d9d01209727",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Outside temperature",
			"selector": "tessie-xp7ygces3sb598663-outside-temperature",
			"external_id": "tessie:XP7YGCES3SB598663:outside_temperature",
			"category": "electrical-vehicle-climate",
			"type": "outside-temperature",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "celsius",
			"min": -50,
			"max": 50,
			"last_value": 20.5,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.904Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.183Z",
			"updated_at": "2025-06-20T09:35:27.904Z",
			"last_value_is_too_old": false
		},
		{
			"id": "92f38bfd-074d-4610-b03b-0376fc6c9f2f",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Target temperature",
			"selector": "tessie-xp7ygces3sb598663-target-temperature",
			"external_id": "tessie:XP7YGCES3SB598663:target_temperature",
			"category": "electrical-vehicle-climate",
			"type": "target-temperature",
			"read_only": false,
			"keep_history": true,
			"has_feedback": true,
			"unit": "celsius",
			"min": 15,
			"max": 28,
			"last_value": 21,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.904Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.183Z",
			"updated_at": "2025-06-20T09:35:27.904Z",
			"last_value_is_too_old": false
		},
		{
			"id": "12085da6-c274-4356-8205-0b740a70c9db",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Alarm",
			"selector": "tessie-xp7ygces3sb598663-alarm",
			"external_id": "tessie:XP7YGCES3SB598663:alarm",
			"category": "electrical-vehicle-command",
			"type": "alarm",
			"read_only": false,
			"keep_history": true,
			"has_feedback": true,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.904Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.183Z",
			"updated_at": "2025-06-20T09:35:27.904Z",
			"last_value_is_too_old": false
		},
		{
			"id": "9677a791-486d-41d1-8757-20f86b9e63cb",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Lock",
			"selector": "tessie-xp7ygces3sb598663-lock",
			"external_id": "tessie:XP7YGCES3SB598663:lock",
			"category": "electrical-vehicle-command",
			"type": "lock",
			"read_only": false,
			"keep_history": true,
			"has_feedback": true,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:27.905Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.184Z",
			"updated_at": "2025-06-20T09:35:27.905Z",
			"last_value_is_too_old": false
		},
		{
			"id": "dfe8fdf7-1dd3-4521-a8f7-c9fe556f5062",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Drive energy consumption total",
			"selector": "tessie-xp7ygces3sb598663-drive-energy-consumption-total",
			"external_id": "tessie:XP7YGCES3SB598663:drive_energy_consumption_total",
			"category": "electrical-vehicle-drive",
			"type": "drive-energy-consumption-total",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour",
			"min": 0,
			"max": 999999999,
			"last_value": 1377.7799999999975,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.913Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.184Z",
			"updated_at": "2025-06-20T07:51:38.914Z",
			"last_value_is_too_old": false
		},
		{
			"id": "f13087bf-13a2-454a-9a9e-a9fae473a432",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Speed",
			"selector": "tessie-xp7ygces3sb598663-speed",
			"external_id": "tessie:XP7YGCES3SB598663:speed",
			"category": "electrical-vehicle-drive",
			"type": "speed",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile-per-hour",
			"min": 0,
			"max": 250,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.914Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.185Z",
			"updated_at": "2025-06-20T07:51:38.914Z",
			"last_value_is_too_old": false
		},
		{
			"id": "75e31ba0-78d3-462b-9934-c7890e0b61c6",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive energy consumption",
			"selector": "tessie-xp7ygces3sb598663-last-drive-energy-consumption",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_energy_consumption",
			"category": "electrical-vehicle-drive",
			"type": "drive-energy-consumption-total",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour",
			"min": 0,
			"max": 1000,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.914Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.185Z",
			"updated_at": "2025-06-20T07:51:38.915Z",
			"last_value_is_too_old": false
		},
		{
			"id": "4e0f77c2-f1cb-40df-81c1-861f31363bd7",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive distance",
			"selector": "tessie-xp7ygces3sb598663-last-drive-distance",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_distance",
			"category": "electrical-vehicle-state",
			"type": "odometer",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile",
			"min": 0,
			"max": 1000,
			"last_value": 0.01,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.915Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.185Z",
			"updated_at": "2025-06-20T07:51:38.915Z",
			"last_value_is_too_old": false
		},
		{
			"id": "7e59dd21-976f-4d35-9eb1-f40e0bab36c6",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive average speed",
			"selector": "tessie-xp7ygces3sb598663-last-drive-average-speed",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_average_speed",
			"category": "electrical-vehicle-drive",
			"type": "speed",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile-per-hour",
			"min": 0,
			"max": 250,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.915Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.186Z",
			"updated_at": "2025-06-20T07:51:38.915Z",
			"last_value_is_too_old": false
		},
		{
			"id": "01175c44-bd0d-49d8-a57f-529ebcf23928",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive max speed",
			"selector": "tessie-xp7ygces3sb598663-last-drive-max-speed",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_max_speed",
			"category": "electrical-vehicle-drive",
			"type": "speed",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile-per-hour",
			"min": 0,
			"max": 250,
			"last_value": 1,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.916Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.186Z",
			"updated_at": "2025-06-20T07:51:38.916Z",
			"last_value_is_too_old": false
		},
		{
			"id": "da7bffed-7f7d-4ba7-bc6e-7b5d9a2769ac",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive average inside temperature",
			"selector": "tessie-xp7ygces3sb598663-last-drive-average-inside-temperature",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_average_inside_temperature",
			"category": "electrical-vehicle-climate",
			"type": "indoor-temperature",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "celsius",
			"min": -50,
			"max": 100,
			"last_value": 21.9,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.916Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.187Z",
			"updated_at": "2025-06-20T07:51:38.916Z",
			"last_value_is_too_old": false
		},
		{
			"id": "f8818e09-893c-4a43-b7c4-eb504780cee7",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive average outside temperature",
			"selector": "tessie-xp7ygces3sb598663-last-drive-average-outside-temperature",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_average_outside_temperature",
			"category": "electrical-vehicle-climate",
			"type": "outside-temperature",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "celsius",
			"min": -50,
			"max": 100,
			"last_value": 20.5,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.917Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.187Z",
			"updated_at": "2025-06-20T07:51:38.917Z",
			"last_value_is_too_old": false
		},
		{
			"id": "9d578945-eef9-4575-962d-5179bf3ce19b",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive starting battery",
			"selector": "tessie-xp7ygces3sb598663-last-drive-starting-battery",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_starting_battery",
			"category": "electrical-vehicle-battery",
			"type": "battery-level",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "percent",
			"min": 0,
			"max": 100,
			"last_value": 98,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.917Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.187Z",
			"updated_at": "2025-06-20T07:51:38.917Z",
			"last_value_is_too_old": false
		},
		{
			"id": "41bbd6b7-8525-40c2-a044-710d653ae8f9",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Last drive ending battery",
			"selector": "tessie-xp7ygces3sb598663-last-drive-ending-battery",
			"external_id": "tessie:XP7YGCES3SB598663:last_drive_ending_battery",
			"category": "electrical-vehicle-battery",
			"type": "battery-level",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "percent",
			"min": 0,
			"max": 100,
			"last_value": 98,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T07:51:38.917Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.188Z",
			"updated_at": "2025-06-20T07:51:38.918Z",
			"last_value_is_too_old": false
		},
		{
			"id": "d4379843-8cd4-40f6-a21f-0c505b13ab99",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Energy consumption kWh/100km",
			"selector": "tessie-xp7ygces3sb598663-energy-consumption-100mile",
			"external_id": "tessie:XP7YGCES3SB598663:energy_consumption_100mile",
			"category": "electrical-vehicle-consumption",
			"type": "energy-consumption",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour-per-100-mile",
			"min": 0,
			"max": 200,
			"last_value": 23.89937106918239,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.206Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.188Z",
			"updated_at": "2025-06-20T09:35:28.207Z",
			"last_value_is_too_old": false
		},
		{
			"id": "bc859287-ffd7-4d12-b31e-999e09ae1645",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Energy consumption kWh/100km by driving",
			"selector": "tessie-xp7ygces3sb598663-energy-consumption-100mile-by-driving",
			"external_id": "tessie:XP7YGCES3SB598663:energy_consumption_100mile_by_driving",
			"category": "electrical-vehicle-consumption",
			"type": "energy-consumption",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "kilowatt-hour-per-100-mile",
			"min": 0,
			"max": 200,
			"last_value": 21.792618629173988,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.207Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.189Z",
			"updated_at": "2025-06-20T09:35:28.207Z",
			"last_value_is_too_old": false
		},
		{
			"id": "deaf8d6c-bca9-4ab4-a879-20224ce66158",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Energy consumption Wh/km",
			"selector": "tessie-xp7ygces3sb598663-energy-consumption-mile",
			"external_id": "tessie:XP7YGCES3SB598663:energy_consumption_mile",
			"category": "electrical-vehicle-consumption",
			"type": "energy-consumption",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "watt-hour-per-mile",
			"min": 0,
			"max": 2000,
			"last_value": 316.6666666666667,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.208Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.189Z",
			"updated_at": "2025-06-20T09:35:28.208Z",
			"last_value_is_too_old": false
		},
		{
			"id": "f81acd97-bcd8-419d-ba98-152786c65653",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Energy consumption Wh/km by driving",
			"selector": "tessie-xp7ygces3sb598663-energy-consumption-mile-by-driving",
			"external_id": "tessie:XP7YGCES3SB598663:energy_consumption_mile_by_driving",
			"category": "electrical-vehicle-consumption",
			"type": "energy-consumption",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "watt-hour-per-mile",
			"min": 0,
			"max": 2000,
			"last_value": 258.33333333333339,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.208Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.189Z",
			"updated_at": "2025-06-20T09:35:28.208Z",
			"last_value_is_too_old": false
		},
		{
			"id": "98f47471-f829-40b7-8f45-c5358071c881",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Energy efficiency",
			"selector": "tessie-xp7ygces3sb598663-energy-efficiency",
			"external_id": "tessie:XP7YGCES3SB598663:energy_efficiency",
			"category": "electrical-vehicle-consumption",
			"type": "energy-efficiency",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile-per-kilowatt-hour",
			"min": 0,
			"max": 999999999,
			"last_value": 3.1578947368421055,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.209Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.190Z",
			"updated_at": "2025-06-20T09:35:28.209Z",
			"last_value_is_too_old": false
		},
		{
			"id": "ea2ae8b0-1527-4cf8-807d-22e515380790",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Energy efficiency by driving",
			"selector": "tessie-xp7ygces3sb598663-energy-efficiency-by-driving",
			"external_id": "tessie:XP7YGCES3SB598663:energy_efficiency_by_driving",
			"category": "electrical-vehicle-consumption",
			"type": "energy-efficiency",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile-per-kilowatt-hour",
			"min": 0,
			"max": 999999999,
			"last_value": 3.8709677419354837,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.209Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.190Z",
			"updated_at": "2025-06-20T09:35:28.209Z",
			"last_value_is_too_old": false
		},
		{
			"id": "89659a79-a0fd-4473-8a01-c8ee3a412723",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Front driver door opened",
			"selector": "tessie-xp7ygces3sb598663-door-df-opened",
			"external_id": "tessie:XP7YGCES3SB598663:door_df_opened",
			"category": "electrical-vehicle-state",
			"type": "door-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.209Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.190Z",
			"updated_at": "2025-06-20T09:35:28.209Z",
			"last_value_is_too_old": false
		},
		{
			"id": "5c25f1fb-3d54-4f65-a238-a839b435a1bb",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Front passenger door opened",
			"selector": "tessie-xp7ygces3sb598663-door-pf-opened",
			"external_id": "tessie:XP7YGCES3SB598663:door_pf_opened",
			"category": "electrical-vehicle-state",
			"type": "door-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.210Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.190Z",
			"updated_at": "2025-06-20T09:35:28.210Z",
			"last_value_is_too_old": false
		},
		{
			"id": "e4d30d1a-f604-438c-8bba-243483efc87e",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Rear driver door opened",
			"selector": "tessie-xp7ygces3sb598663-door-dr-opened",
			"external_id": "tessie:XP7YGCES3SB598663:door_dr_opened",
			"category": "electrical-vehicle-state",
			"type": "door-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.210Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.191Z",
			"updated_at": "2025-06-20T09:35:28.210Z",
			"last_value_is_too_old": false
		},
		{
			"id": "15e90ee3-4961-485c-9d2f-7e502150d5e8",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Rear passenger door opened",
			"selector": "tessie-xp7ygces3sb598663-door-pr-opened",
			"external_id": "tessie:XP7YGCES3SB598663:door_pr_opened",
			"category": "electrical-vehicle-state",
			"type": "door-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.210Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.191Z",
			"updated_at": "2025-06-20T09:35:28.210Z",
			"last_value_is_too_old": false
		},
		{
			"id": "3ffbda0a-58bd-4e6b-82eb-70b70a5ad367",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Frunk opened",
			"selector": "tessie-xp7ygces3sb598663-door-ft-opened",
			"external_id": "tessie:XP7YGCES3SB598663:door_ft_opened",
			"category": "electrical-vehicle-state",
			"type": "door-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.211Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.191Z",
			"updated_at": "2025-06-20T09:35:28.211Z",
			"last_value_is_too_old": false
		},
		{
			"id": "d56cb043-515d-404e-b5ad-34e999663c0e",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Rear trunk opened",
			"selector": "tessie-xp7ygces3sb598663-door-rt-opened",
			"external_id": "tessie:XP7YGCES3SB598663:door_rt_opened",
			"category": "electrical-vehicle-state",
			"type": "door-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.211Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.192Z",
			"updated_at": "2025-06-20T09:35:28.211Z",
			"last_value_is_too_old": false
		},
		{
			"id": "67ff0241-5d35-4788-b396-72d3d4862675",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Odometer",
			"selector": "tessie-xp7ygces3sb598663-odometer",
			"external_id": "tessie:XP7YGCES3SB598663:odometer",
			"category": "electrical-vehicle-state",
			"type": "odometer",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "mile",
			"min": 0,
			"max": 999999999,
			"last_value": 4946.767365,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.211Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.192Z",
			"updated_at": "2025-06-20T09:35:28.211Z",
			"last_value_is_too_old": false
		},
		{
			"id": "e1b74db3-7e07-4bf2-bbd9-9fb46b934b97",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Front left tire pressure",
			"selector": "tessie-xp7ygces3sb598663-tire-pressure-fl",
			"external_id": "tessie:XP7YGCES3SB598663:tire_pressure_fl",
			"category": "electrical-vehicle-state",
			"type": "tire-pressure",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "bar",
			"min": 0,
			"max": 5,
			"last_value": 2.825,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.212Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.192Z",
			"updated_at": "2025-06-20T09:35:28.212Z",
			"last_value_is_too_old": false
		},
		{
			"id": "7f34f5f6-abdf-4249-9101-80494f7c8e65",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Front right tire pressure",
			"selector": "tessie-xp7ygces3sb598663-tire-pressure-fr",
			"external_id": "tessie:XP7YGCES3SB598663:tire_pressure_fr",
			"category": "electrical-vehicle-state",
			"type": "tire-pressure",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "bar",
			"min": 0,
			"max": 5,
			"last_value": 2.85,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.213Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.203Z",
			"updated_at": "2025-06-20T09:35:28.213Z",
			"last_value_is_too_old": false
		},
		{
			"id": "a31d47f5-7844-4159-a97f-7519a6e2d9f1",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Rear left tire pressure",
			"selector": "tessie-xp7ygces3sb598663-tire-pressure-rl",
			"external_id": "tessie:XP7YGCES3SB598663:tire_pressure_rl",
			"category": "electrical-vehicle-state",
			"type": "tire-pressure",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "bar",
			"min": 0,
			"max": 5,
			"last_value": 2.85,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.214Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.203Z",
			"updated_at": "2025-06-20T09:35:28.214Z",
			"last_value_is_too_old": false
		},
		{
			"id": "ffabd20d-144f-4c10-943b-c2a72ee7825b",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Rear right tire pressure",
			"selector": "tessie-xp7ygces3sb598663-tire-pressure-rr",
			"external_id": "tessie:XP7YGCES3SB598663:tire_pressure_rr",
			"category": "electrical-vehicle-state",
			"type": "tire-pressure",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": "bar",
			"min": 0,
			"max": 5,
			"last_value": 2.825,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.214Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.203Z",
			"updated_at": "2025-06-20T09:35:28.214Z",
			"last_value_is_too_old": false
		},
		{
			"id": "8bb4b1c7-4c1b-405a-9c4f-e619e1b6f3d9",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Front driver window opened",
			"selector": "tessie-xp7ygces3sb598663-window-fd-opened",
			"external_id": "tessie:XP7YGCES3SB598663:window_fd_opened",
			"category": "electrical-vehicle-state",
			"type": "window-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.214Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.204Z",
			"updated_at": "2025-06-20T09:35:28.214Z",
			"last_value_is_too_old": false
		},
		{
			"id": "191dc8a2-1a45-4e3f-a387-4e4d6d9a67b8",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Front passenger window opened",
			"selector": "tessie-xp7ygces3sb598663-window-fp-opened",
			"external_id": "tessie:XP7YGCES3SB598663:window_fp_opened",
			"category": "electrical-vehicle-state",
			"type": "window-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.215Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.204Z",
			"updated_at": "2025-06-20T09:35:28.215Z",
			"last_value_is_too_old": false
		},
		{
			"id": "5281cf4e-d285-4c70-a1a5-aa99445f3d55",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Rear driver window opened",
			"selector": "tessie-xp7ygces3sb598663-window-rd-opened",
			"external_id": "tessie:XP7YGCES3SB598663:window_rd_opened",
			"category": "electrical-vehicle-state",
			"type": "window-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.215Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.204Z",
			"updated_at": "2025-06-20T09:35:28.215Z",
			"last_value_is_too_old": false
		},
		{
			"id": "c73dd1d6-8bef-4bf1-955c-3e7c7da230f2",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "Rear passenger window opened",
			"selector": "tessie-xp7ygces3sb598663-window-rp-opened",
			"external_id": "tessie:XP7YGCES3SB598663:window_rp_opened",
			"category": "electrical-vehicle-state",
			"type": "window-opened",
			"read_only": true,
			"keep_history": true,
			"has_feedback": false,
			"unit": null,
			"min": 0,
			"max": 1,
			"last_value": 0,
			"last_value_string": null,
			"last_value_changed": "2025-06-20T09:35:28.216Z",
			"last_hourly_aggregate": null,
			"last_daily_aggregate": null,
			"last_monthly_aggregate": null,
			"created_at": "2025-06-19T12:48:03.204Z",
			"updated_at": "2025-06-20T09:35:28.216Z",
			"last_value_is_too_old": false
		}
	],
	"params": [
		{
			"id": "f25d2c52-f333-42da-96af-a44b636f7b7f",
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "vehicle_vin",
			"value": "XP7YGCES3SB598663",
			"created_at": "2025-06-19T12:48:03.428Z",
			"updated_at": "2025-06-19T12:48:03.428Z"
		},
		{
			"device_id": "b5c3ab86-bde2-410a-aa20-a61f0bb49835",
			"name": "vehicle_version",
			"value": "long-range",
		},
	],
	"room": null,
	"service": {
		"id": "3b6e05eb-708c-422d-a6a3-a94c12518839",
		"pod_id": null,
		"name": "tessie",
		"selector": "tessie",
		"version": "0.1.0",
		"has_message_feature": false,
		"status": "RUNNING",
		"created_at": "2025-05-07T08:21:43.393Z",
		"updated_at": "2025-06-20T08:25:15.967Z"
	}
};
      const savedDevice = await this.props.httpClient.post(`/api/v1/device`, this.state.device);
      this.setState({
        device: savedDevice,
        isSaving: true
      });
    } catch (e) {
      let errorMessage = 'integration.tessie.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.tessie.error.conflictError';
      }
      this.setState({
        errorMessage
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null,
      tooMuchStatesError: false,
      statesNumber: undefined
    });
    try {
      if (this.state.device.created_at) {
        await this.props.httpClient.delete(`/api/v1/device/${this.state.device.selector}`);
      }
      this.props.getTessieDevices();
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.tessie.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  getDeviceProperty = () => {
    const device = this.state.device;
    if (!device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = device.features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_BATTERY && deviceFeature.type === DEVICE_FEATURE_TYPES.BATTERY_LEVEL
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');
    let mostRecentValueAt = null;
    device.features.forEach(feature => {
      if (feature.last_value_changed && new Date(feature.last_value_changed) > mostRecentValueAt) {
        mostRecentValueAt = new Date(feature.last_value_changed);
      }
    });

    let vinDevice = null;
    const vinDeviceParam = device.params.find(param => param.name === PARAMS.VEHICLE_VIN);
    if (vinDeviceParam) {
      vinDevice = vinDeviceParam.value;
    }

    let versionModel = null;
    const versionModelParam = device.params.find(param => param.name === PARAMS.VEHICLE_VERSION);
    if (versionModelParam) {
      versionModel = versionModelParam.value;
    }

    const isDeviceReachable = (device, now = new Date()) => {
      const isRecent = (date, time) => (now - new Date(date)) / (1000 * 60) <= time;
      const hasRecentFeature = device.features.some(feature => isRecent(feature.last_value_changed, 15));
      return hasRecentFeature;
    };
    const online = isDeviceReachable(device);

    return {
      batteryLevel,
      mostRecentValueAt,
      versionModel,
      vinDevice,
      online,
    };
  };

  render(
    {
      deviceIndex,
      editable,
      deleteButton,
      saveButton,
      updateButton,
      alreadyCreatedButton,
      showMostRecentValueAt,
      housesWithRooms
    },
    { device, user, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const {
      batteryLevel,
      mostRecentValueAt,
      versionModel,
      vinDevice,
      online,
    } = this.getDeviceProperty();
    const model = device.model.split('-')[1];
    const modelImage = `/assets/integrations/devices/vehicle/tesla/${model}/${device.model}.jpg`;
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Localizer>
              <div title={<Text id={`integration.tessie.status.${online ? 'online' : 'offline'}`} />}>
                <i class={`fe fe-radio text-${online ? 'success' : 'danger'}`} />
                &nbsp;{device.name}
              </div>
            </Localizer>
            {showMostRecentValueAt && batteryLevel && (
              <div class="page-options d-flex">
                <BatteryLevelFeature batteryLevel={batteryLevel} />
              </div>
            )}
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {errorMessage && (
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <img
                    src={modelImage}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = '/assets/integrations/cover/tessie.jpg';
                    }}
                    alt={`Image de ${device.name}`}
                    className={styles['device-image-container']}
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.tessie.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.tessie.device.namePlaceholder" />}
                      disabled={!editable}
                    />
                  </Localizer>
                </div>
                
                <div class="form-group">
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.tessie.device.modelLabel" />
                  </label>
                  <input
                    id={`model_${deviceIndex}`}
                    type="text"
                    value={this.props.intl.dictionary.device.vehicle.tesla[model][versionModel]}
                    class="form-control"
                    disabled="true"
                  />
                </div>
                {vinDevice && (
                  <div class="form-group">
                    <label class="form-label" for={`model_${deviceIndex}`}>
                      <Text id="integration.tessie.device.vinLabel" />
                    </label>
                    <input
                      id={`vin_${deviceIndex}`}
                      type="text"
                      value={vinDevice}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}

                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.tessie.device.roomLabel" />
                    </label>
                    <select
                      id={`room_${deviceIndex}`}
                      onChange={this.updateRoom}
                      class="form-control"
                      disabled={!editable}
                    >
                      <option value="">
                        <Text id="global.emptySelectOption" />
                      </option>
                      {housesWithRooms &&
                        housesWithRooms.map(house => (
                          <optgroup label={house.name}>
                            {house.rooms.map(room => (
                              <option selected={room.id === device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                  </select>
                </div>

                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.tessie.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>

                <div class="form-group">
                  {this.state.isSaving && alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.tessie.discover.alreadyCreatedButton" />
                    </button>
                  )}

                  {updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.tessie.discover.updateButton" />
                    </button>
                  )}

                  <button onClick={this.saveDevice} class={`btn btn-success mr-2`}>
                    <Text id="integration.tessie.device.saveButton" />
                  </button>

                  {deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.tessie.device.deleteButton" />
                    </button>
                  )}

                  {showMostRecentValueAt && (
                    <p class="mt-4">
                      {mostRecentValueAt ? (
                        <Text
                          id="integration.mqtt.device.mostRecentValueAt"
                          fields={{
                            mostRecentValueAt: dayjs(mostRecentValueAt)
                              .locale(user.language)
                              .fromNow()
                          }}
                        />
                      ) : (
                        <Text id="integration.tessie.device.noValueReceived" />
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient,user', {})(TessieDeviceBox));
