/* console.log in DiscoveredDevice
{
  id: '04:00:00:5e:73:00',
  type: 'NATherm1',
  battery_state: 'high',
  battery_level: 4014,
  firmware_revision: 76,
  rf_strength: 67,
  reachable: true,
  boiler_valve_comfort_boost: false,
  bridge: '70:ee:50:5e:90:e0',
  boiler_status: true,
  name: 'Thermostat maison',
  setup_date: 1578400590,
  room_id: '299775816',
  _id: '04:00:00:5e:73:00',
  firmware: 76,
  last_message: 1701635911,
  rf_status: 68,
  battery_vp: 4011,
  therm_orientation: 1,
  therm_relay_cmd: 100,
  anticipating: false,
  module_name: 'Thermostat maison',
  battery_percent: 67,
  event_history: {
    boiler_not_responding_events: [ [Object], [Object], [Object], [Object], [Object] ],
    boiler_responding_events: [ [Object], [Object], [Object], [Object], [Object] ]
  },
  setpoint_history: [
    { setpoint: [Object], timestamp: 1701633218 },
    { setpoint: [Object], timestamp: 1701633337 },
    { setpoint: [Object], timestamp: 1701633459 },
    { setpoint: [Object], timestamp: 1701634535 },
    { setpoint: [Object], timestamp: 1701638259 },
    { setpoint: [Object], timestamp: 1701638381 }
  ],
  last_therm_seen: 1701635911,
  setpoint: {
    setpoint_mode: 'manual',
    setpoint_temp: 19.5,
    setpoint_endtime: 1701649181
  },
  therm_program_list: [
    {
      timetable: [Array],
      zones: [Array],
      name: 'Standard',
      program_id: '5e147b4da11ec5d9f86b25a3'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Couche tot',
      program_id: '5e14f203e516c8a92f48fe48'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Confinement',
      program_id: '5e7c5843add10704dd3b7d74'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Invités maison pleine',
      program_id: '5fdfbecd91271061417bac90'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Eteins',
      program_id: '61c403938e590d78d8039a3a'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Confinement et Invités',
      program_id: '61cb904ee45b23290c5c9e09'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Maison pleine',
      program_id: '61f4fd1cb22c5721b50d9a37'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Invités chambre du bas',
      program_id: '63adfe87658bf7dcc40bb271'
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Trio hiver',
      program_id: '63b5cada19a886601a0e58c5',
      selected: true
    },
    {
      timetable: [Array],
      zones: [Array],
      name: 'Quator hiver',
      program_id: '654a8b955b5acd269b0bf1e6'
    }
  ],
  measured: { 
    time: 1701635556, 
    temperature: 20.8, 
    setpoint_temp: 14 
  },
  room: {
    id: '299775816',
    name: 'Maison',
    type: 'livingroom',
    module_ids: [ '04:00:00:5e:73:00' ],
    reachable: true,
    anticipating: false,
    heating_power_request: 0,
    open_window: false,
    therm_measured_temperature: 19,
    therm_setpoint_temperature: 19.5,
    therm_setpoint_start_time: 1701638381,
    therm_setpoint_end_time: 1701649181,
    therm_setpoint_mode: 'manual'
  },
  plug: {
    id: '70:ee:50:5e:90:e0',
    type: 'NAPlug',
    name: 'Relais Garage',
    setup_date: 1578400589,
    room_id: '4003605766',
    modules_bridged: [ '04:00:00:5e:73:00', '09:00:00:06:b0:fb' ],
    firmware_revision: 236,
    rf_strength: 105,
    wifi_strength: 78,
    _id: '70:ee:50:5e:90:e0',
    last_setup: 1578400589,
    firmware: 236,
    last_status_store: 1701635921,
    plug_connected_boiler: true,
    wifi_status: 77,
    last_bilan: { y: 2023, m: 10 },
    station_name: 'Relais Garage',
    place: {
      altitude: 122,
      city: "Angerville-l'Orcher",
      continent: 'Europe',
      country: 'FR',
      country_name: 'France',
      location: [Array],
      street: 'Route du Pays de Caux',
      timezone: 'Europe/Paris',
      trust_location: true
    },
    udp_conn: true,
    last_plug_seen: 1701635921
  }
}
*/

