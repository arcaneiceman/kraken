import React, { Component } from 'react';
import Pagination from './../../components/Pagination/Pagination';
import SectionHeading from './../../components/SectionHeading/SectionHeading';
import DetailBox from './../../components/DetailBox/DetailBox';
import SummaryTable from './../../components/SummaryTable/SummaryTable';
import ProgressBar from 'react-bootstrap/ProgressBar';
import ActiveRequestService from '../../services/ActiveRequestService';
import NotificationService from '../../utils/NotificiationService';
import Octicon, { Trashcan } from '@githubprimer/octicons-react';
import Spinner from 'react-bootstrap/Spinner'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import lsbridge from 'lsbridge'
import Table from 'react-bootstrap/Table';

import classes from './ActiveRequests.module.css'

class ActiveRequests extends Component {

    state = {
        loadingStatus: null,
        detailModalActiveRequest: null,
        deleteConfirmationModalActiveRequest: null,

        // Page Size
        pageSize: 4,

        getActiveRequestTimer: null,
        activeRequests: new Array(5),
        currentPage: 1,
        totalPages: 1,

        //  Summary Section Fields
        totalActiveRequests: 0,
        totalJobCount: 0,
        completeJobCount: 0,
        errorJobCount: 0
    }

    render() {
        // Create Summary Section
        const summarySection = (
            <div className={classes.summarySectionContainer} >
                <DetailBox
                    boxValue={this.state.totalActiveRequests.toString()}
                    boxText={'Active Requests'} />
                <div className={classes.progressBarContainer}>
                    <ProgressBar className={classes.progressBar} max={this.state.totalJobCount}>
                        {this.state.completeJobCount > 0 ?
                            <ProgressBar variant="success" max={this.state.totalJobCount} now={this.state.completeJobCount} /> : null}
                        {this.state.errorJobCount > 0 ?
                            <ProgressBar variant="danger" max={this.state.totalJobCount} now={this.state.errorJobCount} /> : null}
                    </ProgressBar>
                    <div className={classes.progressBarTitle}>Progress</div>
                </div>
            </div>
        );

        // Create Table Section
        const tableHeadings = ['Name', 'Type', 'Targets', 'Total Jobs', 'Completed Jobs', 'Errors', ' '].map(tableHeading => {
            return <th className={classes.tableHeaderColumnText} key={tableHeading}>{tableHeading}</th>
        });
        const tableItems = this.state.activeRequests.map(activeRequest => {
            return (
                <tr key={activeRequest.id} onClick={() => this.openDetailModal(activeRequest)}>
                    <td className={classes.tableItem}><strong>{activeRequest.requestName}</strong></td>
                    <td className={classes.tableItem}>{activeRequest.requestType}</td>
                    <td className={classes.tableItem}>{activeRequest.targetCount}</td>
                    <td className={classes.tableItem}>{activeRequest.totalJobCount}</td>
                    <td className={classes.tableItem}>{activeRequest.completedJobCount}</td>
                    <td className={classes.tableItem}>{activeRequest.errorJobCount}</td>
                    <td className={classes.tableItem} style={{ color: "red", cursor: 'pointer' }}
                        onClick={(event) => { event.stopPropagation(); this.openDeleteConfirmationModal(activeRequest) }}>
                        <Octicon icon={Trashcan} />
                    </td>
                </tr>
            );
        })
        for (let i = tableItems.length; i < this.state.pageSize; i++) {
            tableItems.push(<tr key={i}>
                <td className={classes.tableItem}>&nbsp;</td>
                <td className={classes.tableItem}>&nbsp;</td>
                <td className={classes.tableItem}>&nbsp;</td>
                <td className={classes.tableItem}>&nbsp;</td>
                <td className={classes.tableItem}>&nbsp;</td>
                <td className={classes.tableItem}>&nbsp;</td>
                <td className={classes.tableItem}>&nbsp;</td>
            </tr>)
        }

        // Loading Elements
        let loadingSpinner;
        let loadingBackground;
        switch (this.state.loadingStatus) {
            case "PROGRESS":
                loadingBackground = <div className={classes.loadingBackground} />
                loadingSpinner = <Spinner className={classes.loadingSpinner} animation="border" />
                break;
            default:
                loadingBackground = null;
                loadingSpinner = null;
        }

        // Detail Modal 
        let detailModal = this.buildDetailModal();

        // Delete Confirmation Modal
        let deleteConfirmationModal = this.buildDeletionConfirmationModal();

        // Render
        return (
            <div>
                {detailModal}
                {deleteConfirmationModal}
                <SectionHeading heading={'Your Active Requests'} />
                <div className={classes.mainContainer}>
                    {loadingBackground}
                    {loadingSpinner}
                    {summarySection}
                    <SummaryTable
                        tableHeadings={tableHeadings}
                        tableItems={tableItems} />
                    <Pagination
                        nextOnClick={() => this.nextPage()}
                        prevOnClick={() => this.prevPage()}
                        currentPage={this.state.currentPage}
                        totalPages={this.state.totalPages} />
                </div>
            </div>
        );
    }

