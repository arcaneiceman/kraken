import React from 'react';
import PropTypes from 'prop-types';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav'
import krakenLogo from './../../assets/kraken-logo.png';

import classes from './Toolbar.module.css'

const Toolbar = (props) => {
    const navLinks = props.navLinks.map(navLink => {
        if (navLink.isPrimary)
            return (<Nav.Link className={classes.linkPrimary} onClick={navLink.onClick} key={navLink.text}> {navLink.text} </Nav.Link>)
        else
            return (<Nav.Link className={classes.link} onClick={navLink.onClick} key={navLink.text}> {navLink.text} </Nav.Link>)
    });

    const logo = props.type === 'electron' ? <img alt="" src={krakenLogo} width="20" height="20" /> : <img alt="" src={krakenLogo} width="50" height="50" />

    return (
        <Navbar className={ props.type === 'electron' ? classes.navbarElectron : classes.navbar} sticky="top" variant="dark" >
            <Navbar.Brand href="/">
                {logo}{<span>Kraken <sub>beta</sub></span>}
            </Navbar.Brand>
            <Nav.Link className={classes.link} onClick={() => { window.location.href = "mailto:waliusmani@gmail.com" }}>Contact Creator</Nav.Link>
            <Navbar.Toggle />
            <Navbar.Collapse className={classes.collapse}>
                <Nav>
                    {navLinks}
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

Toolbar.propTypes = {
    navLinks : PropTypes.arrayOf(PropTypes.shape({
        text : PropTypes.string.isRequired,
        onClick : PropTypes.func.isRequired,
    }).isRequired),
    type : PropTypes.oneOf(['electron','web'])
}

export default Toolbar;