import React, { Component } from 'react';
import Toolbar from '../../components/Toolbar/Toolbar'
import krakenLogo from './../../assets/kraken-logo.png';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import isElectron from 'is-electron';
import { Redirect } from 'react-router-dom'
import AuthenticationService from '../../services/AuthenticationService';
import Octicon, { Rocket } from '@githubprimer/octicons-react';

import classes from './Home.module.css'

class Home extends Component {

    state = {
        urlValue: localStorage.getItem("url"),
        submitButtonText: "Start",
        submitButtonVariant: "success"
    }

    render() {
        if (AuthenticationService.isLoggedIn())
            return <Redirect to="/login" />

        // NavLinks for Toolbar
        const navLinks = [];
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login') }, isPrimary: true });
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help') } });
        const toolbar = <Toolbar navLinks={navLinks} type='web' />

        return (
            <div>
                {toolbar}
                <div className={classes.container}>
                    <img alt="logo" src={krakenLogo} className={classes.logo} />
                    <h1 className={classes.title}>Kraken <br /></h1>
                    <h2 className={classes.subTitle}>Distributed Brute Force Password Cracking</h2>
                    <span className={classes.disclaimer}>
                        THIS SOFTWARE COMES WITH NO WARRANTY WHATSOEVER. THE AUTHOR IS NOT RESPONSIBLE FOR ANY DAMAGE CAUSED BY THE (MIS)USE OF THIS SOFTWARE!
                    </span>
                    <div className={classes.formContainer}>
                        <Form className={classes.form} onSubmit={this.checkServerUrl}>
                            <InputGroup>
                                <InputGroup.Prepend>
                                    <InputGroup.Text><Octicon icon={Rocket} /></InputGroup.Text>
                                </InputGroup.Prepend>
                                <Form.Control name="url" type="text" placeholder="Kraken Server URL (Default: http://localhost:5000/api)"
                                    value={this.state.urlValue} onChange={e => this.setState({ urlValue : e.target.value, submitButtonText : "Apply", submitButtonVariant : "warning"})} autoComplete="on" />
                            </InputGroup>
                            <div className={classes.buttonContainer}>
                                <Button variant={this.state.submitButtonVariant} className={classes.button} type="submit"> &nbsp; {this.state.submitButtonText} &nbsp;  </Button>
                                <Button onClick={() => { this.props.history.push('/help'); }} className={classes.button}> &nbsp; Help &nbsp;  </Button>
                            </div>
                        </Form>
                    </div>

                    <div className={classes.donationContainer}>
                        <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
                            <input type="hidden" name="cmd" value="_donations" />
                            <input type="hidden" name="business" value="ZAKGHMTXN8D5E" />
                            <input type="hidden" name="item_name" value="Supporting website" />
                            <input type="hidden" name="currency_code" value="CAD" />
                            <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
                        </form>
                        <p>Bitcoin Address</p>
                        <p className={classes.bitcoinAddress}>1ErQ7BSEB19cUbuqDwQRLb199sRVabA5w</p>
                    </div>
                </div>
            </div>
        )
    }

    checkServerUrl = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        // TODO : Fix this ugly hack
        if (form.elements["url"].value) {
            if (form.elements["url"].value !== localStorage.getItem("url")) {
                localStorage.setItem("url", form.elements["url"].value)
                window.location.href = '/'
                return;
            }
        }
        else {
           localStorage.setItem("url", "http://localhost:5000/api")
        }

        this.props.history.push('/login');
    }
}

export default Home;