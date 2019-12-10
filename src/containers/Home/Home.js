import React, { Component } from 'react';
import Toolbar from '../../components/Toolbar/Toolbar'
import krakenLogo from './../../assets/kraken-logo.png';
import Button from 'react-bootstrap/Button'

import classes from './Home.module.css'

class Home extends Component {

    render() {
        // NavLinks for Toolbar
        const navLinks = [];
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login') }, isPrimary: true });
        navLinks.push({ text: 'Register', onClick: () => { this.props.history.push('/register') } });
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help') } });
        const toolbar = <Toolbar navLinks={navLinks} type='web' />

        return (
            <div>
                {toolbar}
                <div className={classes.container}>
                    <img alt="logo" src={krakenLogo} className={classes.logo} />
                    <h1 className={classes.title}>Kraken <br /></h1>
                    <h2 className={classes.subTitle}>Distributed Brute Force Password Cracking</h2>
                    <h6 className={classes.disclaimerTitle}>Disclaimer</h6>
                    <span className={classes.disclaimer}>
                        THIS SOFTWARE COMES WITH NO WARRANTY WHATSOEVER. THE AUTHOR IS NOT RESPONSIBLE FOR ANY DAMAGE CAUSED BY THE (MIS)USE OF THIS SOFTWARE!
                    </span>
                    <div className={classes.buttonContainer}>
                        <Button onClick={() => { this.props.history.push('/login'); }} className={classes.button}> &nbsp; Login &nbsp;  </Button>
                        <Button onClick={() => { this.props.history.push('/register'); }} className={classes.button}> Register </Button>
                    </div>
                </div>
            </div>
        )
    }
}

export default Home;