    buildDetailModal = () => {
        if (this.state.detailModalActiveRequest === null)
            return
        else
            return (
                <Modal size="lg" show={this.state.detailModalActiveRequest !== null} onHide={() => this.closeDetailModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>Active Request Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className={classes.detailModalContainer}>
                            <div className={classes.detailModalProgressBarContainer}>
                                <div className={classes.progressBarContainer}>
                                    <ProgressBar className={classes.progressBar} max={this.state.detailModalActiveRequest.totalJobCount}>
                                        {this.state.completeJobCount > 0 ?
                                            <ProgressBar variant="success" max={this.state.detailModalActiveRequest.totalJobCount} now={this.state.detailModalActiveRequest.completedJobCount} /> : null}
                                        {this.state.errorJobCount > 0 ?
                                            <ProgressBar variant="danger" max={this.state.detailModalActiveRequest.totalJobCount} now={this.state.detailModalActiveRequest.errorJobCount} /> : null}
                                    </ProgressBar>
                                    <div className={classes.progressBarTitle}>Current Progress</div>
                                </div>
                            </div>
                            <div className={classes.detailModalDetailContainer}>
                                <div>
                                    <h3 className={classes.detailModalHeading}>Name</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalActiveRequest.requestName}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Type</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalActiveRequest.requestType}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Targets</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalActiveRequest.targetCount}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Total Jobs</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalActiveRequest.totalJobCount}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Completed Jobs</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalActiveRequest.completedJobCount}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Errors</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalActiveRequest.errorJobCount}</strong></div>
                                </div>
                            </div>
                            <div className={classes.detailModalRequestMetadataContainer} >
                                <h3 className={classes.detailModalHeading}>Metadata</h3>
                                <Table className={classes.detailModalRequestMetadataTable} style={{ marginBottom: '0rem' }} borderless size="sm">
                                    <tbody>
                                        {Object.keys(this.state.detailModalActiveRequest.requestMetadata).map(key => {
                                            return (
                                                <tr key={key}>
                                                    <td style={{ width: '25%' }} className={classes.tableItem}><strong>{key}</strong></td>
                                                    <td className={classes.tableItem}>{this.state.detailModalActiveRequest.requestMetadata[key]}</td>
                                                </tr>);
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                            <div className={classes.detailModalListContainer}>
                                <div className={classes.detailModalHeading}>
                                    Tracked Lists
                                </div>
                                <div className={classes.detailModalListPillContainer}>
                                    {this.state.detailModalActiveRequest.trackedLists.map(trackedList => {
                                        let variant = this.getVariantFromTrackedList(trackedList)
                                        let blinkStyle = this.getBlinkingStyleFromTrackedList(trackedList)
                                        let tce = this.getTCEfromTrackedList(trackedList)
                                        return (
                                            <Button variant={variant} className={[classes.detailModalTrackedListPill, blinkStyle].join(' ')}
                                                key={trackedList.listName}>{trackedList.listName} <br /> (T / C / E): {tce}</Button>
                                        );
                                    })}</div>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            );
    }

    buildDeletionConfirmationModal = () => {
        if (this.state.deleteConfirmationModalActiveRequest === null)
            return
        else
            return (
                <Modal show={this.state.deleteConfirmationModalActiveRequest !== null} onHide={() => this.closeDeleteConfirmationModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Do you want to delete this Active Request: <strong>{this.state.deleteConfirmationModalActiveRequest.requestName}</strong> ?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.closeDeleteConfirmationModal()}>
                            Close
                        </Button>
                        <Button variant="danger" onClick={() => this.deleteActiveRequest()}>
                            Yes, Delete it
                        </Button>
                    </Modal.Footer>
                </Modal>
            );
    }

    componentDidMount = async () => {
        try {
            await this.promisedSetState({ loadingStatus: "PROGRESS" })

            // Clear Event Bus Variables
            localStorage.removeItem('active-requests')
            localStorage.removeItem('active-requests-removeit')

            // Subscribe to eventbus
            lsbridge.subscribe('active-requests', () => {
                this.getSummary()
                this.listActiveRequests()
            });

            // Set Timer
            const timer = setInterval(() => { lsbridge.send('active-requests'); }, 15000);
            this.setState({ getActiveRequestTimer: timer })

            // Pull Fresh Data
            lsbridge.send('active-requests');
        }
        finally {
            await this.promisedSetState({ loadingStatus: null })
        }
    }

    componentWillUnmount() {
        clearInterval(this.state.getActiveRequestTimer);
        lsbridge.unsubscribe('active-requests');
    }

    openDetailModal = async (activeRequest) => {
        this.promisedSetState({ detailModalActiveRequest: activeRequest })
    }

    closeDetailModal = async () => {
        this.promisedSetState({ detailModalActiveRequest: null })
    }

    openDeleteConfirmationModal = async (activeRequest) => {
        this.promisedSetState({ deleteConfirmationModalActiveRequest: activeRequest })
    }

    closeDeleteConfirmationModal = async () => {
        this.promisedSetState({ deleteConfirmationModalActiveRequest: null })
    }

    nextPage = async () => {
        if (this.state.currentPage + 1 <= this.state.totalPages) {
            try {
                await this.promisedSetState({ currentPage: this.state.currentPage + 1, loadingStatus: "PROGRESS" })
                this.listActiveRequests()
            }
            finally {
                await this.promisedSetState({ loadingStatus: null })
            }
        }
    }

    prevPage = async () => {
        if (this.state.currentPage - 1 >= 1) {
            try {
                await this.promisedSetState({ currentPage: this.state.currentPage - 1, loadingStatus: "PROGRESS" })
                this.listActiveRequests()
            }
            finally {
                await this.promisedSetState({ loadingStatus: null })
            }
        }
    }

    getSummary = async () => {
        try {
            const response = await ActiveRequestService.getSummary(this.onGetSummarySuccess)
            await this.promisedSetState({
                totalActiveRequests: response.data.totalActiveRequests,
                totalJobCount: response.data.totalJobCount,
                completeJobCount: response.data.completeJobCount,
                errorJobCount: response.data.errorJobCount
            })
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    listActiveRequests = async () => {
        try {
            const response = await ActiveRequestService.listActiveRequests(this.state.currentPage, this.state.pageSize)
            response.data.content.forEach(activeRequest => {
                activeRequest.totalJobCount = activeRequest.trackedLists.map(trackedList => trackedList.totalJobCount).reduce((acc, value) => acc + value, 0);
                activeRequest.completedJobCount = activeRequest.trackedLists.map(trackedList => trackedList.completedJobCount).reduce((acc, value) => acc + value, 0);
                activeRequest.errorJobCount = activeRequest.trackedLists.map(trackedList => trackedList.errorJobCount).reduce((acc, value) => acc + value, 0);
            })
            await this.promisedSetState({
                activeRequests: response.data.content,
                totalPages: response.data.totalPages === 0 ? 1 : response.data.totalPages,
            })
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    deleteActiveRequest = async () => {
        if (this.state.deleteConfirmationModalActiveRequest === null)
            return
        try {
            await this.promisedSetState({ loadingStatus: "PROGRESS" })
            await ActiveRequestService.deleteActiveRequest(this.state.deleteConfirmationModalActiveRequest.id);
            lsbridge.send('active-requests');
            lsbridge.send('complete-requests');
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
        finally {
            await this.promisedSetState({ loadingStatus: null, deleteConfirmationModalActiveRequest: null })
        }
    }

    promisedSetState = (newState) => {
        return new Promise((resolve) => {
            this.setState(newState, () => {
                resolve()
            });
        });
    }

    getVariantFromTrackedList = (trackedList) => {
        switch (trackedList.trackingStatus) {
            case "PENDING":
                return "secondary";
            case "RUNNING":
                return "primary";
            case "COMPLETE":
                return "success";
            case "ERROR":
                return "danger";
            default:
                throw Error("TrackedList.trackingStatus was not PENDING, RUNNING, COMPLETE or ERROR");
        }
    }

    getBlinkingStyleFromTrackedList = (trackedList) => {
        if (trackedList.trackingStatus === "RUNNING")
            return classes.blink;
    }

    getTCEfromTrackedList = (trackedList) => {
        return trackedList.totalJobCount + " / " + trackedList.completedJobCount + " / " + trackedList.errorJobCount
    }

}

export default ActiveRequests;
