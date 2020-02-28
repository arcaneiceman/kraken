import React, { Component } from 'react';
import Pagination from './../../components/Pagination/Pagination';
import SectionHeading from './../../components/SectionHeading/SectionHeading';
import DetailBox from './../../components/DetailBox/DetailBox';
import SummaryTable from './../../components/SummaryTable/SummaryTable';
import Octicon, { Trashcan } from '@githubprimer/octicons-react';
import Button from 'react-bootstrap/Button'
import CompleteRequestService from '../../services/CompleteRequestService';
import NotificationService from '../../utils/NotificiationService';
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import lsbridge from 'lsbridge'
import Table from 'react-bootstrap/Table';

import classes from './CompletedRequests.module.css'

class CompletedRequests extends Component {

    state = {
        loadingStatus: null,
        detailModalCompletedRequest: null,
        deleteConfirmationModalCompletedRequest: null,

        // Page Size
        pageSize: 4,

        getCompletedRequestsTimer: null,
        completedRequests: [],
        currentPage: 1,
        totalPages: 1,

        // Special Fields
        totalItems: 0,
        requestsFound: 0,
    }

    render() {
        const currentPage = this.state.currentPage;
        const totalPages = this.state.totalPages;
        const completedRequests = this.state.totalItems;
        const foundRequests = this.state.requestsFound;

        // Create Summary Section
        const summarySection = (
            <div className={classes.summarySectionContainer}>
                <DetailBox boxValue={completedRequests.toString()} boxText={'Completed Requests'} />
                <div className={classes.summaryLastItem}>
                    <DetailBox boxValue={foundRequests.toString()} boxText={'Found'} />
                </div>
            </div>
        );

        // Create Table Section
        const tableHeadings = ['Name', 'Status', 'T / C / E', 'Result', ' '].map(tableHeading => {
            return <th className={classes.tableHeaderColumnText} key={tableHeading}>{tableHeading}</th>
        });
        const tableItems = this.state.completedRequests.map(completedRequest => {
            return (
                <tr key={completedRequest.id} onClick={() => this.openDetailModal(completedRequest)}>
                    <td className={classes.tableItem}><strong>{completedRequest.requestName}</strong></td>
                    <td className={classes.tableItem}>{completedRequest.status}</td>
                    <td className={classes.tableItem}>{completedRequest.totalJobCount} / {completedRequest.completedJobCount} / {completedRequest.errorJobCount}</td>
                    <td className={classes.tableItem}>{completedRequest.result}</td>
                    <td className={classes.tableItem} style={{ color: "red", cursor: 'pointer' }}
                        onClick={(event) => { event.stopPropagation(); this.openDeleteConfirmationModal(completedRequest) }}>
                        <Octicon icon={Trashcan} />
                    </td>
                </tr>
            );
        })
        for (let i = tableItems.length; i < this.state.pageSize; i++) {
            tableItems.push(<tr key={i} >
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
                <SectionHeading heading={'Completed Requests'} />
                <div className={classes.mainContainer}>
                    {loadingBackground}
                    {loadingSpinner}
                    {summarySection}
                    <SummaryTable
                        tableHeadings={tableHeadings}
                        tableItems={tableItems} />
                    <Pagination
                        nextOnClick={this.nextPage}
                        prevOnClick={this.prevPage}
                        currentPage={currentPage}
                        totalPages={totalPages} />
                </div>
            </div>
        );
    }

    buildDetailModal = () => {
        if (this.state.detailModalCompletedRequest === null)
            return
        else
            return (
                <Modal size="lg" show={this.state.detailModalCompletedRequest !== null} onHide={() => this.closeDetailModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>Complete Request Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className={classes.detailModalContainer}>
                            <div className={classes.detailModalDetailContainer}>
                                <div>
                                    <h3 className={classes.detailModalHeading}>Name</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalCompletedRequest.requestName}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Type</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalCompletedRequest.requestType}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Total Jobs</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalCompletedRequest.totalJobCount}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Completed Jobs</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalCompletedRequest.completedJobCount}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.detailModalHeading}>Errors</h3>
                                    <div><strong className={classes.detailModalValue}>{this.state.detailModalCompletedRequest.errorJobCount}</strong></div>
                                </div>
                            </div>
                            <div className={classes.detailModalRequestMetadataContainer} >
                                <h3 className={classes.detailModalHeading}>Metadata</h3>
                                <Table className={classes.detailModalRequestMetadataTable} style={{ marginBottom: '0rem' }} borderless size="sm">
                                    <tbody>
                                        {Object.keys(this.state.detailModalCompletedRequest.requestMetadata).map(key => {
                                            return (
                                                <tr key={key}>
                                                    <td style={{ width: '25%' }} className={classes.tableItem}><strong>{key}</strong></td>
                                                    <td className={classes.tableItem}>{this.state.detailModalCompletedRequest.requestMetadata[key]}</td>
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
                                    {this.state.detailModalCompletedRequest.trackedLists.map(trackedList => {
                                        let variant = this.getVariantFromTrackedList(trackedList)
                                        let tce = this.getTCEfromTrackedList(trackedList)
                                        return (
                                            <Button variant={variant} className={classes.detailModalTrackedListPill}
                                                key={trackedList.listName}>{trackedList.listName} <br /> (T / C / E): {tce}</Button>
                                        );
                                    })}</div>
                            </div>
                            <div className={classes.detailModalRequestMetadataContainer} >
                                <h3 className={classes.detailModalHeading}>Results</h3>
                                <Table className={classes.detailModalRequestMetadataTable} style={{ marginBottom: '0rem' }} borderless size="sm">
                                    <tbody>
                                        {Object.keys(this.state.detailModalCompletedRequest.results).map(key => {
                                            return (
                                                <tr key={key}>
                                                    <td style={{ width: '25%' }} className={classes.tableItem}><strong>{key}</strong></td>
                                                    <td className={classes.tableItem}>{this.state.detailModalCompletedRequest.results[key]}</td>
                                                </tr>);
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            );
    }

    buildDeletionConfirmationModal = () => {
        if (this.state.deleteConfirmationModalCompletedRequest === null)
            return
        else
            return (
                <Modal show={this.state.deleteConfirmationModalCompletedRequest !== null} onHide={() => this.closeDeleteConfirmationModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Do you want to delete this Completed Request: <strong>{this.state.deleteConfirmationModalCompletedRequest.requestName}</strong>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.closeDeleteConfirmationModal()}>
                            Close
                        </Button>
                        <Button variant="danger" onClick={() => this.deleteCompletedRequest()}>
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
            localStorage.removeItem('complete-requests')
            localStorage.removeItem('complete-requests-removeit')

            // Subscribe to eventbus
            lsbridge.subscribe('complete-requests', () => {
                this.getSummary()
                this.listCompleteRequests()
            });

            // Set Timer
            const timer = setInterval(() => { lsbridge.send('complete-requests'); }, 15000);
            this.setState({ getCompletedRequestsTimer: timer })

            // Pull Fresh Data
            lsbridge.send('complete-requests');
        }
        finally {
            await this.promisedSetState({ loadingStatus: null })
        }
    }

    componentWillUnmount() {
        clearInterval(this.state.getCompletedRequestsTimer);
        lsbridge.unsubscribe('complete-requests');
    }

    openDetailModal = async (completedRequest) => {
        this.promisedSetState({ detailModalCompletedRequest: completedRequest })
    }

    closeDetailModal = async () => {
        this.promisedSetState({ detailModalCompletedRequest: null })
    }

    openDeleteConfirmationModal = async (completedRequest) => {
        this.promisedSetState({ deleteConfirmationModalCompletedRequest: completedRequest })
    }

    closeDeleteConfirmationModal = async () => {
        this.promisedSetState({ deleteConfirmationModalCompletedRequest: null })
    }

    nextPage = async () => {
        if (this.state.currentPage + 1 <= this.state.totalPages) {
            try {
                await this.promisedSetState({ currentPage: this.state.currentPage + 1, loadingStatus: "PROGRESS" })
                this.listCompleteRequests();
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
                this.listCompleteRequests();
            }
            finally {
                await this.promisedSetState({ loadingStatus: null })
            }
        }
    }

    getSummary = async () => {
        try {
            const response = await CompleteRequestService.getSummary()
            await this.promisedSetState({
                totalItems: response.data.totalCompleteRequests,
                requestsFound: response.data.totalFoundRequests
            })
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    listCompleteRequests = async () => {
        try {
            const response = await CompleteRequestService.listCompleteRequests(this.state.currentPage, this.state.pageSize)
            await this.promisedSetState({
                completedRequests: response.data.content,
                totalPages: response.data.totalPages === 0 ? 1 : response.data.totalPages,
            })
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    deleteCompletedRequest = async () => {
        if (this.state.deleteConfirmationModalCompletedRequest !== null) {
            try {
                await this.promisedSetState({ loadingStatus: "PROGRESS" })
                await CompleteRequestService.deleteCompleteRequest(this.state.deleteConfirmationModalCompletedRequest.id)
                lsbridge.send('complete-requests');
            }
            catch (error) {
                NotificationService.showNotification(error.response.data.message, false)
            }
            finally {
                await this.promisedSetState({ loadingStatus: null, deleteConfirmationModalCompletedRequest: null })
            }
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

    getTCEfromTrackedList = (trackedList) => {
        return trackedList.totalJobCount + " / " + trackedList.completedJobCount + " / " + trackedList.errorJobCount
    }

}

export default CompletedRequests;