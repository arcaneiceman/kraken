import React, { Component } from 'react'
import Toolbar from '../../components/Toolbar/Toolbar'
import SocialLoginWrapper from '../../components/SocialLoginWrapper/SocialLoginWrapper'
import { FacebookLoginButton, GoogleLoginButton } from "react-social-login-buttons";
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import AuthenticationService from '../../services/AuthenticationService'
import Octicon, { Person, Key, EyeClosed, Eye } from '@githubprimer/octicons-react';
import isElectron from 'is-electron';
import ReCAPTCHA from 'react-google-recaptcha'

import classes from './Login.module.css'

class Login extends Component {

    state = {
        recaptchaReference: React.createRef(),
        recaptchaSiteKey: '6LdJLcQUAAAAAOvVTGrtXqlqkEm2NzmhT9ucXlU8',

        loadingStatus: null,
        errorMessage: null,
        successMessage: null,

        passwordHidden: true,
    }

    login = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!form.checkValidity())
            return

        const recaptchaResponse = this.state.recaptchaReference.current.getValue();
        if (recaptchaResponse === "") {
            await this.promisedSetState({ loadingStatus: 'ERROR', successMessage: null, errorMessage: "Please fill the captcha" })
            return
        }

        await this.promisedSetState({ loadingStatus: 'PROGRESS', errorMessage: null, successMessage: null })
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            const email = form.elements["email"].value;
            const password = form.elements["password"].value;
            await AuthenticationService.authenticate(email, password, recaptchaResponse)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', successMessage: 'Success! Taking you to Dashboard', errorMessage: null })
        }
        catch (error) {
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.response.data.message, successMessage: null })
        }
    }

    socialAuthenticate = async (provider, authObject) => {
        await this.promisedSetState({ loadingStatus: 'PROGRESS', errorMessage: null, successMessage: null })
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            await AuthenticationService.socialAuthenticate(provider, authObject._token.accessToken)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', successMessage: 'Success! Taking you to Dashboard', errorMessage: null })
        }
        catch (error) {
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.response.data.message, successMessage: null })
        }
    }

    socialAuthenticateError = async (error) => {
        await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.message, successMessage: null })
    }

    togglePasswordHidden = () => {
        const currentState = this.state.passwordHidden;
        this.setState({ passwordHidden: !currentState })
    }

    render() {
        // Go to Dashboard if Logged In
        if (AuthenticationService.isLoggedIn())
            this.props.history.push('/dashboard');

        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Register', onClick: () => { this.props.history.push('/register'); }, isPrimary: true })
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help') } })
        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />


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
                <div>
                    <div className={classes.header}><h1 className={classes.title}>Login</h1></div>
                    <div className={classes.loginContainer}>
                        {/* Status */}
                        <div className={classes.form_status_container}>{status}</div>

                        { /* Sub Container */}
                        <div className={classes.loginSubContainer}>
                            {/* Social Form */}
                            <div className={classes.loginSocial}>
                                <SocialLoginWrapper
                                    provider='facebook'
                                    appId='768877590254144'
                                    onLoginSuccess={(authObject) => this.socialAuthenticate('facebook', authObject)}
                                    onLoginFailure={(error) => this.socialAuthenticateError(error)}>
                                    <FacebookLoginButton />
                                </SocialLoginWrapper>
                                <SocialLoginWrapper
                                    provider='google'
                                    appId='305647727727-fvc3p4740bjn7fl27rbve4c935cnls05.apps.googleusercontent.com'
                                    onLoginSuccess={(authObject) => this.socialAuthenticate('google', authObject)}
                                    onLoginFailure={(error) => this.socialAuthenticateError(error)}>
                                    <GoogleLoginButton />
                                </SocialLoginWrapper>
                            </div>

                            { /* Seperator */}
                            <div className={classes.loginSeperator}>
                                <span className={classes.loginSeperatorText}>or</span>
                            </div>

                            {/* Login Form */}
                            <Form className={classes.loginForm} onSubmit={this.login}>
                                <Form.Group controlId="formBasicEmail">
                                    <InputGroup>
                                        <InputGroup.Prepend>
                                            <InputGroup.Text><Octicon icon={Person} /></InputGroup.Text>
                                        </InputGroup.Prepend>
                                        <Form.Control name="email" type="email" placeholder="Email Address" required />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group controlId="formBasicPassword">
                                    <InputGroup>
                                        <InputGroup.Prepend>
                                            <InputGroup.Text><Octicon icon={Key} /></InputGroup.Text>
                                        </InputGroup.Prepend>
                                        <Form.Control name="password" type={this.state.passwordHidden ? "password" : "text"} placeholder="Password" required />
                                        <InputGroup.Append>
                                            <InputGroup.Text onClick={this.togglePasswordHidden}>
                                                {this.state.passwordHidden ?
                                                    <span className={classes.form_input_postpend}> <Octicon icon={Eye} /></span> :
                                                    <span className={classes.form_input_postpend}> <Octicon icon={EyeClosed} /></span>}
                                            </InputGroup.Text>
                                        </InputGroup.Append>
                                    </InputGroup>
                                </Form.Group>

                                <div className={classes.submit_container}>
                                    <ReCAPTCHA ref={this.state.recaptchaReference} sitekey={this.state.recaptchaSiteKey} />
                                </div>

                                <div className={classes.submit_container}>
                                    <Button variant="success" className={classes.submit} type="submit">Login</Button>
                                </div>
                            </Form>

                        </div>

                        {/* Footer */}
                        <div className={classes.loginContainerFooter}>
                            <a href="/register">Register</a>
                            <a href="/forgot-password">Forgot Password</a>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    promisedSetState = (newState) => {
        return new Promise((resolve) => {
            this.setState(newState, () => {
                resolve()
            });
        });
    }

}

export default Login;