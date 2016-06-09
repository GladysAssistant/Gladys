##LifeEvent

This object let you manipulate LifeEvents. 

In Gladys, if you want to save informations about specific events relating to a user, 
you create a `LifeEvent`. For example: 
- "James just woke up" 
- "James is going to sleep"
- "James left the house"

A Life Event is represented like that : 

```json
{
    "id": 1,
    "datetime": "2014-11-03 19:43:37",
    "eventtype": 1,
    "user": 1,
    "room": 1,
    "createdAt": "2014-11-03 19:43:37",
    "updatedAt": "2014-11-03 19:43:37"
  }
```

Why do we need a `datetime` field if we have `createdAt` ? Because createdAt is the date
when the field is created in the database, but if you want to report an old event, with 
createdAt you simply can't ! 

**Room** 

The room attribute is optional, it's if you want to specify a specific room where
the LifeEvent took place.

###Create

**Params**

`gladys.lifeEvent.create` need an object containing the LifeEvent. 
It returns a Promise.

**Example**

```javascript
var lifeEvent = {
  datetime: '2014-11-03 19:43:37',
  code: 'wakeup',
  user: 1
};

gladys.lifeEvent.create(lifeEvent)
      .then(function(lifeEvent){
         // lifeEvent created ! 
      })
      .catch(function(err){
          // something bad happened ! :/
      });
```


###addType

**Params**

`gladys.lifeEvent.addType` need an object containing the new type to create.

**Example**

```javascript
var type = {
   
};

gladys.alarm.delete(alarm)
      .then(function(alarm){
          // alarm deleted ! 
      })
      .catch(function(err){
         // something bad happened ! :/ 
      });
```

###Update

**Params**

`gladys.alarm.update` need an object containing : the id of the alarm to update, 
and the values of the attributes to update.

**Example**

```javascript
var alarm = {
    id: 1,
    name: 'Name updated'
};

gladys.alarm.update(alarm)
      .then(function(alarm){
          // alarm updated ! 
      })
      .catch(function(err){
         // something bad happened ! :/ 
      });
```