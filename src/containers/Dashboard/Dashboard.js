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
import Collapse from 'react-bootstrap/Collapse'
import DashboardAlert from 'react-bootstrap/Alert'
import { Redirect } from 'react-router-dom'
import Octicon, { Question, KebabHorizontal, Alert, DesktopDownload } from '@githubprimer/octicons-react';
import ActiveRequestService from '../../services/ActiveRequestService';
import AuthenticationService from '../../services/AuthenticationService';
import PasswordListService from '../../services/PasswordListService';
import ChangeLogService from '../../services/ChangeLogService';
import NotificationService from '../../utils/NotificiationService';
import Spinner from 'react-bootstrap/Spinner';
import isElectron from 'is-electron';
import lsbridge from 'lsbridge'
import ReactMarkdown from 'react-markdown'
import { version } from '../../utils/AppVersion'

import classes from './Dashboard.module.css'

class Dashboard extends Component {

    state = {
        availablePasswordLists: [],

        /* Dashboard Alert */
        dashboardAlertConstant: "dashboard-alert-",
        dashboardAlertContent: null,
        dashboardAlertExpanded: false,

        /* New Active Request Modal */
        newActiveRequestModalVisible: false,
        newActiveRequestFormValidated: false,
        newActiveRequestFormLoadingStatus: false,
        newActiveRequestErrorMessage: null,

        /* New Active Request */
        newActiveRequestType: "",
        newActiveRequestName: "",
        newActiveRequestMetadata: {},
        newActiveRequestValueToMatchInBase64: "",
        newActiveRequestTrackedLists: [],
        newActiveRequestErrors: [],
    }

