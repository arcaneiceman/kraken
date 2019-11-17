import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom'
import AuthenticationService from '../../services/AuthenticationService'
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import Toolbar from '../../components/Toolbar/Toolbar';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup'
import Octicon, { Person, Key, Star, EyeClosed, Eye } from '@githubprimer/octicons-react';
import isElectron from 'is-electron';

import classes from './Register.module.css'

class Register extends Component {

    state = {
        loadingStatus: null,
        errorMessage: null,
        successMessage: null,

        passwordHidden: true,
        confirmPasswordHidden: true,
    }

    attemptRegister = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        // Check Form Validiy
        if (!form.checkValidity())
            return

        await this.promisedSetState({ loadingStatus: 'PROGRESS', errorMessage: null, successMessage: null })
        await new Promise(resolve => setTimeout(resolve, 1500));

        try{
            const name = form.elements["name"].value;
            const email = form.elements["email"].value;
            const password = form.elements["password"].value;
            const confirmPassword = form.elements["confirmPassword"].value; 
            await AuthenticationService.register(name, email, password, confirmPassword)
            await this.promisedSetState({ loadingStatus: 'SUCCESS', errorMessage: 'Success! Taking you to Activation...' })
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.props.history.push('/activation?email=' + email)
        }
        catch(error){
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.message })
        }
    }

    togglePasswordHidden = () => {
        const currentState = this.state.passwordHidden;
        this.setState({ passwordHidden: !currentState })
    }

    toggleConfirmPasswordHidden = () => {
        const currentState = this.state.confirmPasswordHidden;
        this.setState({ confirmPasswordHidden: !currentState })
    }

    render() {
        // Go to Dashboard if Logged In
        if (AuthenticationService.isLoggedIn())
            return <Redirect to="/" />;

        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Get Started', onClick: () => { this.props.history.push('/register'); }, isPrimary: true })
        navLinks.push({ text: 'Forgot Password', onClick: () => { this.props.history.push('/forgot-password'); } })
        navLinks.push({ text: 'Login', onClick: () => { this.props.history.push('/login'); } });
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
                    <div className={classes.header}><h1 className={classes.title}>Register</h1></div>
                    <div className={classes.form_container}>
                        <Form className={classes.form} onSubmit={this.attemptRegister}>
                            <div className={classes.form_status_container}>{status}</div>
                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Star} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="name" type="text" placeholder="Name" defaultValue="Wali" required />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Person} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="email" type="email" placeholder="Email Address" defaultValue="wali@test.com" required />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text ><Octicon icon={Key} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="password" type={this.state.passwordHidden ? 'password' : 'text'}
                                        placeholder="Password" defaultValue="test" required />
                                    <InputGroup.Append>
                                        <InputGroup.Text onClick={this.togglePasswordHidden}>
                                            {this.state.passwordHidden ?
                                                <span className={classes.form_input_postpend}> <Octicon icon={Eye} /></span> :
                                                <span className={classes.form_input_postpend}> <Octicon icon={EyeClosed} /></span>}
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Key} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="confirmPassword" type={this.state.confirmPasswordHidden ? 'password' : 'text'}
                                        placeholder="Confirm Password" defaultValue="test" required />
                                    <InputGroup.Append>
                                        <InputGroup.Text onClick={this.toggleConfirmPasswordHidden}>
                                            {this.state.confirmPasswordHidden ?
                                                <span className={classes.form_input_postpend}> <Octicon icon={Eye} /></span> :
                                                <span className={classes.form_input_postpend}> <Octicon icon={EyeClosed} /></span>}
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Form.Group>

                            <div className={classes.submit_container}>
                                <Button className={classes.submit} variant="success" type="submit">Create</Button>
                            </div>

                        </Form>
                        <div className={classes.footer}>
                            <Link to="/login">I already have an account</Link>
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

export default Register