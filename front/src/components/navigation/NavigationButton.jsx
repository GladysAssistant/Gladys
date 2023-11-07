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
        return <div className={style.goTo}>
            { !this.state.hide && <button className="btn btn-secondary rounded-circle border-0 p-3" onClick={this.scrollTop}>Up</button>}
        </div>
    }
}

export default NavigationButton;