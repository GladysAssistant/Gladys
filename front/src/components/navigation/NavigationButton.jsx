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
        return <div className={style.goTo}>
            { !this.state.hideUp && <button className="btn btn-secondary rounded-circle border-0 p-3" onClick={this.scrollTop}>Up</button>}
            { !this.state.hideDown && <button className="btn btn-secondary rounded-circle border-0 p-3" onClick={this.scrollBot}>Down</button>}
        </div>
    }
}

export default NavigationButton;