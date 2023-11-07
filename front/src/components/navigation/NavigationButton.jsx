import { Component } from 'preact';
import style from './style.css';

class NavigationButton extends Component{
    render(){
        return( 
                <div className={style.goTo}>
                <div>
                <button className={`btn btn-dark btn-sm ${style.halfCircleUp}`}disabled>Ʌ</button>
                </div> 
                <div>
                <button className={`btn btn-primary btn-sm ${style.halfCircleDown}`}>V</button>
                </div>
                </div>
        
      )
    }
}

export default NavigationButton;