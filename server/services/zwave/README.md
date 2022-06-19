


                {!get(props, 'zwaveStatus.ready') && (
                  <div class="alert alert-warning">
                    <Text id="integration.zwave.settings.zwavejs.notConnected" />
                  </div>
                )}

        store.setState({          
          getStatusStatus: RequestStatus.Success,
          zwaveStatus where zwaveStatus.ready exists
        });

        vs 

        store.setState({          
          getStatusStatus: RequestStatus.Success,
          ...zwaveStatus
        });

                {props.ready && (
                  <div class="alert alert-info">
                    <Text id="integration.zwave.settings.zwavejs.connecting" />
                  </div>
                )}