import React from 'react';
import PropTypes from 'prop-types';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav'
import Octicon, { LogoGithub, MarkGithub } from '@githubprimer/octicons-react';
import krakenLogo from './../../assets/kraken-logo.png';
import { useHistory } from "react-router-dom";

import classes from './Toolbar.module.css'

const Toolbar = (props) => {
    // Nav Links
    const navLinks = props.navLinks.map(navLink => {
        if (navLink.isPrimary)
            return (<Nav.Link className={classes.linkPrimary} onClick={navLink.onClick} key={navLink.text}> {navLink.text} </Nav.Link>)
        else
            return (<Nav.Link className={classes.link} onClick={navLink.onClick} key={navLink.text}> {navLink.text} </Nav.Link>)
    });

    const history = useHistory();
    return (
        <Navbar className={props.type === 'electron' ? classes.navbarElectron : classes.navbar} sticky="top" variant="dark" >
            <img alt="" src={krakenLogo} className={classes.logo} onClick={() => { history.push("/dashboard") }} />
            <Navbar.Brand>
                <span onClick={() => { history.push("/dashboard") }}>Kraken <sub>beta</sub></span>
            </Navbar.Brand>
            <Nav.Link className={classes.link}
                href="https://github.com/arcaneiceman/kraken-client" target="_blank" rel="noopener noreferrer">
                <Octicon icon={MarkGithub} /> <Octicon icon={LogoGithub} />
            </Nav.Link>
            <Navbar.Collapse className={classes.collapse}>
                <Nav>
                    {navLinks}
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

Toolbar.propTypes = {
    navLinks: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired,
    }).isRequired),
    type: PropTypes.oneOf(['electron', 'web'])
}

export default Toolbar;