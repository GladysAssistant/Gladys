import { Text } from 'preact-i18n';
import { Component } from 'preact';
import style from './style.css';

class LogBox extends Component {
    dico_icon = {
        "HOUSE" : "fe fe-home",
    }
    
    constructor(props) {
        super(props);
      }

    //"2019-11-11 11:11:11.111 fuseau horaire"
    getDate(date){
        return date.substring(0,10);
    }

    getTime(date){
        return date.substring(11,19);
    }

    getIcon(service){
        return this.dico_icon[service];
    }

    getTitle(service,type){
        return "EventLog.event."+service+"."+type+".title";
    }

    getDescription(service,type){
        return "EventLog.event."+service+"."+type+".description";
    }


    render(props) {
        // penser à decommanter 
        //this.setDateAndTime(date);
        //this.setIcon(service);
        //this.setTitle(service,type);
        //this.setDescription(service,type);
        return(
       
        <div class = "card" > 
            <div class= "card-header " style = "background-color : #E0EBFF">
                <div class='box'  style="flex-grow: 1; max-width:10%;">
                    <i class={this.getIcon(props.service)}/>
                </div>

                <div class='box' style="flex-grow: 1;">
                    <div class="card-title"  style="text-align: center;">
                        <Text id={this.getTitle(props.service,props.type)}/>
                    </div>
                </div>
                <div class='box' style= "flex-grow : 1;  max-width:15%;">
                    {this.getDate(props.date)} 
                </div>
                <div class='box' style= "flex-grow : 1;  max-width:15%;">
                    {this.getTime(props.date)}
                </div>
            </div>
            <div class = "card-body">
                <div class='box'  style="flex-grow: 1; padding-top : 10px">
                    <Text id={this.getDescription(props.service,props.type)} fields={{service : props.service, type : props.type, sender_name : props.sender_name, eventProperty : props.event_property}} />
                    
                </div>
            </div>
            
            
        </div>
        )
    }
}
export default LogBox;