    render() {
        // Authentication Protection for Component
        if (!AuthenticationService.isLoggedIn())
            return <Redirect to="/login" />

        // NavLinks for Toolbar
        const navLinks = [];
        navLinks.push({ text: 'Create New Request', onClick: this.launchNewActiveRequestModal, isPrimary: true });
        navLinks.push({ text: 'Help', onClick: () => { this.props.history.push('/help') } })
        navLinks.push({ text: 'Change Password', onClick: () => { this.props.history.push('/change-password'); } })
        navLinks.push({ text: 'Logout', onClick: this.logout });
        const toolbar = isElectron() ? <Toolbar navLinks={navLinks} type='electron' /> : <Toolbar navLinks={navLinks} type='web' />

        // Build Dashboard Alert
        const dashboardAlert = this.state.dashboardAlertContent !== null ?
            <DashboardAlert variant="info" style={{ marginBottom: '-1%', marginTop: '2%', flexGrow: '1' }}
                show={this.state.dashboardAlertContent !== null} onClose={this.state.dashboardAlertContent.dismiss} dismissible>
                {this.state.dashboardAlertContent.title !== null ? this.state.dashboardAlertContent.title : null}
                &nbsp;
                {this.state.dashboardAlertContent.buttonIcon !== null && this.state.dashboardAlertContent.buttonFunc !== null ?
                    <Button style={{ border: 'none' }} size="sm" variant="outline-primary" onClick={this.state.dashboardAlertContent.buttonFunc}>
                        <Octicon icon={this.state.dashboardAlertContent.buttonIcon} />
                    </Button> : null}
                {this.state.dashboardAlertContent.detail !== null ?
                    <Collapse in={this.state.dashboardAlertExpanded}>
                        <ReactMarkdown source={this.state.dashboardAlertContent.detail.trim()} />
                    </Collapse> : null}
            </DashboardAlert> : null

        // Build Modal
        const newActiveRequestModal = this.buildModal();

        return (
            <div>
                {toolbar} {/* Toolbar */}
                {newActiveRequestModal} {/* Modal */}
                <div className={classes.container}> {/* Container */}
                    <div className={classes.dashboardAlertContainer}>
                        {dashboardAlert}
                    </div>
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
            case '2500':
                // Metadata
                metadataFields =
                    <Col>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>Filter On</Form.Label>
                            <Form.Text className="text-muted">Specify which SSIDs to target</Form.Text>
                            <Form.Control onChange={this.setRequestMetadata} name="Filter On" type="text" placeholder="SSID-1,SSID-2 (optional)" pattern=".*" />
                            <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                valueToMatchInBase64Field =
                    <Col>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>Packet Capture File</Form.Label>
                            <Form.Text className="text-muted">Cap/Pcap or Hccapx (Max 50mb)</Form.Text>
                            <Form.Control onChange={this.setValueToMatchInBase64} type="file" required></Form.Control>
                            <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                break;
            // TODO : ADD More
            default:
                metadataFields = null
                valueToMatchInBase64Field = null
        }

        // Tracked Lists
        const trackedLists = this.state.newActiveRequestTrackedLists.map(trackedList => {
            return (<Button key={trackedList} className={classes.newRequestTrackedListPill} variant="secondary"
                onClick={() => this.removeTrackedList(trackedList)}>{trackedList}</Button>);
        })

        // Error Message
        let errorMessage = null;
        if (this.state.newActiveRequestErrorMessage !== null) {
            errorMessage =
                <div className={classes.errorMessage}>
                    <Octicon icon={Alert} />
                    <strong>{this.state.newActiveRequestErrorMessage}&nbsp;
                    Learn more in the <a href="https://kraken.work/help#how-to_faq" target="_blank" rel="noopener noreferrer">FAQ</a> section.</strong>
                </div>
        }

        // Submit Button
        let submitButton = null
        if (this.state.newActiveRequestFormLoadingStatus) {
            submitButton =
                <Button variant="primary" disabled>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                </Button>
        }
        else {
            submitButton = <Button type="submit" variant="primary" form="main-form">Submit</Button>
        }

        // Return Modal
        return (
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter"
                show={this.state.newActiveRequestModalVisible} onHide={this.closeNewActiveRequestModal} centered >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Create New Request
                        &nbsp;
                        <a href="https://kraken.work/help#how-to" target="_blank" rel="noopener noreferrer"> <Octicon icon={Question} /></a>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    {/* Request Detail Section */}
                    <Form id="main-form" onSubmit={this.submitNewActiveRequestModal} validated={this.state.newActiveRequestFormValidated}>
                        <Row>
                            <Col>
                                <Form.Group className={classes.formGroup}>
                                    <Form.Label className={classes.modal_form_label}>Name</Form.Label>
                                    <Form.Text className="text-muted">
                                        Give your request a friendly name (max 30 characters)
                                    </Form.Text>
                                    <Form.Control name="name" onChange={this.setRequestName} type="text" minLength="1" maxLength="30" required />
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
                                        <option value="2500">WPA/WPA2 (Cap or Hccapx)</option>
                                        {/* <option value="NTLM">NTLM</option> */}
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

                    {/* Tracked Lists Section */}
                    <Form>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>Tracked Lists</Form.Label>
                            <div className={classes.newRequestTrackedListBox}>
                                {trackedLists}
                            </div>
                        </Form.Group>
                    </Form>


                    {/* Password List Section */}
                    <Form onSubmit={this.addPasswordList}>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>
                                Password Lists
                            </Form.Label>
                            <Form.Text className="text-muted">
                                Add password list using the input below. Remove them by clicking on the pill
                            </Form.Text>
                            <Row>
                                <Col sm="9">
                                    <Form.Control name="passwordLists" as="select">
                                        <option disabled>Choose...</option>
                                        {this.state.availablePasswordLists.map(availablePasswordList =>
                                            <option key={availablePasswordList.name}>{availablePasswordList.name} ({availablePasswordList.jobDelimiterSetSize} jobs)</option>)}
                                    </Form.Control>
                                </Col>
                                <Col sm="1"><Button type="submit">Add</Button></Col>
                                <Col ><Button onClick={this.addAllPasswordLists}>Add All</Button></Col>
                            </Row>
                        </Form.Group>
                    </Form>

                    {/* Crunch Parameter Section */}
                    <Form onSubmit={this.addCrunchParameter}>
                        <Form.Group className={classes.formGroup}>
                            <Form.Label className={classes.modal_form_label}>
                                Crunch Parameters&nbsp;
                                <a href="http://manpages.ubuntu.com/manpages/bionic/man1/crunch.1.html"
                                    target="_blank" rel="noopener noreferrer">
                                    <Octicon icon={Question} />
                                </a>
                            </Form.Label>
                            <Form.Text className="text-muted">
                                Add crunch parameters using the inputs below. Remove them by clicking on the pill
                            </Form.Text>
                            <Row>
                                <Col sm="3">
                                    <Form.Control name="min" type="number" placeholder="min" min="1" max="12" required />
                                    <Form.Control.Feedback type="invalid">Min must be between 1 and 12</Form.Control.Feedback>
                                </Col>
                                <Col sm="3">
                                    <Form.Control name="max" type="number" placeholder="max" min="1" max="12" required />
                                    <Form.Control.Feedback type="invalid">Max must be between 1 and 12</Form.Control.Feedback>
                                </Col>
                                <Col sm="6">
                                    <Form.Control name="characters" type="text" list="character-options" placeholder="charset" required />
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
                                <Col sm="2">
                                </Col>
                            </Row>
                            <Row style={{ marginTop: "5px" }}>
                                <Col sm="6">
                                    <Form.Control name="pattern" type="text" maxLength="12" placeholder="[-t] pattern (optional)" />
                                    <Form.Control.Feedback type="invalid"></Form.Control.Feedback>
                                </Col>
                                <Col sm="3">
                                    <Form.Control name="start" type="text" maxLength="12" placeholder="[-s] start (optional)" />
                                    <Form.Control.Feedback type="invalid">Start String should be equal to  min character</Form.Control.Feedback>
                                </Col>
                                <Col sm="1"><Button type="submit">Add</Button></Col>
                                <Col ><Button onClick={this.addAllCrunchParameter}>Add All</Button></Col>
                            </Row>
                        </Form.Group>
                    </Form>

                </Modal.Body>
                <Modal.Footer>
                    {errorMessage}
                    <Button variant="outline-warning" onClick={this.clearNewActiveRequestVariables}>Clear</Button>
                    <Button variant="secondary" onClick={this.closeNewActiveRequestModal}>Close</Button>
                    {submitButton}
                </Modal.Footer>
            </Modal >);
    }

