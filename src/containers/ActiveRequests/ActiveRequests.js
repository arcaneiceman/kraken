import React, { Component } from 'react';
import Pagination from './../../components/Pagination/Pagination';
import SectionHeading from './../../components/SectionHeading/SectionHeading';
import DetailBox from './../../components/DetailBox/DetailBox';
import SummaryTable from './../../components/SummaryTable/SummaryTable';
import ProgressBar from 'react-bootstrap/ProgressBar';
import ActiveRequestService from '../../services/ActiveRequestService';
import NotificationService from '../../utils/NotificiationService';
import Octicon, { Trashcan } from '@githubprimer/octicons-react';

import classes from './ActiveRequests.module.css'

class ActiveRequests extends Component {

    state = {
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
            <div className={classes.detailContainer} >
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
                    <div className={classes.boxText}>Progress</div>
                </div>
            </div>
        );

        // Create Table Section
        const tableHeadings = ['Name', 'Type', 'Total Jobs', 'Completed Jobs', 'Errors', ' '].map(tableHeading => {
            return <th className={classes.tableHeaderColumnText} key={tableHeading}>{tableHeading}</th>
        });
        const tableItems = this.state.activeRequests.map(activeRequest => {
            return (
                <tr key={activeRequest.id}>
                    <td className={classes.tableItem}><strong>{activeRequest.requestName}</strong></td>
                    <td className={classes.tableItem}>{activeRequest.requestType}</td>
                    <td className={classes.tableItem}>{activeRequest.totalJobCount}</td>
                    <td className={classes.tableItem}>{activeRequest.completedJobCount}</td>
                    <td className={classes.tableItem}>{activeRequest.errorJobCount}</td>
                    <td className={classes.tableItem} style={{ color: "red", cursor: 'pointer' }}
                        onClick={() => this.deleteActiveRequest(activeRequest.id)}>
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
                <td className={classes.tableItem}>&nbsp;</td>
            </tr>)
        }

        // Render
        return (
            <div>
                <SectionHeading heading={'Your Active Requests'} />
                <div className={classes.main}>
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

    componentDidMount() {
        this.getActiveRequests()
        this.getSummary()
        const timer = setInterval(() => { 
            this.getActiveRequests()
            this.getSummary()
        }, 15000);
        this.setState({ getActiveRequestTimer: timer })
    }

    componentWillUnmount() {
        clearInterval(this.state.getActiveRequestTimer);
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.needsToRefresh) {
            this.getActiveRequests()
            this.getSummary()
            props.refreshCompleteCallback();
        }
    }

    nextPage = async () => {
        const currentPage = this.state.currentPage;
        const totalPages = this.state.totalPages;
        if (currentPage + 1 <= totalPages) {
            await this.promisedSetState({ currentPage: currentPage + 1 })
            this.getActiveRequests()
        }
    }

    prevPage = async () => {
        const currentPage = this.state.currentPage;
        if (currentPage - 1 >= 1) {
            await this.promisedSetState({ currentPage: currentPage - 1 })
            this.getActiveRequests()
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

    getActiveRequests = async () => {
        try{
            const response = await ActiveRequestService.getActiveRequests(this.state.currentPage, this.state.pageSize)
            await this.promisedSetState({
                activeRequests: response.data.content,
                totalPages: response.data.totalPages === 0 ? 1 : response.data.totalPages,
            })
        }
        catch(error){
            NotificationService.showNotification(error.response.data.message, false)
        }
    }

    deleteActiveRequest = async(activeRequestId) => {
        try{
            await ActiveRequestService.deleteActiveRequest(activeRequestId);
            this.getSummary()
            this.getActiveRequests()
        }
        catch(error){
            NotificationService.showNotification(error.response.data.message, false)
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

export default ActiveRequests;