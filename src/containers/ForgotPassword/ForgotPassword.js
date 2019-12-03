import React, { Component } from 'react';
import AuthenticationService from '../../services/AuthenticationService';
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Toolbar from '../../components/Toolbar/Toolbar';
import Octicon, { Person } from '@githubprimer/octicons-react';
import isElectron from 'is-electron';

import classes from './ForgotPassword.module.css';

class ForgotPassword extends Component {

    state = {
        loadingStatus: null,
        errorMessage: null,
        successMessage: null,
    }

    requestNewPassword = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!form.checkValidity())
            return

        await this.promisedSetState({ loadingStatus: 'PROGRESS', errorMessage: null, successMessage: null })
        await new Promise(resolve => setTimeout(resolve, 500));
        try{
            const email = form.elements["email"].value;
            await AuthenticationService.requestNewPassword(email)
            await this.promisedSetState({loadingStatus: 'SUCCESS', successMessage: 'An email has been sent with password information', errorMessage: null })
        }
        catch(error){
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.response.data.message })
        }
    }

    render() {
        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Register', onClick: () => { this.props.history.push('/register'); }, isPrimary: true })
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help')}})
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login'); } });
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        // Go to Dashboard if Logged In
        if (AuthenticationService.isLoggedIn())
            setTimeout(() => { this.props.history.push('/'); }, 1000);

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

        return (
            <div>
                {toolbar}
                <div className={classes.background}>
                    <div className={classes.header}><h1 className={classes.title}>Forgot Password</h1></div>
                    <div className={classes.form_container}>
                        <Form className={classes.form} onSubmit={this.requestNewPassword}>
                            <div className={classes.form_status_container}>{status}</div>

                            <Form.Group controlId="formBasicEmail">
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Person} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="email" type="email" placeholder="Email Address" required />
                                </InputGroup>
                            </Form.Group>

                            <div className={classes.submit_container}>
                                <Button variant="success" className={classes.submit} type="submit">Request New Password</Button>
                                <Button onClick={() => this.props.history.push('/login')} className={classes.login_button} variant="warning">Login</Button>
                            </div>

                        </Form>
                    </div>
                </div>
            </div>)
    }

    promisedSetState = (newState) => {
        return new Promise((resolve) => {
            this.setState(newState, () => {
                resolve()
            });
        });
    }
}

export default ForgotPassword