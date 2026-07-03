module.exports = {
  strict: true,
  ignoredDps: [
    // temp_set (16): no temperature probe on this module, the setpoint has no effect (see the cloud
    // variant mapping). travel_time (105) and week_data (106) have no matching Gladys feature type.
    '16',
    '105',
    '106',
  ],
  codeAliases: {},
  dps: {
    switch: 1,
    mode: 2,
    timer_switch: 102,
    travel_switch: 103,
    cur_mode: 104,
    lock_switch: 107,
  },
};
