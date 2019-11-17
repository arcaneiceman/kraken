import React, { Component } from 'react';
import Pagination from './../../components/Pagination/Pagination';
import SectionHeading from './../../components/SectionHeading/SectionHeading';
import DetailBox from './../../components/DetailBox/DetailBox';
import SummaryTable from './../../components/SummaryTable/SummaryTable';
import Octicon, { Trashcan } from '@githubprimer/octicons-react';
import CompleteRequestService from '../../services/CompleteRequestService';
import NotificationService from '../../utils/NotificiationService';

import classes from './CompletedRequests.module.css'

class CompletedRequests extends Component {

    state = {
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
                        onClick={() => this.deleteCompletedRequest(completedRequest.id)} >
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

        // Render
        return (
            <div>
                <SectionHeading heading={'Completed Requests'} />
                <div className={classes.content}>
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

    componentDidMount() {
        this.getSummary()
        this.getCompleteRequests()
        const timer = setInterval(() => {
            this.getSummary()
            this.getCompleteRequests()
        }, 15000);
        this.setState({ getCompletedRequestsTimer: timer })
    }

    componentWillUnmount() {
        clearInterval(this.state.getCompletedRequestsTimer);
    }

    nextPage = async () => {
        const currentPage = this.state.currentPage;
        const totalPages = this.state.totalPages;
        if (currentPage + 1 <= totalPages) {
            await this.promisedSetState({currentPage: currentPage + 1})
            this.getCompleteRequests();
        }
    }

    prevPage = async () => {
        const currentPage = this.state.currentPage;
        if (currentPage - 1 >= 1) {
            await this.promisedSetState({currentPage: currentPage - 1})
            this.getCompleteRequests();
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

    deleteCompletedRequest = async (completeRequestId) => {
        try {
            await CompleteRequestService.deleteCompleteRequest(completeRequestId)
            this.getSummary()
            this.getCompleteRequests()
        }
        catch (error) {
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

export default CompletedRequests;