    componentDidMount = () => {
        this.showDashboardAlert();
    }

    logout = async () => {
        try { await AuthenticationService.logout(); }
        finally { this.props.history.push('/login'); }
    }

    showDashboardAlert = async () => {
        const changeLog = await ChangeLogService.getLatestChangeLog()
        if (!changeLog.trim().startsWith(version))
            this.promisedSetState({
                dashboardAlertContent: {
                    title: "New version of Kraken has been released!",
                    dismiss: this.dismissDashboardAlertWithoutEntry,
                    buttonIcon: DesktopDownload,
                    buttonFunc: this.updateClient,
                    detail: null,
                }
            })
        else
            if (localStorage.getItem(this.state.dashboardAlertConstant + version) == null)
                this.promisedSetState({
                    dashboardAlertContent: {
                        title: "Explore whats new in v" + version,
                        dismiss: this.dimissDashboardAlertWithEntry,
                        buttonIcon: KebabHorizontal,
                        buttonFunc: this.toggleDashboardAlert,
                        detail: changeLog.substring(changeLog.indexOf("\n") + 1)
                    }
                })
    }

    toggleDashboardAlert = async () => {
        this.promisedSetState({ dashboardAlertExpanded: !this.state.dashboardAlertExpanded })
    }

    dimissDashboardAlertWithEntry = async () => {
        Object.entries(localStorage).filter(entry => entry[0].includes(this.state.dashboardAlertConstant)).forEach(entry => localStorage.removeItem(entry[0]))
        localStorage.setItem(this.state.dashboardAlertConstant + version, true)
        this.dismissDashboardAlertWithoutEntry();
    }

    dismissDashboardAlertWithoutEntry = async () => {
        this.promisedSetState({ dashboardAlertContent: null })
    }

    updateClient = async () => {
        if (isElectron())
            window.open("https://github.com/arcaneiceman/kraken-client/releases")
        else
            window.location.reload(true);
    }

