##Alarm

This object let you manipulate alarms. 

In Gladys, alarms are, as in real life, scheduled timer.

An alarm is represented like this :

```json
{
    "id": 1,
    "name": "Monday wake up !",
    "time": "08:00",
    "dayofweek": 1,
    "createdAt": "2014-11-03 19:43:37",
    "updatedAt": "2014-11-03 19:43:37"
  }
```

Or if it's just for a specific date ( not recurrent ), like this :

```json
{
    "id": 1,
    "name": "Monday wake up !",
    "datetime": "2014-11-03 19:43:37",
    "createdAt": "2014-11-03 19:43:37",
    "updatedAt": "2014-11-03 19:43:37"
  }
```

###Create

**Params**

`gladys.alarm.create` need an object containing the alarm. 
It returns a Promise.

**Example**

```javascript
var alarm = {
  id: 1,
  name: 'Monday wake up !',
  time: '08:00',
  dayofweek: 1
};

gladys.alarm.create(alarm)
      .then(function(alarm){
         // alarm created ! 
      })
      .catch(function(err){
          // something bad happened ! :/
      });
```