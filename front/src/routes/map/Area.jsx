import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import * as consts from '../../utils/consts';
import actions from '../../actions/map';


@connect('title,latitude,longitude,radius', actions)
class Area extends Component {

  render(props, state) {
    const token = "";
    const url = "";
    var callApi = `
    function callAPI(token, path) {

        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function(evt)  {
         console.log("xhr.readyState :: "+httpRequest.readyState);
         console.log("xhr.status :: "+httpRequest.status);
         if (httpRequest.readyState==4 && httpRequest.status==200) {
          console.log(evt.target.responseText);
         }
       }
       httpRequest.open('POST', path);
       httpRequest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
       httpRequest.setRequestHeader('Authorization', 'Token token="'+token+'"');
       httpRequest.send();
     };
     `
      return (
        <div class="form-group" style="margin-top: 20em;">
          <form onSubmit={props.createAreasWithLocation}>
          <fieldset>
            <legend>Area details</legend>
              <script type="text/javascript">
                 {callApi}
              </script>
              <div>
                <label class="form-label">Label :</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Title"
                  value={props.title}
                  onInput={props.onTitleChange}
                />


              </div>
              <div><label class="form-label">Latitude :</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Latitude"
                  value={props.latitude}
                  onInput={props.onLatitudeChange}
                />
            </div>
              <div><label class="form-label">Longitude :</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Longitude"
                  value={props.longitude}
                  onInput={props.onLongitudeChange}
                />
              </div>

            <div><label class="form-label">Radius(m) :</label>
              <input
                type="text"
                class="form-control"
                placeholder="Radius"
                value={props.radius}
                onInput={props.onRadiusChange}
              />
            </div>
              <div class="form-footer">
                <button onClick={props.createAreasWithLocation} class="btn btn-primary" type="button">
                  Create area
                </button>
              </div>
            </fieldset>
            </form>
        </div>

      );
    }
};
export default Area;
