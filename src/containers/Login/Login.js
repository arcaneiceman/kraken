import React, { Component } from 'react'
import Toolbar from '../../components/Toolbar/Toolbar'
import SocialLoginWrapper from '../../components/SocialLoginWrapper/SocialLoginWrapper'
import { FacebookLoginButton, GoogleLoginButton, GithubLoginButton } from "react-social-login-buttons";
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { Redirect, Link } from 'react-router-dom'
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
        message: null,

        passwordHidden: true,

        directAccess: true
    }

    render() {
        // Go to Dashboard if Logged In
        if (AuthenticationService.isLoggedIn() && this.state.directAccess)
            return <Redirect to="/dashboard" />

        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Register', onClick: () => { this.props.history.push('/register'); }, isPrimary: true })
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help') } })
        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        // Status
        let status;
        switch (this.state.loadingStatus) {
            case 'PROGRESS':
                status = <Spinner animation="border" />
                break;
            case 'ERROR':
                status = <Alert variant='danger'> {this.state.message} </Alert>
                break;
            case 'SUCCESS':
                status = <Alert variant='success'> {this.state.message} </Alert>
                break
            default:
                status = <div></div>;
        }

        let socialLoginContainer =
            <div className={classes.loginSocial}>
                <SocialLoginWrapper
                    autoCleanUri
                    provider='facebook'
                    appId='768877590254144'
                    onLoginSuccess={(authObject) => this.socialAuthenticate('facebook', authObject)}
                    onLoginFailure={(error) => this.socialAuthenticateError(error)}>
                    <FacebookLoginButton />
                </SocialLoginWrapper>
                <SocialLoginWrapper
                    autoCleanUri
                    provider='google'
                    appId='305647727727-fvc3p4740bjn7fl27rbve4c935cnls05.apps.googleusercontent.com'
                    onLoginSuccess={(authObject) => this.socialAuthenticate('google', authObject)}
                    onLoginFailure={(error) => this.socialAuthenticateError(error)}>
                    <GoogleLoginButton />
                </SocialLoginWrapper>
                <SocialLoginWrapper
                    autoCleanUri
                    provider='github'
                    gatekeeper={process.env.REACT_APP_API_URL.replace("/api", "") + '/gatekeeper/github'}
                    appId='c3748a4951a1807e6eef'
                    redirect='https://kraken.work/login'
                    onLoginSuccess={(authObject) => this.socialAuthenticate('github', authObject)}
                    onLoginFailure={(error) => this.socialAuthenticateError(error)}>
                    <GithubLoginButton />
                </SocialLoginWrapper>
                {/* <SocialLoginWrapper
                    provider='linkedin'
                    appId='861pfz1qn01ga3'
                    onLoginSuccess={(authObject) => this.socialAuthenticate('linkedin', authObject)}
                    onLoginFailure={(error) => this.socialAuthenticateError(error)}>
                    <LinkedInLoginButton />
                </SocialLoginWrapper> */}
            </div>

        let seperator =
            <div className={classes.loginSeperator}>
                <span className={classes.loginSeperatorText}>or</span>
            </div>

        let loginForm = <Form className={classes.loginForm} onSubmit={this.login}>
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
                    <Form.Control name="password" type={this.state.passwordHidden ? "password" : "text"} placeholder="Password" autoComplete="on" required />
                    <InputGroup.Append>
                        <InputGroup.Text onClick={this.togglePasswordHidden}>
                            {this.state.passwordHidden ?
                                <span className={classes.form_input_postpend}> <Octicon icon={Eye} /></span> :
                                <span className={classes.form_input_postpend}> <Octicon icon={EyeClosed} /></span>}
                        </InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>

            {isElectron() ? null :
                <div className={classes.submit_container}>
                    <ReCAPTCHA ref={this.state.recaptchaReference} sitekey={this.state.recaptchaSiteKey} />
                </div>}

            <div className={classes.submit_container}>
                <Button variant="success" type="submit">Login</Button>
                <span style={{ marginRight: '5px' }}></span>
                <Button variant="secondary" onClick={this.loginAsGuest}>Login As Guest</Button>
            </div>

            {/* Footer */}
            <div className={classes.loginContainerFooter}>
                <Link to="/register">Register</Link>
                <Link to="/forgot-password">Forgot Password</Link>
            </div>

        </Form>

        let loginSubContainer;
        if (isElectron()) {
            loginSubContainer =
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    {loginForm}
                </div>
        }
        else {
            loginSubContainer =
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    {socialLoginContainer}
                    {seperator}
                    {loginForm}
                </div>
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
                        {loginSubContainer}
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
        );
    }

    login = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!form.checkValidity())
            return

        let recaptchaResponse = "";
        if (!isElectron())
            recaptchaResponse = this.state.recaptchaReference.current.getValue();
        await this.promisedSetState({ loadingStatus: 'PROGRESS', message: null, directAccess: false })
        try {
            const email = form.elements["email"].value;
            const password = form.elements["password"].value;
            await AuthenticationService.authenticate(email, password, recaptchaResponse)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', message: 'Success! Taking you to Dashboard' })
            await new Promise(resolve => setTimeout(resolve, 500));
            this.props.history.push('/dashboard')
        }
        catch (error) {
            await this.promisedSetState({ loadingStatus: 'ERROR', message: error.response.data.message})
        }
    }

    socialAuthenticate = async (provider, authObject) => {
        await this.promisedSetState({ loadingStatus: 'PROGRESS', message: null, directAccess: false })
        try {
            await AuthenticationService.socialAuthenticate(provider, authObject._token.accessToken)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', message: 'Success! Taking you to Dashboard' })
            await new Promise(resolve => setTimeout(resolve, 500));
            this.props.history.push('/dashboard')
        }
        catch (error) {
            await this.promisedSetState({ loadingStatus: 'ERROR', message: error.response.data.message})
        }
    }

    loginAsGuest = async () => {
        let recaptchaResponse = "";
        if (!isElectron())
            recaptchaResponse = this.state.recaptchaReference.current.getValue();

        await this.promisedSetState({ loadingStatus: 'PROGRESS', message: null, directAccess: false })
        try{
            const name = "kraken-anonymous-user-" + Math.floor((Math.random() * 100000) + 1)
            const email = name + "@ahem.email"
            const password = Math.random().toString(36).slice(2)
            const confirmPassword = password
            await AuthenticationService.register(name, email, password, confirmPassword, recaptchaResponse)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', message: 'Success! Taking you to Activation...' })
            await new Promise(resolve => setTimeout(resolve, 500));
            this.props.history.push('/activation?email=' + email)
        }
        catch (error) {
            await this.promisedSetState({ loadingStatus: 'ERROR', message: error.response.data.message })
        }
    }

    socialAuthenticateError = async (error) => {
        await this.promisedSetState({ loadingStatus: 'ERROR', message: "Social Authentication Failed" })
        console.log(error)
    }

    togglePasswordHidden = () => {
        const currentState = this.state.passwordHidden;
        this.setState({ passwordHidden: !currentState })
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