import React, { Component } from 'react';
import isElectron from 'is-electron';
import Toolbar from '../../components/Toolbar/Toolbar';

import classes from './Upgrade.module.css'

class Upgrade extends Component {

    render() {
        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login'); }, isPrimary: true });
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help') } })
        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        return (
            <div>
                {toolbar}
                <div className={classes.container}>
                    <h3>Please upgrade your client! This version is no longer supported!</h3>
                    <br />
                    <h3>For Browser : Empty cache and reload</h3>
                    <h3>For Desktop : Download the new client</h3>
                </div>
            </div>
        );
    }
    
}

export default Upgrade;