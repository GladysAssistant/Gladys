import { Text } from 'preact-i18n';
import { Component } from 'preact';
import dayjs from 'dayjs';
import style from './style.css';

class logBox extends Component {
    date = "2019-11-11";
    time = "11:11:11";

    type = "porte";

    title = "ouverture de porte";
    description = "qqn a ouvert la porte de la maison"



    render(props) {
        // Your render logic goes here
        <div class = "card"> 
            <div class= "card-header">
                <h>bonjour</h>
            </div>
            <div class = "card-body">

            </div>
        </div>
    }
}