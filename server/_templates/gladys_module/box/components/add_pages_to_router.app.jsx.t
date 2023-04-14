---
inject: true
to: ../front/src/components/app.jsx
before: "<BluetoothDevicePage path=\"/dashboard/integration/device/bluetooth\" />"
skip_if: "<<%= className %>SetupPage path=\"/dashboard/integration/device/<%= module %>/setup\" />"
---
        <<%= className %>SetupPage path="/dashboard/integration/device/<%= module %>/setup" />
        
