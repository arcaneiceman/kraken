import React, { Component } from 'react';
import Toolbar from '../../components/Toolbar/Toolbar';
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import AuthenticationService from '../../services/AuthenticationService'
import { Link } from 'react-router-dom'
import Octicon, { Person, Key , EyeClosed, Eye } from '@githubprimer/octicons-react';
import isElectron from 'is-electron';

import classes from './Login.module.css'

class Login extends Component {

    state = {
        loadingStatus: null,
        errorMessage : null,
        successMessage : null,

        passwordHidden : true,
    }

    login = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!form.checkValidity())
            return

        await this.promisedSetState({loadingStatus: 'PROGRESS', errorMessage : null, successMessage : null})
        await new Promise(resolve => setTimeout(resolve, 1500));
        try{
            const email = form.elements["email"].value;
            const password = form.elements["password"].value;
            await  AuthenticationService.authenticate(email, password)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', successMessage : 'Success! Taking you to Dashboard', errorMessage : null })
        }
        catch(error){
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage : error.response.data.message, successMessage : null })
        }
    }

    togglePasswordHidden = () => {
        const currentState = this.state.passwordHidden;
        this.setState({ passwordHidden: !currentState })
    }

    render() {
        // Go to Dashboard if Logged In
        if (AuthenticationService.isLoggedIn())
            setTimeout( () => {this.props.history.push('/'); }, 1000);

        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Get Started', onClick: () => { this.props.history.push('/register'); }, isPrimary: true })
        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login'); } });
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron'/> : <Toolbar navLinks={navLinks} type='web'/>


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
                    <div className={classes.form_container}>
                        <Form className={classes.form} onSubmit={this.login}>
                            <div className={classes.form_status_container}>{status}</div>
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
                                    <Form.Control name="password" type="password" placeholder="Password" required />
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
                                <Button variant="success" className={classes.submit} type="submit">Login</Button>
                            </div>

                        </Form>
                        <div className={classes.form_footer}>
                            <Link to="/register">Get Started</Link>
                            <Link to="/forgot-password">Forgot Password</Link>
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
