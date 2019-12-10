import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'
import AuthenticationService from '../../services/AuthenticationService';
import Toolbar from '../../components/Toolbar/Toolbar'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Octicon, { Key, EyeClosed, Eye } from '@githubprimer/octicons-react';

import classes from './ChangePassword.module.css'

class ChangePassword extends Component {

    state = {
        loadingStatus: null,
        errorMessage: null,
        successMessage: null,

        oldPasswordHidden: true,
        newPasswordHidden: true,
        newConfirmPasswordHidden: true
    }

    changePassword = async(event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!form.checkValidity())
            return

        await this.promisedSetState({loadingStatus: 'PROGRESS', errorMessage : null, successMessage : null})
        await new Promise(resolve => setTimeout(resolve, 500));

        try{
            const oldPassword = form.elements["old_password"].value;
            const newPassword = form.elements["new_password"].value;
            const newConfirmPassword = form.elements["new_confirm_password"].value;
            await AuthenticationService.changePassword(oldPassword, newPassword, newConfirmPassword)
            await this.promisedSetState({loadingStatus : 'SUCCESS', successMessage : "Successfully Changed Password", errorMessage : null})
        }
        catch(error){
            await this.promisedSetState({ loadingStatus: 'ERROR', errorMessage: error.response.data.message })
        }
    }

    toggleOldPasswordHidden = () => {
        const currentState = this.state.oldPasswordHidden;
        this.setState({ oldPasswordHidden: !currentState })
    }

    toggleNewPasswordHidden = () => {
        const currentState = this.state.newPasswordHidden;
        this.setState({ newPasswordHidden: !currentState })
    }

    toggleNewConfirmPasswordHidden = () => {
        const currentState = this.state.newConfirmPasswordHidden;
        this.setState({ newConfirmPasswordHidden: !currentState })
    }

    logout = async () => {
        try {
            await AuthenticationService.logout();
        }
        finally {
            this.props.history.push('/login');
        }
    }

    render() {
        // Authentication Protection for Component
        if (!AuthenticationService.isLoggedIn())
            return <Redirect to="/login" />

        // NavLinks for Toolbar
        let navLinks = [];
        navLinks.push({ text: 'Dashboard', onClick: () => { this.props.history.push('/dashboard'); }, isPrimary: true })
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help')}})
        navLinks.push({ text: 'Change Password', onClick: () => { this.props.history.push('/change-password'); } })
        navLinks.push({ text: 'Logout', onClick: this.logout });

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
                <Toolbar navLinks={navLinks} />
                <div className={classes.background}>
                    <div className={classes.header}><h1 className={classes.title}>Change Password</h1></div>
                    <div className={classes.form_container}>
                        <Form className={classes.form} onSubmit={this.changePassword}>
                            <div className={classes.form_status_container}>{status}</div>

                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text ><Octicon icon={Key} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="old_password" type={this.state.oldPasswordHidden ? 'password' : 'text'}
                                        placeholder="Old Password" defaultValue="test" required />
                                    <InputGroup.Append>
                                        <InputGroup.Text onClick={this.toggleOldPasswordHidden}>
                                            {this.state.oldPasswordHidden ?
                                                <span className={classes.form_input_postpend}> <Octicon icon={Eye} /></span> :
                                                <span className={classes.form_input_postpend}> <Octicon icon={EyeClosed} /></span>
                                            }
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Key} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="new_password" type={this.state.newPasswordHidden ? 'password' : 'text'}
                                        placeholder="Confirm Password" defaultValue="test" required />
                                    <InputGroup.Append>
                                        <InputGroup.Text onClick={this.toggleNewPasswordHidden}>
                                            {this.state.newPasswordHidden ?
                                                <span className={classes.form_input_postpend}> <Octicon icon={Eye} /></span> :
                                                <span className={classes.form_input_postpend}> <Octicon icon={EyeClosed} /></span>
                                            }
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text><Octicon icon={Key} /></InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control name="new_confirm_password" type={this.state.newConfirmPasswordHidden ? 'password' : 'text'}
                                        placeholder="Confirm Password" defaultValue="test" required />
                                    <InputGroup.Append>
                                        <InputGroup.Text onClick={this.toggleNewConfirmPasswordHidden}>
                                            {this.state.newConfirmPasswordHidden ?
                                                <span className={classes.form_input_postpend}> <Octicon icon={Eye} /></span> :
                                                <span className={classes.form_input_postpend}> <Octicon icon={EyeClosed} /></span>
                                            }
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Form.Group>

                            <div className={classes.submit_container}>
                                <Button variant="success" className={classes.submit} type="submit">Change Password</Button>
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

export default ChangePassword;