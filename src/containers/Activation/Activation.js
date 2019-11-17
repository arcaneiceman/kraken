import React, { Component } from 'react';
import Toolbar from '../../components/Toolbar/Toolbar'
import AuthenticationService from '../../services/AuthenticationService'
import { Button } from 'react-bootstrap'
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import isElectron from 'is-electron';
import Form from 'react-bootstrap/Form'
import Octicon, { Person, Key } from '@githubprimer/octicons-react';
import InputGroup from 'react-bootstrap/InputGroup'

import classes from './Activation.module.css'

class Activation extends Component {

    state = {
        loadingStatus: null,
        errorMessage: null,
        successMessage: null,
    }

    resendActivationEmail = async (email) => {
        await this.promisedSetState({ loadingStatus: 'PROGRESS', errorMessage: null, successMessage: null })
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
            await AuthenticationService.resendActivationEmail(email);
            await this.promisedSetState({ loadingStatus: 'SUCCESS', successMessage: 'Activation Email Resent' })
        }
        catch (error) {
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.response.data.message })
        }
    }

    submitActivationCode = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        // Check Form Validiy
        if (!form.checkValidity())
            return

        await this.promisedSetState({ loadingStatus: 'PROGRESS', errorMessage: null, successMessage: null })
        await new Promise(resolve => setTimeout(resolve, 1500));
        try{
            const email = form.elements["email"].value;
            const activationKey = form.elements["activationKey"].value;
            await AuthenticationService.activate(email, activationKey)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', successMessage: 'Activation Sucessful. Taking you to Dashboard...' })
        }
        catch(error){
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.response.data.message })
        }
    }

    render() {
        // Go to Dashboard if Logged In
        if (AuthenticationService.isLoggedIn())
            setTimeout(() => { this.props.history.push('/'); }, 1000);

        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Get Started', onClick: () => { this.props.history.push('/register'); }, isPrimary: true })
        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login'); } });
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        // Status
        let status;
        switch (this.state.loadingStatus) {
            case 'PROGRESS':
                status = <Spinner animation="border" />
                break;
            case 'ERROR':
                status = <Alert variant='danger'> {this.state.errorMessage} </Alert>
                break;
            case 'SUCCESS':
                status = <Alert variant='success'> {this.state.successMessage} </Alert>
                break
            default:
                status = <div></div>;
        }

        // URL Params
        const query = new URLSearchParams(this.props.location.search)
        let email = null;
        let activationKey = null;
        for (let param of query.entries()) {
            if (param[0] === 'email')
                email = param[1];
            if (param[0] === 'activationKey')
                activationKey = param[1];
        }

        return (
            <div>
                {toolbar}
                <div>
                    <div className={classes.header}><h1 className={classes.title}>Activation</h1></div>
                    <div className={classes.container}>
                        <div>
                            <p>An activation email was sent to {email}.</p>
                            <p>Copy activation code or click the link in the email</p>
                        </div>
                        <Form className={classes.form} onSubmit={this.submitActivationCode}>
                            <div className={classes.form_status_container}>{status}</div>
                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Person} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="email" type="text" defaultValue={email} readOnly />
                                </InputGroup>
                            </Form.Group>
                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Key} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="activationKey" type="text" defaultValue={activationKey} required />
                                </InputGroup>
                            </Form.Group>
                            <div className={classes.submit_container}>
                                <Button className={classes.submit} variant="success" type="submit">Activate!</Button>
                                <Button onClick={() => this.resendActivationEmail(email)} className={classes.resend_button} variant="warning">Resend Email</Button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>);
    }

    promisedSetState = (newState) => {
        return new Promise((resolve) => {
            this.setState(newState, () => {
                resolve()
            });
        });
    }
}

export default Activation;