function createActions(store) {
  const actions = {
    async getDevicesByService(state, intl, service, searchKeyword = '', orderDir = 'asc') {
      console.log('service selected:', service)
      try {
        // Load devices
        const devices = await state.httpClient.get('/api/v1/device');
        const devicesByService = [];
        // Load all services
        const deviceServices = [];

        console.log('Devices:', devices)
        // Organize devices by service
        devices.forEach(device => {
          const { name, id } = device.service;
          if (!devicesByService[name]) {
            deviceServices.push({
              name,
              id
            });
            devicesByService[name] = [];
          }
          devicesByService[name].push(device);
        });

        // Load all or service related devices
        let selectedDevices = service ? devicesByService[service] || [] : devices;
        // Total size
        let totalSize = devices.length;

        if (searchKeyword && searchKeyword.length > 0) {
          const lowerCaseSearchKeyword = searchKeyword.toLowerCase();
          selectedDevices = selectedDevices.filter(device => {
            const { name } = device;
            return (
              name.toLowerCase().includes(lowerCaseSearchKeyword)
            );
          });
        }

        console.log('Device Services:', devicesByService)
        console.log('Services:', deviceServices)

        store.setState({
          devicesByService,
          devices: selectedDevices, // integrations: selectedIntegrations,
          totalSize,
          deviceServices, // integrationCategories,
          searchKeyword,
          orderDir,
          selectedService: service // selectedCategory: category
        });
      } catch (error) {
        console.error('Error in getDevicesByService:', error); // Log pour capturer les erreurs
      }
    },

    async getDeviceFeatureStates(state, deviceFeatureId, dateRange) {
      state.setState({
        getDeviceFeatureStatesStatus: 'Getting'
      });

      try {
        const [startDate, endDate] = dateRange;
        const states = await state.httpClient.get(
          `/api/v1/device_feature/${deviceFeatureId}/state?start_date=${startDate}&end_date=${endDate}`
        );
        state.setState({
          deviceFeatureStates: states,
          getDeviceFeatureStatesStatus: 'Success'
        });
      } catch (e) {
        console.error('Error in getDeviceFeatureStates:', e); // Log pour capturer les erreurs
        state.setState({
          getDeviceFeatureStatesStatus: 'Error'
        });
      }
    },

    setDateRange(state, dateRange) {
      return {
        ...state,
        dateRange,
      };
    },
    search(state, e, intl) {
      this.getDevicesByService(intl, state.selectedService, e.target.value, state.orderDir);
    },
  };
  return actions;
}

export default createActions;
