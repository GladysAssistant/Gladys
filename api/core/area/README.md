##Area

This object let you manipulate areas. 

An Area is a zone defined like this : 

```json
{
  "name": "Home",
  "latitude": 42,
  "longitude": 3,
  "radius": 30, // in meters
  "user": 1
}
```

When a user enters in one area, an event "enterArea" is emitted.


###Create

**Example**

```javascript
var area = {
  name: 'My Home !',
  latitude: 42,
  longitude: 3,
  radius: 40,
  user: 1
};

gladys.area.create(area)
      .then(function(area){
         // area created ! 
      })
      .catch(function(err){
          // something bad happened ! :/
      });
```

###Delete

**Example**

```javascript
var area = {
  id: 1
};

gladys.area.delete(area)
      .then(function(){
         // area deleted ! 
      })
      .catch(function(err){
          // something bad happened ! :/
      });
```

##enterArea

Returns areas where the user just entered (by passing the current location of the user).
In the user is already in the area, the area won't be returned ! 
This function detects only changes of areas !

**Example**

```javascript
var location = {
  latitude: 42,
  longitude: 3, 
  accuracy: 20,
  user: 1
};

gladys.area.enterArea(area)
      .then(function(areas){
         // areas is a list of areas where just entered in
      })
      .catch(function(err){
          // something bad happened ! :/
      });
```

