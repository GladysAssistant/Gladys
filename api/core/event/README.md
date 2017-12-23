## LifeEvent

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

### Create

**Params**

`gladys.event.create` need an object containing the LifeEvent. 
It returns a Promise.

**Example**

```javascript
var event = {
  datetime: '2014-11-03 19:43:37',
  code: 'wakeup',
  user: 1
};

gladys.event.create(event)
      .then(function(event){
         // event created ! 
      })
      .catch(function(err){
          // something bad happened ! :/
      });
```


### addType

**Params**

`gladys.event.addType` need an object containing the new type to create.

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

### Update

**Params**

`gladys.event.update` need an object containing : the id of the event to update, 
and the values of the attributes to update.

**Example**

```javascript
var event = {
    id: 1,
    name: 'Name updated'
};

gladys.event.update(event)
      .then(function(event){
          // event updated ! 
      })
      .catch(function(err){
         // something bad happened ! :/ 
      });
```

### Purge

**Params**

`gladys.event.purge` need an object containing : the eventtype id of the event to purge,
and the values of the event to update, optionnaly, you can provide the days to purge.

**Example**

```javascript
var event = {
    eventtype: 1,
    value: 1,
    days: 5
};

gladys.event.purge(event)
      .then(function(){
          // event purged ! 
      })
      .catch(function(err){
         // something bad happened ! :/
    
