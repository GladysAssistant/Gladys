##Device

Device object let you manipulate devices. 

A Device can be 
- a sensor ( Temperature sensor, Humidity sensor, motion sensor ) 
- an actuator ( Smart light/plug )

A device is represented like that : 

```json
{
    "id": 1,
    "name": "Light",
    "protocol": "milight",
    "room": 1,
    "createdAt": "2014-11-03 19:43:37",
    "updatedAt": "2014-11-03 19:43:37"
  }
```

A device has some deviceType. Each type represent a feature/a way to control it. For example, 
a lamp has 3 types :
 
- It's a binary device, you can switch it on and off ( Lamp state can be 0 or 1 ).
- It's a multilevel device, you can control the intensity of the light ( Lamp state can be from 0 to 100 for example )
- It's another multilevel device, you can control the color of the lamp ( Lamp color can be between 0 and 255 for example )

So, you'll find in database three records: 

- Device "Lamp"
    - DeviceType "Binary"
    - DeviceType "Multilevel"
    - DeviceType "Multilevel"

###Create

**Params**

`gladys.device.create` need an object containing the device, and an array of the types of the device. 
It returns a Promise.

**Example**

```javascript
var obj = {
        
    device: {
        name: 'Light in my room',
        protocol: 'milight',
    },
    
    types: [
        {
            type: 'binary',
            min: 0,
            max: 1
        },
        {
            type:'multilevel',
            unit: 'color',
            min: 0,
            max: 100
        }
    ]   
};

gladys.device.create(obj)
      .then(function(device){
         // device created ! 
      })
      .catch(function(err){
          // something bad happened ! :/
      });
```

###Delete

**Params**

`gladys.device.delete` need an object containing the id of the device to delete.

**Example**

```javascript

var device = {
    id: 1
};

gladys.device.delete(device)
      .then(function(device){
          // Device deleted with success
      }) 
      .catch(function(err){
          // something bad happened ! :/
      });
```


###Get

**Params**

You can pass options to `gladys.device.get`.

**Example**

```javascript

var options = {
    take: 50,
    skip: 0
};

gladys.device.get(options)
      .then(function(devices){
         // devices is an array of device
      })
      .catch(function(err){
        // something bad happened ! :/
      });
```


###Update

**Params**

`gladys.device.delete` need an object containing the id of the device to update and the properties to changes.

**Example**

```javascript

var device = {
    id: 1,
    name: 'The New Name Of the Device'
};

gladys.device.update(device)
      .then(function(device){
          // Device updated with success
      }) 
      .catch(function(err){
          // something bad happened ! :/
      });

```

###Set

`gladys.device.set` set a new value for the devicetype passed in argument. 
It simply check if the DeviceType exist, and then create a DeviceState in the database.

**Params**

`gladys.device.set`

**Example**

```javascript

var state = {
    devicetype: 1,
    value: 1  
};

gladys.device.set(state)
      .then(function(state){
          // new state created
      })
      .catch(function(err){
         // something bad happened ! 
      });
```
