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

import classes from './CompletedRequests.module.css'

class CompletedRequests extends Component {

    state = {
        loadingStatus: null,
        deleteConfirmationId: null,

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

        // Create Detail Section
        const detailSection = (
            <div className={classes.detailContainer}>
                <DetailBox boxValue={completedRequests.toString()} boxText={'Completed Requests'} />
                <div className={classes.detailLastItem}>
                    <DetailBox boxValue={foundRequests.toString()} boxText={'Found Requests'} />
                </div>
            </div>
        );

        // Create Table Section
        const tableHeadings = ['Name', 'Status', 'T / C / E', 'Result', ' '].map(tableHeading => {
            return <th className={classes.tableHeaderColumnText} key={tableHeading}>{tableHeading}</th>
        });
        const tableItems = this.state.completedRequests.map(completedRequest => {
            return (
                <tr key={completedRequest.id}>
                    <td className={classes.tableItem}><strong>{completedRequest.requestName}</strong></td>
                    <td className={classes.tableItem}>{completedRequest.status}</td>
                    <td className={classes.tableItem}>{completedRequest.totalJobCount} / {completedRequest.completedJobCount} / {completedRequest.errorJobCount}</td>
                    <td className={classes.tableItem}>{completedRequest.value === null ? 'Not Found' : <strong>{completedRequest.value}</strong>}</td>
                    <td className={classes.tableItem} style={{ color: "red", cursor: 'pointer' }}
                        onClick={() => this.promisedSetState({ deleteConfirmationId: completedRequest.id })} >
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

        // Delete Confirmation Modal
        let deleteConfirmationModal = this.buildModal();

        // Render
        return (
            <div>
                {deleteConfirmationModal}
                <SectionHeading heading={'Completed Requests'} />
                <div className={classes.content}>
                    {loadingBackground}
                    {loadingSpinner}
                    {detailSection}
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

    buildModal = () => {
        return (
            <Modal show={this.state.deleteConfirmationId !== null}
                onHide={() => this.promisedSetState({ deleteConfirmationId: null })}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>This action will permanently delete this <strong>Completed Request</strong>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => this.promisedSetState({ deleteConfirmationId: null })}>
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
            this.getSummary()
            this.getCompleteRequests()
            const timer = setInterval(() => {
                this.getSummary()
                this.getCompleteRequests()
            }, 15000);
            this.setState({ getCompletedRequestsTimer: timer })
        }
        finally {
            await this.promisedSetState({ loadingStatus: null })
        }
    }

    componentWillUnmount() {
        clearInterval(this.state.getCompletedRequestsTimer);
    }

    nextPage = async () => {
        if (this.state.currentPage + 1 <= this.state.totalPages) {
            try {
                await this.promisedSetState({ currentPage: this.state.currentPage + 1, loadingStatus: "PROGRESS" })
                this.getCompleteRequests();
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
                this.getCompleteRequests();
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

    getCompleteRequests = async () => {
        try {
            const response = await CompleteRequestService.getCompleteRequests(this.state.currentPage, this.state.pageSize)
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
        if (this.state.deleteConfirmationId !== null) {
            try {
                await this.promisedSetState({ loadingStatus: "PROGRESS" })
                await CompleteRequestService.deleteCompleteRequest(this.state.deleteConfirmationId)
                this.getSummary()
                this.getCompleteRequests()
            }
            catch (error) {
                NotificationService.showNotification(error.response.data.message, false)
            }
            finally {
                await this.promisedSetState({ loadingStatus: null, deleteConfirmationId: null })
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

}

export default CompletedRequests;