import { Component } from 'preact';
import style from './style.css';

class NavigationButton extends Component{
    state = {
        hide : true
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
        if (window.scrollY === 0 || window.scrollY <= 400 ) {
            this.setState({hide: true});
        } else {
            this.setState({hide: false});
        }
    }

    scrollTop(){
        console.log("Test")
        window.scroll({
            top: 0,
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
            { !this.state.hide && <button className={`btn btn-dark btn-sm ${style.halfCircleUp}`} onClick={this.scrollTop}>Up</button>}
        </div>

    }
}

export default NavigationButton;