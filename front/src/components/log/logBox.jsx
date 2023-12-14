import { Text } from 'preact-i18n';
import { Component } from 'preact';
import dayjs from 'dayjs';
import style from './style.css';

class LogBox extends Component {
    date = "2019-11-11";
    time = "11:11:11";

    type = "porte";

    title = "ouverture de porte";
    description = "qqn a ouvert la porte de la maison"

    



    render(props, {date, type, action, object,eventProperty}) {
        // Your render logic goes here

        return(
       
        <div class = "card" > 
            <div class= "card-header ">
                <div class='box'  style="flex-grow: 1; max-width:10%;">
                    <i class="fe fe-message-square" />
                </div>

                <div class='box' style="flex-grow: 1;">
                    <div class="card-title"  style="text-align: center;">
                        {this.title}
                    </div>
                </div>
                <div class='box'>
                    {this.date}
                </div>
            </div>
            <div class = "card-body">
                {this.description}

            </div>
            
            
        </div>
        )
    }
}
export default LogBox;