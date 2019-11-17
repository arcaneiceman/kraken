import React, { Component } from 'react';
import Toolbar from '../../components/Toolbar/Toolbar';
import ActiveRequests from '../ActiveRequests/ActiveRequests'
import Workers from '../Workers/Workers'
import KrakenWorker from '../KrakenWorker/KrakenWorker';
import CompletedRequests from '../CompletedRequests/CompletedRequests';
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Redirect } from 'react-router-dom'
import Octicon, { Alert } from '@githubprimer/octicons-react';
import ActiveRequestService from '../../services/ActiveRequestService';
import AuthenticationService from '../../services/AuthenticationService';
import PasswordListService from '../../services/PasswordListService';
import NotificationService from '../../utils/NotificiationService';
import isElectron from 'is-electron';

import classes from './Dashboard.module.css'

class Dashboard extends Component {

    state = {
        availablePasswordLists: [],

        /* Page State */
        newActiveRequestModalVisible: false,
        newActiveRequestFormValidated: false,
        newActiveRequestErrorMessage: null,

        /* New Active Request State */
        newActiveRequestType: "",
        newActiveRequestName: "",
        newActiveRequestMetadata: {},
        newActiveRequestValueToMatchInBase64: "",
        newActiveRequestNeedsFullClient: null,
        newActiveRequestCrunchParameters: [],
        newActiveRequestPasswordLists: [],
        newActiveRequestErrors: [],

        /* Control State */
        activeRequestsComponentNeedsToRefresh: false
    }

    launchNewActiveRequestModal = async () => {
        try {
            const { data } = await PasswordListService.getPasswordLists()
            this.setState({
                availablePasswordLists: data.content.map(passwordList => { return passwordList.name; }),
                newActiveRequestModalVisible: true
            });
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    submitNewActiveRequestModal = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        // Check Form Validiy
        if (!form.checkValidity())
            return

        await this.promisedSetState({ newActiveRequestFormValidated: true, newActiveRequestErrorMessage: null })
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
            await ActiveRequestService.createActiveRequest(
                this.state.newActiveRequestType,
                this.state.newActiveRequestName,
                JSON.stringify(this.state.newActiveRequestMetadata),
                this.state.newActiveRequestValueToMatchInBase64,
                this.state.newActiveRequestPasswordLists == null ? [] : this.state.newActiveRequestPasswordLists,
                this.state.newActiveRequestCrunchParameters == null ? [] : this.state.newActiveRequestCrunchParameters)
            this.closeNewActiveRequestModal();
            this.activeRequestRef.getSummary();
            this.activeRequestRef.getActiveRequests();
        }
        catch (error) {
            await this.promisedSetState({ newActiveRequestFormValidated: false, newActiveRequestErrorMessage: error.response.data.message })
        }
    }

    closeNewActiveRequestModal = () => {
        this.setState({
            /* Page State */
            newActiveRequestModalVisible: false,
            newActiveRequestFormValidated: false,
            newActiveRequestErrorMessage: null,

            /* New Active Request State */
            newActiveRequestType: "",
            newActiveRequestName: "",
            newActiveRequestMetadata: {},
            newActiveRequestValueToMatchInBase64: "",
            newActiveRequestCrunchParameters: [],
            newActiveRequestPasswordLists: []
        })
    }

    logout = async () => {
        try {
            await AuthenticationService.deactivateAuthRefresh();
            await AuthenticationService.logout();
        }
        finally {
            this.props.history.push('/login');
        }
    }

