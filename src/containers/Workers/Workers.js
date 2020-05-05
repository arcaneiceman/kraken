import React, { Component } from 'react';
import DetailBox from '../../components/DetailBox/DetailBox';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import StatusBox from '../../components/StatusBox/StatusBox';
import SummaryTable from '../../components/SummaryTable/SummaryTable';
import Pagination from './../../components/Pagination/Pagination';
import Octicon, { Trashcan } from '@githubprimer/octicons-react';
import WorkerService from '../../services/WorkerService'
import NotificationService from '../../utils/NotificiationService';
import Spinner from 'react-bootstrap/Spinner'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import lsbridge from 'lsbridge'

import classes from './Workers.module.css'

class Workers extends Component {

    state = {
        loadingStatus: null,
        detailModalWorker: null,
        deleteConfirmationModalWorker: null,

        // Page Size
        pageSize: 4,

        getWorkerTimer: null,
        workers: new Array(5),
        currentPage: 1,
        totalPages: 1,

        //  Summary Section Fields
        totalWorkerCount: 0,
        onlineWorkerCount: 0,
        offlineWorkerCount: 0,
        jobsInQueueCount: 0
    }

    render() {
        // Create Summary Section
        const summarySection = (
            <div className={classes.detailContainer}>
                <DetailBox boxValue={this.state.totalWorkerCount.toString()} boxText={'Total Workers'} />
                <DetailBox boxValue={this.state.onlineWorkerCount.toString()} boxText={'Online Workers'} />
                <DetailBox boxValue={this.state.offlineWorkerCount.toString()} boxText={'Offline Workers'} />
                <div className={classes.lastDetailItem}>
                    <DetailBox boxValue={this.state.jobsInQueueCount.toString()} boxText={'Jobs In Queue'} />
                </div>
            </div>
        );

        // Create Table Section
        const tableHeadings = ['Name', 'Type', 'Status', 'Last Check In', ' '].map(tableHeading => {
            return <th className={classes.tableHeaderColumnText} key={tableHeading}>{tableHeading}</th>
        });
        const tableItems = this.state.workers.map(worker => {
            return (
                <tr key={worker.id} onClick={() => this.openDetailModal(worker)} className={classes.tableRowWithValue}>
                    <td className={classes.tableItem}><strong>{worker.name}</strong></td>
                    <td className={classes.tableItem}>{worker.type.toLowerCase()}</td>
                    <td className={classes.tableItem}><StatusBox status={worker.status} /></td>
                    <td className={classes.tableItem}>{new Date(worker.lastCheckIn).toLocaleString()}</td>
                    <td className={classes.tableItem} style={{ color: "red", cursor: 'pointer' }}
                        onClick={(event) => { event.stopPropagation(); this.openDeleteConfirmationModal(worker) }}>
                        <Octicon icon={Trashcan} fill='red' />
                    </td>
                </tr>
            );
        });
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
                <SectionHeading heading={'Your Workers'} />
                <div className={classes.main}>
                    {loadingBackground}
                    {loadingSpinner}
                    {summarySection}
                    <SummaryTable
                        tableHeadings={tableHeadings}
                        tableItems={tableItems} />
                    <Pagination
                        nextOnClick={this.nextPage}
                        prevOnClick={this.prevPage}
                        currentPage={this.state.currentPage}
                        totalPages={this.state.totalPages} />
                </div>
            </div>
        );
    }

    buildDetailModal = () => {
        if (this.state.detailModalWorker === null)
            return
        else
            return (
                <Modal size="lg" show={this.state.detailModalWorker !== null} onHide={() => this.closeDetailModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>Worker Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className={classes.detailModalDetailContainer}>
                            <div>
                                <h3 className={classes.detailModalHeading}>Name</h3>
                                <div><strong className={classes.detailModalValue}>{this.state.detailModalWorker.name}</strong></div>
                            </div>
                            <div >
                                <h3 className={classes.detailModalHeading}>Type</h3>
                                <div><strong className={classes.detailModalValue}>{this.state.detailModalWorker.type.toLowerCase()}</strong></div>
                            </div>
                            <div >
                                <h3 className={classes.detailModalHeading}>Status</h3>
                                <div><strong className={classes.detailModalValue}>{this.state.detailModalWorker.status}</strong></div>
                            </div>
                            <div >
                                <h3 className={classes.detailModalHeading}>Last Check In</h3>
                                <div><strong className={classes.detailModalValue}>{new Date(this.state.detailModalWorker.lastCheckIn).toLocaleString()}</strong></div>
                            </div>
                        </div>

                        <div className={classes.detailModalDetailContainer}>
                            <div >
                                <h3 className={classes.detailModalHeading}>Platform</h3>
                                <div><strong className={classes.detailModalValue}>{this.state.detailModalWorker.platform}</strong></div>
                            </div>
                        </div>

                        <div className={classes.detailModalDetailContainer}>
                            <div>
                                <h3 className={classes.detailModalHeading}>Total Jobs</h3>
                                <div><strong className={classes.detailModalValue}>{this.state.detailModalWorker.totalJobCount}</strong></div>
                            </div>
                            <div >
                                <h3 className={classes.detailModalHeading}>Completed Jobs</h3>
                                <div><strong className={classes.detailModalValue}>{this.state.detailModalWorker.completedJobCount}</strong></div>
                            </div>
                            <div >
                                <h3 className={classes.detailModalHeading}>Errors</h3>
                                <div><strong className={classes.detailModalValue}>{this.state.detailModalWorker.errorJobCount}</strong></div>
                            </div>
                        </div>

                    </Modal.Body>
                </Modal>
            )
    }

    buildDeletionConfirmationModal = () => {
        if (this.state.deleteConfirmationModalWorker === null)
            return
        else
            return (
                <Modal show={this.state.deleteConfirmationModalWorker !== null} onHide={() => this.closeDeleteConfirmationModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Do you want to stop and remove this worker: <strong>{this.state.deleteConfirmationModalWorker.name}</strong> ?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.closeDeleteConfirmationModal()}>
                            Close
                        </Button>
                        <Button variant="danger" onClick={() => this.deleteWorker()}>
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
            localStorage.removeItem('workers')
            localStorage.removeItem('workers-removeit')

            // Subscribe to eventbus
            lsbridge.subscribe('workers', () => {
                this.getSummary();
                this.getWorkers();
            });

            // Set Timer
            const timer = setInterval(() => { lsbridge.send('workers'); }, 15000);
            this.setState({ getWorkerTimer: timer })

            // Pull Fresh Data
            lsbridge.send('workers');
        }
        finally {
            await this.promisedSetState({ loadingStatus: null })
        }
    }

    componentWillUnmount() {
        clearInterval(this.state.getWorkerTimer);
        lsbridge.unsubscribe('workers');
    }

    openDetailModal = async (worker) => {
        this.promisedSetState({ detailModalWorker: worker })
    }

    closeDetailModal = async () => {
        this.promisedSetState({ detailModalWorker: null })
    }

    openDeleteConfirmationModal = async (worker) => {
        this.promisedSetState({ deleteConfirmationModalWorker: worker })
    }

    closeDeleteConfirmationModal = async () => {
        this.promisedSetState({ deleteConfirmationModalWorker: null })
    }

    nextPage = async () => {
        if (this.state.currentPage + 1 <= this.state.totalPages) {
            try {
                await this.promisedSetState({ currentPage: this.state.currentPage + 1, loadingStatus: "PROGRESS" })
                this.getWorkers()
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
                this.getWorkers()
            }
            finally {
                await this.promisedSetState({ loadingStatus: null })
            }
        }
    }

    getSummary = async () => {
        try {
            const response = await WorkerService.getSummary()
            await this.promisedSetState({
                totalWorkerCount: response.data.totalActiveWorkers,
                onlineWorkerCount: response.data.totalOnlineWorkers,
                offlineWorkerCount: response.data.totalOfflineWorkers,
                jobsInQueueCount: response.data.jobsInQueue
            })
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    getWorkers = async () => {
        try {
            const response = await WorkerService.getWorkers(this.state.currentPage, this.state.pageSize)
            await this.promisedSetState({
                workers: response.data.content,
                totalPages: response.data.totalPages === 0 ? 1 : response.data.totalPages,
            })
        }
        catch (error) {
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    deleteWorker = async () => {
        if (this.state.deleteConfirmationModalWorker !== null) {
            try {
                await this.promisedSetState({ loadingStatus: "PROGRESS" })
                await WorkerService.deleteWorker(this.state.deleteConfirmationModalWorker.id)
                lsbridge.send('workers');
            }
            catch (error) {
                NotificationService.showNotification(error.response.data.message, false)
            }
            finally {
                await this.promisedSetState({ loadingStatus: null, deleteConfirmationModalWorker: null })
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

export default Workers;