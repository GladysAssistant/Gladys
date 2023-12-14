import { Text } from 'preact-i18n';
import { Component } from 'preact';
import style from './style.css';

class LogBox extends Component {
    date = "2019-11-11";
    time = "11:11:11";

    title = "ouverture de porte";
    description = "qqn a ouvert la porte de la maison"

    icon = "fe fe-home";

    dico_icon = {
        House : "fe fe-home",
    }
    

    //"2019-11-11 11:11:11.111 fuseau horaire"
    setDateAndTime(date){
        this.date = date.substring(0,10);
        this.time = date.substring(11,19);
    }

    setIcon(service){
        this.icon = this.dico_icon[service];
    }

    setTitle(service,type){
        this.title = "EventLog.event."+service+"."+type+".title";
    }

    setDescription(service,type){
        this.description = "EventLog.event."+service+"."+type+".description";
    }





    render(props, {date, service, type, sender_name,eventProperty}) {
        // penser à decommanter 
        //this.setDateAndTime(date);
        //this.setIcon(service);
        //this.setTitle(service,type);
        //this.setDescription(service,type);
        return(
       
        <div class = "card" > 
            <div class= "card-header " style = "background-color : #E0EBFF">
                <div class='box'  style="flex-grow: 1; max-width:10%;">
                    <i class={this.icon}/>
                </div>

                <div class='box' style="flex-grow: 1;">
                    <div class="card-title"  style="text-align: center;">
                        <Text id={this.title}/>
                    </div>
                </div>
                <div class='box'>
                    <Text id={this.date}/>
                </div>
            </div>
            <div class = "card-body">
                <div class='box'  style="border-bottom : solid 1px grey; display : inline-block">
                <Text id={this.time}/>
                
                </div>

                <div class='box'  style="flex-grow: 1; padding-top : 10px">
                    <Text id={this.description} fields={{service : service, type : type, sender_name : sender_name, eventProperty : eventProperty}} />
                    
                </div>
            </div>
            
            
        </div>
        )
    }
}
export default LogBox;