    addCrunchParameter = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const crunchParams = this.state.newActiveRequestCrunchParameters;
        var newCrunchParam = {
            minSize: form.elements["minSize"].value,
            maxSize: form.elements["maxSize"].value,
            characters: form.elements["characters"].value,
            startString: form.elements["startString"].value
        }
        let found = crunchParams.find(element => {
            return (element.minSize === newCrunchParam.minSize &&
                element.maxSize === newCrunchParam.maxSize &&
                element.characters === newCrunchParam.characters &&
                element.startString === newCrunchParam.startString);
        })
        if (!found) {
            crunchParams.push(newCrunchParam);
            this.setState({ newActiveRequestCrunchParameters: crunchParams });
        }
        form.reset();
    }

    removeCrunchParameter = (minSize, maxSize, characters, startString) => {
        const crunchParams = this.state.newActiveRequestCrunchParameters;
        const result = crunchParams.filter(element => {
            return !(element.minSize === minSize &&
                element.maxSize === maxSize &&
                element.characters === characters &&
                element.startString === startString)
        })
        this.setState({ newActiveRequestCrunchParameters: result });
    }

    addPasswordList = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const passwordLists = this.state.newActiveRequestPasswordLists;
        let passwordList = form.elements["passwordLists"].value;
        if (!passwordLists.includes(passwordList) && passwordList !== 'Choose...') {
            passwordLists.push(passwordList);
            this.setState({ newActiveRequestPasswordLists: passwordLists });
        }
        form.reset();
    }

    removePasswordList = (passwordList) => {
        const passwordLists = this.state.newActiveRequestPasswordLists;
        const result = passwordLists.filter(element => {
            return !(element === passwordList);
        })
        this.setState({ newActiveRequestPasswordLists: result });
    }

    setRequestName = (event) => {
        this.setState({ newActiveRequestName: event.target.value });
    }

    setRequestType = (event) => {
        this.setState({ newActiveRequestType: event.target.value });
    }

    setRequestMetadata = (event) => {
        const metadata = this.state.newActiveRequestMetadata;
        let fieldname = event.target.name;
        let value = event.target.value;
        metadata[fieldname] = value;
        this.setState({ newActiveRequestMetadata: metadata });
    }

    setValueToMatchInBase64 = (event) => {
        let type = event.target.name;
        switch (type) {
            case "file":
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsBinaryString(event.target.files[0]);
                }).then((data) => {
                    this.setState({ newActiveRequestValueToMatchInBase64: btoa(data) });
                })
                break;
            case "text":
                this.setState({ newActiveRequestValueToMatchInBase64: btoa(event.target.value) });
                break;
            default:
                console.log("error");
        }
    }

    render() {
        // Authentication Protection for Component
        if (!AuthenticationService.isLoggedIn())
            return <Redirect to="/login" />

        // NavLinks for Toolbar
        const navLinks = [];
        navLinks.push({ text: 'Create New Request', onClick: this.launchNewActiveRequestModal, isPrimary: true });
        navLinks.push({ text: 'Change Password', onClick: () => { this.props.history.push('/change-password'); } })
        navLinks.push({ text: 'Logout', onClick: this.logout });
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        // Build Modal
        const newActiveRequestModal = this.buildModal();
        return (
            <div>
                {newActiveRequestModal} {/* Modal */}
                {toolbar} {/* Toolbar */}
                <div className={classes.padding}> {/* Padding */}
                    <div className={classes.responsiveLayout}> {/* */}
                        <div className={classes.main}> {/* Main Panel */}
                            <ActiveRequests ref={activeRequestRef => { this.activeRequestRef = activeRequestRef }} />
                            <Workers />
                        </div>
                        <div className={classes.side}> {/* Side Panel */}
                            <CompletedRequests />
                            <KrakenWorker />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    buildModal = () => {
        // Metadata and ValueToMatchInBase64 Fields
        let metadataFields = null
        let valueToMatchInBase64Field = null
        switch (this.state.newActiveRequestType) {
            case 'WPA':
                // Metadata
                metadataFields =
                    <Col>
                        <Form.Group className={classes.formGroup} key="SSID">
                            <Form.Label className={classes.modal_form_label}>SSID</Form.Label>
                            <Form.Text className="text-muted">Name of the Target Network</Form.Text>
                            <Form.Control onChange={this.setRequestMetadata} name="SSID" type="text" min="19" max="19" pattern=".*" required />
                            <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                valueToMatchInBase64Field =
                    <Col>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>Capture File</Form.Label>
                            <Form.Text className="text-muted"> Must be in pcap or cap format. Max 50mb</Form.Text>
                            <Form.Control onChange={this.setValueToMatchInBase64} name="file" type="file" required></Form.Control>
                            <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                break;
            default:
                metadataFields = null
                valueToMatchInBase64Field = null
        }

        // Available Password Lists
        const availablePasswordLists = this.state.availablePasswordLists.map(passwordList => {
            return (<option key={passwordList}>{passwordList}</option>);
        });

        // Password Lists
        const passwordLists = this.state.newActiveRequestPasswordLists.map(passwordList => {
            return (<Button key={passwordList} className={classes.newRequestParameterPill}
                onClick={() => this.removePasswordList(passwordList)}>{passwordList}</Button>);
        })

        // Crunch Parameters
        const crunchParameters = this.state.newActiveRequestCrunchParameters.map(crunchParameter => {
            let key = crunchParameter.startString === '' ?
                crunchParameter.minSize + " " + crunchParameter.maxSize + " " + crunchParameter.characters :
                crunchParameter.minSize + " " + crunchParameter.maxSize + " " + crunchParameter.characters + " -s " + crunchParameter.startString;
            return (<Button key={key} className={classes.newRequestParameterPill}
                onClick={() => this.removeCrunchParameter(crunchParameter.minSize, crunchParameter.maxSize, crunchParameter.characters, crunchParameter.startString)}>{key}</Button>)
        });

        // Error Message
        let errorMessage = null;
        if (this.state.newActiveRequestErrorMessage !== null) {
            errorMessage = <div className={classes.errorMessage}> <Octicon icon={Alert} /> <strong>{this.state.newActiveRequestErrorMessage}</strong></div>
        }

        // Return Modal
        return (
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter"
                show={this.state.newActiveRequestModalVisible} onHide={this.closeNewActiveRequestModal} centered >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Create New Request
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    {/* Main Form */}
                    <Form id="main-form" onSubmit={this.submitNewActiveRequestModal} validated={this.state.newActiveRequestFormValidated}>
                        <Row>
                            <Col>
                                <Form.Group className={classes.formGroup}>
                                    <Form.Label className={classes.modal_form_label}>Name</Form.Label>
                                    <Form.Text className="text-muted">
                                        Give your request a friendly name (max 12 characters)
                                        </Form.Text>
                                    <Form.Control name="name" onChange={this.setRequestName} type="text" minLength="1" maxLength="12" required />
                                    <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className={classes.formGroup}>
                                    <Form.Label className={classes.modal_form_label}>Type</Form.Label>
                                    <Form.Text className="text-muted">
                                        What <strong>&nbsp;type&nbsp;</strong>of request would you like to create?
                                    </Form.Text>
                                    <Form.Control name="requestType" onChange={this.setRequestType} as="select" required>
                                        <option disabled selected>Choose...</option>
                                        <option value="WPA">WPA/WPA2</option>
                                    </Form.Control>
                                    <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            {metadataFields}
                            {valueToMatchInBase64Field}
                        </Row>
                    </Form>

                    {/* Password List Form */}
                    <Form onSubmit={this.addPasswordList}>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>
                                Password Lists
                    </Form.Label>
                            <Form.Text className="text-muted">
                                Add password list using the input below. Remove them by clicking on the pill
                    </Form.Text>
                            <Row>
                                <Col sm="12">
                                    <div className={classes.newRequestParameterBox}>
                                        {passwordLists}
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col sm="10">
                                    <Form.Control name="passwordLists" as="select">
                                        <option disabled>Choose...</option>
                                        {availablePasswordLists}
                                    </Form.Control>
                                </Col>
                                <Col sm="0.1"><span /></Col>
                                <Col sm="2"><Button type="submit">Add</Button></Col>
                            </Row>
                        </Form.Group>
                    </Form>

                    {/* Crunch Form */}
                    <Form onSubmit={this.addCrunchParameter}>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>
                                Crunch Parameters
                    </Form.Label>
                            <Form.Text className="text-muted">
                                Add crunch parameters using the inputs below. Remove them by clicking on the pill
                    </Form.Text>
                            <Row>
                                <Col sm="12">
                                    <div className={classes.newRequestParameterBox}>
                                        {crunchParameters}
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col sm="2">
                                    <Form.Control name="minSize" type="number" placeholder="Min" min="1" max="12" required />
                                    <Form.Control.Feedback type="invalid">Min must be between 1 and 12</Form.Control.Feedback>
                                </Col>
                                <Col sm="0.1"><span /></Col>
                                <Col sm="2">
                                    <Form.Control name="maxSize" type="number" placeholder="Max" min="1" max="12" required />
                                    <Form.Control.Feedback type="invalid">Max must be between 1 and 12</Form.Control.Feedback>
                                </Col>
                                <Col sm="0.1"><span /></Col>
                                <Col sm="3">
                                    <Form.Control name="characters" type="text" list="character-options" placeholder="Chars" required />
                                    <datalist id="character-options">
                                        <option>Custom...</option>
                                        <option>0123456789</option>
                                        <option>ABCDEFGHIJKLMNOPQRSTUVWXYZ</option>
                                        <option>abcdefghijklmnopqrstuvwxyz</option>
                                        <option>ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz</option>
                                        <option>ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789</option>
                                        <option>abcdefghijklmnopqrstuvwxyz0123456789</option>
                                        <option>ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789</option>
                                    </datalist>
                                </Col>
                                <Col sm="0.1"><span /></Col>
                                <Col sm="3">
                                    <Form.Control name="startString" type="text" maxLength="12" placeholder="Start (Optional)" />
                                    <Form.Control.Feedback type="invalid">Start must be below 12</Form.Control.Feedback>
                                </Col>
                                <Col sm="0.1"><span /></Col>
                                <Col sm="2"><Button type="submit">Add</Button></Col>
                            </Row>
                        </Form.Group>
                    </Form>

                </Modal.Body>
                <Modal.Footer>
                    {errorMessage}
                    <Button variant="secondary" onClick={this.closeNewActiveRequestModal}>Close</Button>
                    <Button type="submit" variant="primary" form="main-form">Submit</Button>
                </Modal.Footer>
            </Modal >);
    }

    promisedSetState = (newState) => {
        return new Promise((resolve) => {
            this.setState(newState, () => {
                resolve()
            });
        });
    }

}

export default Dashboard;