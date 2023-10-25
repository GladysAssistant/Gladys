import { Component } from 'preact';
import style from './style.css';

class NavigationButton extends Component{
    render(){
        return <div className={style.goTo}>
            <button className="btn btn-primary rounded-circle border-0 p-3">Test</button>
        </div>
    }
}

export default NavigationButton;