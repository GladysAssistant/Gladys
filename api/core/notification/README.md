##Notification

Notification object let you manipulate notifications.

###install

**Params**

- `notificationType` {Object} - api/models/notificationType.js

```javascript
var notificationType = {
    service: 'pushbullet',
    name: 'PushBullet'
};

gladys.notification.install(notificationType)
      .then(function(type){
          // new type created !
      })
      .catch(function(err){
         // something bad happened :/ 
      });
```
When you install a notification, you need to create a notify method in your module to receive notifications.
This method should return a Promise. If failed, Gladys call next services to notify.

**Params**

- `notification` {Object} - api/models/Notification.js
- `user` {Object} - api/models/User.js

```javascript
function notify (notification, user){
    return new Promise(function(resolve, reject){
        // Try send notification
    });
};
```

**Samples**

- [GladysProject/gladys-pushbullet](https://github.com/GladysProject/gladys-pushbullet) Simple usage of notification.
- [GladysProject/gladys-speak](https://github.com/GladysProject/gladys-speak) Check if user is at home. If he is not at home, it's useless to speak in an empty room.