/* console.log('thermostats', thermostats) in loadDeviceDetails 
  thermostats: [
    {
      _id: '70:ee:50:5e:90:e0',
      type: 'NAPlug',
      last_setup: 1578400589,
      firmware: 236,
      last_status_store: 1701486301,
      plug_connected_boiler: true,
      wifi_status: 72,
      last_bilan: { y: 2023, m: 10 },
      modules: [ [Object] ],
      station_name: 'Relais Garage',
      place: {
        altitude: 122,
        city: "Angerville-l'Orcher",
        continent: 'Europe',
        country: 'FR',
        country_name: 'France',
        location: [Array],
        street: 'Route du Pays de Caux',
        timezone: 'Europe/Paris',
        trust_location: true
      },
      udp_conn: true,
      last_plug_seen: 1701486301
    }
  ]
*/

/* console.log('modulesThermostat', modulesThermostat) in loadDeviceDetails 
  modulesThermostat [
    {
      _id: '04:00:00:5e:73:00',
      type: 'NATherm1',
      firmware: 76,
      last_message: 1701489898,
      rf_status: 69,
      battery_vp: 4016,
      therm_orientation: 1,
      therm_relay_cmd: 1,
      anticipating: false,
      module_name: 'Thermostat maison',
      battery_percent: 68,
      event_history: {
        boiler_not_responding_events: [Array],
        boiler_responding_events: [Array]
      },
      last_therm_seen: 1701489898,
      setpoint: { setpoint_mode: 'program' },
      therm_program_list: [
        [Object], [Object],
        [Object], [Object],
        [Object], [Object],
        [Object], [Object],
        [Object], [Object]
      ],
      measured: { time: 1701489866, temperature: 10.9, setpoint_temp: 14 }
    }
  ]
*/

/* logger.info('data: ', data);
  data:  {
    status: 'ok',
    time_server: 1701491182,
    body: {
      home: {
        id: '5e147b4da11ec5d9f86b25a2',
        rooms: [Array],
        modules: [Array]
      }
    }
  }
*/

/* logger.info('roomsHomeData: ', roomsHomeData); in loadDeviceDetails
  roomsHomeData :
  {
    id: '299775816',
    name: 'Maison',
    type: 'livingroom',
    module_ids: [ '04:00:00:5e:73:00' ]
  },
*/

/* logger.info('modulesHomeData: ', modulesHomeData); in loadDeviceDetails
  modulesHomeData :
  {
    id: '04:00:00:5e:73:00',
    type: 'NATherm1',
    name: 'Thermostat maison',
    setup_date: 1578400590,
    room_id: '299775816',
    bridge: '70:ee:50:5e:90:e0'
  },
*/

/* logger.info('rooms: ', rooms); in loadDeviceDetails
  rooms :
  {
    id:"140642389"
    reachable:true
    anticipating:false
    heating_power_request:0
    open_window:false
    therm_measured_temperature:11.5
    therm_setpoint_temperature:10
    therm_setpoint_start_time:1701353058
    therm_setpoint_mode:"schedule"
  }
*/
/* logger.info('modules: ', modules); in loadDeviceDetails
  modules :
  {
    id:"70:ee:50:5e:90:e0"
    type:"NAPlug"
    firmware_revision:236
    rf_strength:106
    wifi_strength:73
  }
  {
    id:"04:00:00:5e:73:00"
    type:"NATherm1"
    battery_state:"high"
    battery_level:4018
    firmware_revision:76
    rf_strength:68
    reachable:true
    boiler_valve_comfort_boost:false
    bridge:"70:ee:50:5e:90:e0"
    boiler_status:true
  }
*/