    launchNewActiveRequestModal = async () => {
        try {
            const response = await PasswordListService.getPasswordLists()
            await this.promisedSetState({
                availablePasswordLists: response.data.content,
                newActiveRequestModalVisible: true
            });
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    closeNewActiveRequestModal = () => {
        this.setState({
            /* Page State */
            newActiveRequestModalVisible: false,
            newActiveRequestFormValidated: false,
            newActiveRequestErrorMessage: null,
        })
    }

    clearNewActiveRequestVariables = async () => {
        this.promisedSetState({
            newActiveRequestType: "",
            newActiveRequestName: "",
            newActiveRequestMetadata: {},
            newActiveRequestValueToMatchInBase64: "",
            newActiveRequestTrackedLists: [],
            newActiveRequestErrors: [],
        })
    }

    submitNewActiveRequestModal = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.checkValidity())
            return
        try {
            await this.promisedSetState({ newActiveRequestFormValidated: true, newActiveRequestErrorMessage: null, newActiveRequestFormLoadingStatus: true })
            await new Promise(resolve => setTimeout(resolve, 500));
            await ActiveRequestService.createActiveRequest(
                this.state.newActiveRequestType,
                this.state.newActiveRequestName,
                this.state.newActiveRequestMetadata,
                this.state.newActiveRequestValueToMatchInBase64,
                this.state.newActiveRequestTrackedLists)
            this.closeNewActiveRequestModal();
            this.clearNewActiveRequestVariables();
            lsbridge.send('active-requests');
        }
        catch (error) {
            await this.promisedSetState({ newActiveRequestFormValidated: false, newActiveRequestErrorMessage: error.response.data.message })
        }
        finally {
            await this.promisedSetState({ newActiveRequestFormLoadingStatus: false })
        }
    }

    addCrunchParameter = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        let listName = "crunch " + form.elements["min"].value + " " + form.elements["max"].value + " " + form.elements["characters"].value
        if (typeof form.elements["pattern"].value !== 'undefined' && form.elements["pattern"].value !== null && form.elements["pattern"].value !== "")
            listName = listName + " -t " + form.elements["pattern"].value
        if (typeof form.elements["start"].value !== 'undefined' && form.elements["start"].value !== null && form.elements["start"].value !== "")
            listName = listName + " -s " + form.elements["start"].value
        this.addTrackedList(listName);
        form.reset();
    }

    addAllCrunchParameter = () => {
        this.addTrackedList("crunch 1 12 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
    }

    addPasswordList = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        this.addTrackedList(form.elements["passwordLists"].value.replace(/ *\([^)]*\) */g, ""))
        form.reset();
    }

    addAllPasswordLists = () => {
        this.state.availablePasswordLists.forEach(availablePasswordList => { this.addTrackedList(availablePasswordList.name) })
    }

    addTrackedList = (listName) => {
        const trackedLists = this.state.newActiveRequestTrackedLists;
        if (!trackedLists.includes(listName) && listName !== 'Choose...') {
            trackedLists.push(listName);
            this.setState({ newActiveRequestTrackedLists: trackedLists });
        }
    }

    removeTrackedList = (listName) => {
        const trackedLists = this.state.newActiveRequestTrackedLists;
        const result = trackedLists.filter(element => { return !(element === listName); })
        this.setState({ newActiveRequestTrackedLists: result });
    }

    setRequestName = (event) => {
        this.setState({ newActiveRequestName: event.target.value });
    }

    setRequestType = (event) => {
        this.setState({ newActiveRequestType: event.target.value });
    }

    setRequestMetadata = (event) => {
        const metadata = this.state.newActiveRequestMetadata;
        metadata[event.target.name] = event.target.value;
        this.setState({ newActiveRequestMetadata: metadata });
    }

    setValueToMatchInBase64 = async (event) => {
        const type = event.target.type
        let valueToMatch = type === "file" ? event.target.files[0] : event.target.value;
        if (valueToMatch === null || typeof valueToMatch === 'undefined' || valueToMatch === "")
            return;
        await this.promisedSetState({ newActiveRequestFormLoadingStatus: true })
        if (type === "file")
            valueToMatch = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsBinaryString(valueToMatch)
            })
        valueToMatch = btoa(valueToMatch)
        await this.promisedSetState({ newActiveRequestValueToMatchInBase64: valueToMatch, newActiveRequestFormLoadingStatus: false });
    }

    promisedSetState = (newState) => {
        return new Promise((resolve) => {
            this.setState(newState, () => {
                resolve()
            });
        });
    }

    readFileAsync = (file) => {
        new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsBinaryString(file);
                })
      }

}

export default Dashboard;