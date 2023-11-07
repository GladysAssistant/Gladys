import { Component } from 'preact';
import style from './style.css';

class NavigationButton extends Component{
    state = {
        hideUp : true,
        hideDown : true
    }

    componentDidMount()
    {
        window.addEventListener('scroll', this.handleScroll);
    }

    componentWillUnmount()
    {
        window.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll = () => {
        let state = this.state
        if (window.scrollY === 0 || window.scrollY <= 400 ) {
            state.hideUp = true
        } else {
            state.hideUp = false
        }
        if (window.scrollY >= document.body.scrollHeight - 1200 ) {
            state.hideDown = true
        } else {
            state.hideDown = false
        }
        this.setState(state)
    }

    scrollTop(){
        window.scroll({
            top: 0,
            left: 0,
            behavior: "smooth",
          });
    }

    scrollBot(){
        window.scroll({
            top: document.body.scrollHeight,
            left: 0,
            behavior: "smooth",
          });
    }

    render(){

    //     return( 
    //             <div className={style.goTo}>
    //             <div>
    //             <button className={`btn btn-dark btn-sm ${style.halfCircleUp}`}disabled>Ʌ</button>
    //             </div> 
    //             <div>
    //             <button className={`btn btn-primary btn-sm ${style.halfCircleDown}`}>V</button>
    //             </div>
    //             </div>
        
    //   )

        return <div className={style.goTo}>
            <div>
            { !this.state.hide && <button className={`btn btn-primary btn-sm ${style.halfCircleUp}`} onClick={this.scrollTop}>Ʌ</button>}
            </div>
            <div>
            { !this.state.hideDown && <button className={`btn btn-primary btn-sm ${style.halfCircleDown}`} onClick={this.scrollBot}>V</button>}
            </div>
        </div>

    }
}

export default NavigationButton;