import React, { Component } from 'react';
import ActiveRequestService from '../../services/ActiveRequestService';
import AuthenticationService from '../../services/AuthenticationService';
import WorkerService from '../../services/WorkerService'
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner'
import DetailBox from '../../components/DetailBox/DetailBox';
import Octicon, { Rocket, Alert, Gear } from '@githubprimer/octicons-react';
import isElectron from 'is-electron';
import NotificationService from '../../utils/NotificiationService';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import JobCrackerLocal from './jobcracker.local';
import Modal from 'react-bootstrap/Modal'
import Slider from 'rc-slider';
import SummaryTable from './../../components/SummaryTable/SummaryTable';
import ExitHandlerService from '../../utils/ExitHandlerService';
import lsbridge from 'lsbridge'
import { Prompt } from "react-router-dom";

import classes from './KrakenWorker.module.css'
import 'rc-slider/assets/index.css';

// Web Workers 
// eslint-disable-next-line import/no-webpack-loader-syntax
import JobFetcher from 'worker-loader!./jobfetcher';
// eslint-disable-next-line import/no-webpack-loader-syntax
import JobCrackerBrowser from 'worker-loader!./jobcracker.browser';
// eslint-disable-next-line import/no-webpack-loader-syntax
import JobReporter from 'worker-loader!./jobreporter'

class KrakenWorker extends Component {

    state = {
        /* State Variables */
        workerActive: "INACTIVE",
        workerSettingsModalVisible: false,
        workerGettingJob: false,
        workerCracking: false,
        workerReportingJob: false,

        /* Browser Worker Variables */
        workerActiveCoreCount: 0,

        /* Local Worker Variables */
        workerDependencyModalVisible: false,
        workerDependencyModalErrorMessage: null,
        workerPlatform: null,
        workerDevices: [],

        /* Worker Variables */
        workerId: null,
        workerName: null,
        workerLastHeartbeat: null,
        workerHeartbeatTimer: null,
        workerSparkplugTimer: null,
        workerActivationTimer: null,
        workerJobQueue: [],
        workerRecommendedMultiplier: null,
        executionStartTime: null,

        /* Workers */
        crackerPool: [],
        jobFetcher: null,
        jobReporter: null,

        /* Stats */
        secondsSinceActivation: 0,
        completeJobs: 0,
        errorJobs: 0
    }

    render() {
        // Unmet dependecy modal
        let unmetDependencyModal = this.buildUnmetDependencyModal();
        // Settings Modal
        let settingsModal = this.buildSettingsModal();
        // Transtion Blocking Prompt
        let transitionBlockingPrompt = this.buildTransitionBlockingPrompt();

        switch (this.state.workerActive) {
            case "INACTIVE":
                return (
                    <div>
                        {transitionBlockingPrompt}
                        {unmetDependencyModal}
                        {settingsModal}
                        <SectionHeading heading={'Add a Worker'} />
                        <div className={classes.main_inactive}>
                            <h3 className={classes.startText}> Start Worker Here</h3>
                            <Button className={classes.startButton} onClick={this.activateWorker}> <Octicon icon={Rocket} /> <br /> Launch Worker</Button>
                            <Button className={classes.settingsButton} onClick={async () => { await this.promisedSetState({ workerSettingsModalVisible: true }) }} variant="light">
                                <Octicon icon={Gear} /> <br /> Worker Settings
                            </Button>
                            {isElectron() ?
                            <span><strong>Note: </strong> You can adjust devices hashcat uses through worker settings. 
                            Learn more in the <a href="https://kraken.work/help#how-to_faq" target="_blank" rel="noopener noreferrer">FAQ</a> section. </span> :
                                <span><strong>Note: </strong> You can adjust the number of cores through worker settings.
                            Learn more in the <a href="https://kraken.work/help#how-to_faq" target="_blank" rel="noopener noreferrer">FAQ</a> section. </span>}

                            {isElectron() && this.state.workerDevices.length === 0 ? <span><Octicon icon={Alert} /> No CPU/GPU/FPGA(s) detected</span> : null}
                        </div>
                    </div>
                );
            case "INITIALIZING":
                return (
                    <div>
                        {transitionBlockingPrompt}
                        {unmetDependencyModal}
                        {settingsModal}
                        <SectionHeading heading={'Add a Worker'} />
                        <div className={classes.main_inactive}>
                            <h3 className={classes.startText}> Start Worker Here</h3>
                            <Button className={classes.startButton}>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            </Button>
                            <Button className={classes.settingsButton} onClick={async () => { await this.promisedSetState({ workerSettingsModalVisible: true }) }} variant="light">
                                <Octicon icon={Gear} /> <br /> Worker Settings
                            </Button>
                        </div>
                    </div>
                );
            case "ERROR":
                return (
                    <div>
                        {transitionBlockingPrompt}
                        {unmetDependencyModal}
                        {settingsModal}
                        <SectionHeading heading={'Add a Worker'} />
                        <div className={classes.main_inactive}>
                            <h3 className={classes.startText}> Start Worker Here</h3>
                            <Button className={classes.startButton} variant="danger" onClick={this.activateWorker}> Error! Click to try again</Button>
                            <Button className={classes.settingsButton} onClick={async () => { await this.promisedSetState({ workerSettingsModalVisible: true }) }} variant="light">
                                <Octicon icon={Gear} /> <br /> Worker Settings
                            </Button>
                        </div>
                    </div>
                );
            case "ACTIVE":
                const inProgressJobCount = this.state.workerJobQueue.reduce((sum, job) => { return sum + job.multiplier }, 0)
                return (
                    <div>
                        {transitionBlockingPrompt}
                        {unmetDependencyModal}
                        {settingsModal}
                        <SectionHeading heading={'Worker'} />
                        <div className={classes.main_active}>
                            <div>
                                <div className={classes.content}>
                                    <DetailBox boxValue={inProgressJobCount.toString()} boxText={'In Progress'} />
                                    <DetailBox boxValue={this.state.errorJobs.toString()} boxText={'Errors'} />
                                    <div className={classes.lastDetailItem}>
                                        <DetailBox boxValue={this.state.completeJobs.toString()} boxText={'Completed Jobs'} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className={classes.heading}>Name</h3>
                                    <div><strong style={{ margin: '10px' }}>{this.state.workerName}</strong></div>
                                </div>
                                <div >
                                    <h3 className={classes.heading}>Uptime</h3>
                                    <div><strong style={{ margin: '10px' }}>{this.toHHMMSS(this.state.secondsSinceActivation)}</strong></div>
                                </div>
                            </div>
                            <div className={classes.buttonContainer}>
                                <Button className={classes.settingsButton} onClick={async () => { await this.promisedSetState({ workerSettingsModalVisible: true }) }} variant="light">
                                    <Octicon icon={Gear} />
                                </Button>
                                <Button className={classes.stopButton} variant="danger" onClick={this.deactivateWorker}>Stop</Button>
                            </div>
                        </div>
                    </div >
                );
            default:
                return (<div>Error</div>)
        }
    }

    buildUnmetDependencyModal = () => {
        // Body
        let body;
        switch (this.state.workerPlatform) {
            case "win32":
                body =
                    <div>
                        <strong>Hashcat</strong> was not found on your Windows. To install it on windows:
                        <ul>
                            <li>Download the 7zip <a href="https://hashcat.net/files/hashcat-5.1.0.7z" target="_blank" rel="noopener noreferrer">here</a> or
                             from Hashcat home page (https://hashcat.net/hashcat/)
                            </li>
                            <li>Unzip the contents of hashcat-5.X.X in the same folder as kraken-client v1.X.X.exe</li>
                            <li>Click the "Test" Button to try again</li>
                        </ul>
                    </div>
                break;
            case "darwin":
                body =
                    <div>
                        <strong>Hashcat</strong> was not found on your Mac. To install it, open a terminal and execute the following:
                            <SyntaxHighlighter language="bash" style={github}>ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"</SyntaxHighlighter>
                        <SyntaxHighlighter language="bash" style={github}>brew install hashcat</SyntaxHighlighter>
                    </div>
                break;
            case "linux":
                body =
                    <div>
                        <strong>Hashcat</strong> was not found on your Linux. To install it, open a terminal and execute the following:
                            <SyntaxHighlighter language="bash" style={github}>sudo apt-get install hashcat</SyntaxHighlighter>
                    </div>
                break;
            default:
                body =
                    <div>
                        <span><Octicon icon={Alert} /> Platform not recognized</span>
                    </div>
                break;
        }

        // Error Message
        let errorMessage = null;
        if (this.state.workerDependencyModalErrorMessage !== null) {
            errorMessage = <div className={classes.errorMessage}> <Octicon icon={Alert} /> <strong>{this.state.workerDependencyModalErrorMessage}</strong></div>
        }

        // Try Again Button
        const tryAgainButton = <Button variant="warning" onClick={async () => { await this.testDependency(); }}>Test</Button>
        return (
            <Modal size='lg' show={this.state.workerDependencyModalVisible} backdrop='static' keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Dependecy Error</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {body}
                </Modal.Body>
                <Modal.Footer>
                    {errorMessage}
                    {tryAgainButton}
                </Modal.Footer>
            </Modal>
        );
    }

    buildSettingsModal = () => {
        let body;
        if (isElectron()) {
            if (this.state.workerDevices.length !== 0) {
                const tableHeadings = ['ID', 'Type', 'Name', 'Enabled'].map(tableHeading => {
                    return <th className={classes.tableHeaderColumnText} key={tableHeading}>{tableHeading}</th>
                });
                const tableItems = this.state.workerDevices.map(device => {
                    return (
                        <tr key={device.id}>
                            <td className={classes.tableItem}><strong>{device.id}</strong></td>
                            <td className={classes.tableItem}>{device.type}</td>
                            <td className={classes.tableItem}>{device.name}</td>
                            <td className={classes.tableItem} style={{ color: "red", cursor: 'pointer' }}>
                                <input type="checkbox" checked={device.enabled}
                                    onChange={() => {
                                        let devicesClone = this.state.workerDevices.slice()
                                        const deviceToChange = devicesClone.find(workerDevice => device.id === workerDevice.id);
                                        deviceToChange.enabled = !deviceToChange.enabled
                                        this.promisedSetState({ devices: devicesClone })
                                    }}
                                />
                            </td>
                        </tr>
                    );
                })
                body =
                    <div className={classes.tableContainer}>
                        <SummaryTable
                            tableHeadings={tableHeadings}
                            tableItems={tableItems} />
                    </div>
            }
            else {
                body = <div className={classes.tableContainer}><Octicon icon={Alert} />No Devices Detected!</div>
            }
        }
        else {
            body =
                <div className={classes.activeCoreSliderContainer}>
                    <p>Active Cores</p>
                    <Slider min={1} max={window.navigator.hardwareConcurrency} defaultValue={this.state.workerActiveCoreCount}
                        marks={{ 1: 1, [window.navigator.hardwareConcurrency]: window.navigator.hardwareConcurrency, [this.state.workerActiveCoreCount]: this.state.workerActiveCoreCount }}
                        onChange={(value) => { this.changeActiveCoreCount(value) }} />
                </div>
        }
        return (
            <Modal show={this.state.workerSettingsModalVisible}
                onHide={async () => await this.promisedSetState({ workerSettingsModalVisible: false })}>
                <Modal.Header>
                    <Modal.Title>Worker Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {body}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={async () => await this.promisedSetState({ workerSettingsModalVisible: false })}>Close</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    buildTransitionBlockingPrompt = () => {
        return (
            <Prompt when={this.state.workerActive === "ACTIVE"}
                message={'The worker is still running. Do you still want to navigate away?'} />
        )
    }

    componentDidMount = async () => {
        if (isElectron()) { // Local Worker
            await this.testDependency()
        }
        else // Browser Worker
            if (localStorage.getItem('currentActiveCoreCount') !== null)
                await this.promisedSetState({ workerActiveCoreCount: Number(localStorage.getItem('currentActiveCoreCount')) })
            else
                await this.promisedSetState({ workerActiveCoreCount: window.navigator.hardwareConcurrency === 1 ? 1 : (window.navigator.hardwareConcurrency - 1) })

    }

    componentWillUnmount() {
        if (this.state.workerActive === "ACTIVE")
            this.deactivateWorker()
    }

    changeActiveCoreCount = async (value) => {
        await this.promisedSetState({ workerActiveCoreCount: value })
        localStorage.setItem('currentActiveCoreCount', value)
        if (this.state.workerActive === "ACTIVE") {
            await this.deactivateWorker()
            await this.activateWorker()
        }
    }

    activateWorker = async () => {
        console.debug("Activating Worker")

        // Create Worker(s) Pool
        let crackerPoolClone = [];
        if (isElectron()) // Electron (Desktop Client)
            crackerPoolClone.push(JobCrackerLocal(this.uuidv4(), this.retrieveJobFromCrackers))
        else // Browser
            for (let i = 0; i < this.state.workerActiveCoreCount; i++) {
                let cracker = new JobCrackerBrowser()
                cracker.addEventListener("message", this.retrieveJobFromCrackers, true);
                crackerPoolClone.push(cracker)
            }

        // Create Worker
        await this.promisedSetState({ workerActive: "INITIALIZING" })
        let data = {}
        try {
            // Use Previously Created Worker
            let response = await WorkerService.getWorker(this.state.workerId)
            data = response.data
        }
        catch (error) {
            // Create New Worker
            try {
                await this.promisedSetState({
                    workerRecommendedMultiplier: 1, // Default Mutliplier is 1
                    secondsSinceActivation: 0,
                    completeJobs: 0,
                    errorJobs: 0
                })
                let response = await WorkerService.createWorker(this.getRandomName(), this.getWorkerType())
                data = response.data
            }
            catch (error) {
                await this.promisedSetState({ workerActive: "ERROR" })
                console.error("Create Worker error " + error.response.data.message)
                return
            }
        }

        // Refresh Worker List
        lsbridge.send('workers');

        // Set Window Unload Listner
        window.addEventListener("beforeunload", ExitHandlerService.handleExit)

        // Create Intervals
        const heartbeatTimer = setInterval(() => { this.sendHeartbeat() }, 15000);
        const sparkPlugTimer = setInterval(() => { this.cycle("Interval", true); }, 30000);
        const activationTimer = setInterval(() => { this.setState({ secondsSinceActivation: this.state.secondsSinceActivation + 1 }) }, 1000);

        // Save
        await this.promisedSetState({
            workerActive: "ACTIVE",
            workerId: data.id,
            workerName: data.name,
            workerHeartbeatTimer: heartbeatTimer,
            workerSparkplugTimer: sparkPlugTimer,
            workerActivationTimer: activationTimer,
            crackerPool: crackerPoolClone,
            jobFetcher: new JobFetcher(),
            jobReporter: new JobReporter(),
        });

        // Set Job Fetcher and Reporter Call backs
        this.state.jobFetcher.addEventListener("message", this.retrieveFromJobFetcher, true);
        this.state.jobReporter.addEventListener("message", this.retrieveFromJobReporter, true);

        this.cycle("Activate Worker", true)
    }

    deactivateWorker = async () => {
        console.debug("Deactivating Worker")

        // Stop All Workers
        this.state.crackerPool.forEach((element) => element.terminate())
        this.state.jobFetcher.terminate()
        this.state.jobReporter.terminate()

        // Clear Window Listner 
        window.removeEventListener("beforeunload", ExitHandlerService.handleExit)

        // Clear Internvals
        clearInterval(this.state.workerHeartbeatTimer);
        clearInterval(this.state.workerSparkplugTimer);
        clearInterval(this.state.workerActivationTimer);

        // Set State to deactivate worker
        await this.promisedSetState({
            workerActive: "INACTIVE",
            workerGettingJob: false,
            workerCracking: false,
            workerReportingJob: false,

            workerLastHeartbeat: null,
            workerHeartbeatTimer: null,
            workerSparkplugTimer: null,
            workerActivationTimer: null,
            executionStartTime: null,
            workerJobQueue: [],

            crackerPool: [],
            jobFetcher: null,
            jobReporter: null,
        })
    }



    testDependency = async () => {
        let tempWorker = JobCrackerLocal(this.uuidv4(), this.retrieveJobFromCrackers)
        await this.promisedSetState({
            workerDependencyModalVisible: false,
            workerDependencyModalErrorMessage: null,
            workerPlatform: null,
            workerDevices: []
        })
        let listDevicesResponse = await tempWorker.listDevices()
        if (listDevicesResponse.includes('hashcat') && listDevicesResponse.includes('starting')) {
            listDevicesResponse = listDevicesResponse.split('\n')
            let devices = []
            for (let i = 0; i < listDevicesResponse.length; i++) {
                if (listDevicesResponse[i].includes('Device ID #')) {
                    devices.push({
                        'id': listDevicesResponse[i].trim().replace('Device ID #', ''),
                        'type': listDevicesResponse[i + 1].trim().replace('Type           : ', ''),
                        'name': listDevicesResponse[i + 4].trim().replace('Name           : ', ''),
                        'enabled': listDevicesResponse[i + 1].trim().replace('Type           : ', '') !== 'CPU' ? true : false
                    })
                }
            }
            if (devices.length === 1) // If just one device, enable it,
                devices[0].enabled = true
            await this.promisedSetState({
                workerDependencyModalVisible: false,
                workerDependencyModalErrorMessage: null,
                workerPlatform: tempWorker.getPlatform(),
                workerDevices: devices
            })
        }
        else if (listDevicesResponse.includes('No Devices')) {
            NotificationService.showNotification('No CPU/GPU/FGPA found', false)
            await this.promisedSetState({
                workerDependencyModalVisible: false,
                workerDependencyModalErrorMessage: null,
                workerPlatform: tempWorker.getPlatform(),
                workerDevices: []
            })
        }
        else {
            await this.promisedSetState({
                workerDependencyModalVisible: true,
                workerDependencyModalErrorMessage: listDevicesResponse,
                workerPlatform: tempWorker.getPlatform(),
                workerDevices: []
            })
        }
    }

    /*
        Cycle function
        This function runs:
            - Producer (getting job from server)
            - Consumer (cracking job)
            - Reporter (sending job to server)
    */
    cycle = async (from, success) => {
        console.debug("Cycle > " + from + " with success: " + success)
        if (!success)
            return;

        if (this.state.workerActive !== 'ACTIVE')
            return;

        // If PENDING jobs not present AND not already getting...
        if (this.state.workerJobQueue.filter((job) => job.trackingStatus === "PENDING").length < 1 && !this.state.workerGettingJob)
            this.postToJobFetcher()

        // If PENDING jobs present AND not already cracking...
        if (this.state.workerJobQueue.filter((job) => job.trackingStatus === "PENDING").length > 0 && !this.state.workerCracking)
            this.postToCrackers();

        // If COMPLETE job is available and not already sending...
        if (this.state.workerJobQueue.filter((job) => job.trackingStatus === "COMPLETE" || job.trackingStatus === "ERROR").length > 0 && !this.state.workerReportingJob)
            this.postToJobReporter();
    }

    postToJobFetcher = async () => {
        console.debug("Posting request to job fetcher")

        // Set State to Fetching
        await this.promisedSetState({ workerGettingJob: true })

        // Set Params
        const params = {
            path: ActiveRequestService.getJobPath(),
            token: AuthenticationService.getToken(),
            workerId: this.state.workerId,
            multiplier: Math.max(Math.min(this.state.workerRecommendedMultiplier, 250), 1), // 250 is the max the server can surive right now
            activeCoreCount: this.state.workerActiveCoreCount
        }
        console.debug("Getting Job with multiplier " + params.multiplier)

        // Send Request To Fetcher
        this.state.jobFetcher.postMessage(params)
    }

    retrieveFromJobFetcher = async (message) => {
        let success = false;
        let jobQueueClone = this.state.workerJobQueue.slice()
        console.debug("Retreiving response from job fetcher")
        if (message.data.status === "SUCCESS") {
            // Declare Job
            const job = {
                requestType: message.data.requestType,
                valueToMatchInBase64: message.data.valueToMatchInBase64,
                requestId: message.data.requestId,
                listId: message.data.listId,
                jobId: message.data.jobId,
                multiplier: message.data.multiplier,
                candidateValues: message.data.candidateValues,
                trackingStatus: "PENDING",
                result: null,
                runningChunkCount: 0,
                completeChunkCount: 0,
                executionStartTime: null
            }

            // Add Job -> Pending Queue
            jobQueueClone.push(job)

            // Success = true
            success = true
        }
        else {
            console.error("Get Job Failed")
        }

        await this.promisedSetState({
            workerJobQueue: jobQueueClone,
            workerGettingJob: false
        });

        this.cycle("Job Fetcher", success)
    }

    postToCrackers = async () => {
        console.debug("Posting Job to Crackers")

        // Set State to Cracking
        await this.promisedSetState({ workerCracking: true })

        // Create copy for immutibility
        let jobQueueClone = this.state.workerJobQueue.slice();

        // Change Pending -> Running
        let pendingJob = jobQueueClone.find((job) => (job.trackingStatus === "PENDING"))
        pendingJob.trackingStatus = "RUNNING"

        // Partition Job
        let chunkSize = Math.ceil(pendingJob.candidateValues.length / this.state.crackerPool.length)
        let chunkCandidateValuesList = [];
        for (let i = 0; i < pendingJob.candidateValues.length; i += chunkSize) {
            chunkCandidateValuesList.push(pendingJob.candidateValues.slice(i, i + chunkSize));
        }
        if (chunkCandidateValuesList.length !== this.state.crackerPool.length)
            throw Error("Chunk Length and Worker Length not the same!")
        pendingJob.completeChunkCount = chunkCandidateValuesList.length

        // Assign Job
        for (let i = 0; i < this.state.crackerPool.length; i++) {
            const chunk = {
                requestType: pendingJob.requestType,
                valueToMatchInBase64: pendingJob.valueToMatchInBase64,
                webWorkerId: this.state.crackerPool[i].webWorkerId,
                jobId: pendingJob.jobId,
                candidateValues: chunkCandidateValuesList[i],
                devices: this.state.workerDevices // Only used by local cracker
            }
            this.state.crackerPool[i].postMessage(chunk);
        }

        // Set exuction time
        pendingJob.executionStartTime = Date.now();

        // Set State
        await this.promisedSetState({ workerJobQueue: jobQueueClone })

        this.cycle("Job to Cracker (Pool)", true);
    }

    retrieveJobFromCrackers = async (message) => {
        // Immutibiliaty Copies
        let crackerPoolClone = this.state.crackerPool.slice()
        let jobQueueClone = this.state.workerJobQueue.slice()
        let multiplierRecommendation = this.state.workerRecommendedMultiplier;

        let isDoneCracking = false
        let runningJob = jobQueueClone.find((job) => (job.jobId === message.data.jobId))
        if (typeof runningJob !== 'undefined') {
            switch (message.data.crackingStatus) {
                case "CRACKED":
                    isDoneCracking = true
                    console.debug("Job " + runningJob.jobId + " Found")
                    // Target Found, Assign Result
                    runningJob.result = message.data.result

                    // Mark Job as complete
                    runningJob.trackingStatus = "COMPLETE"

                    // Terminate chunks from all crackers
                    crackerPoolClone.forEach((cracker) => cracker.terminate())
                    break;
                case "DONE":
                    // Target not found but chunk complete, Increment running chunk cound
                    runningJob.runningChunkCount = runningJob.runningChunkCount + 1

                    // If: this is the last cracker to return chunk for job
                    if (runningJob.runningChunkCount === runningJob.completeChunkCount) {
                        isDoneCracking = true
                        console.debug("Job " + runningJob.jobId + " Complete")

                        // Mark Job as complete
                        runningJob.trackingStatus = "COMPLETE"

                        let executionTime = Date.now() - runningJob.executionStartTime;
                        console.log("Job with multipler of " + runningJob.multiplier + " took " + executionTime + " ms to complete")
                        multiplierRecommendation = Math.floor((60000 * runningJob.multiplier) / executionTime) // 60000 is 1 minute
                        console.debug("Setting Multiplier Recommendation to " + multiplierRecommendation)
                    }
                    break;
                case "ERROR":
                    isDoneCracking = true
                    console.debug("Job " + runningJob.jobId + " Error")

                    // Update Tracking Status
                    runningJob.trackingStatus = "ERROR"

                    // Terminate chunks from all crackers
                    crackerPoolClone.forEach((element) => element.terminate())

                    // Notify Error
                    NotificationService.showNotification("Cracker Error: " + message.data.error, false)
                    break;
                default:
                    throw Error("Catastrophic Failure. No Tracking Status Reported")
            }

            await this.promisedSetState({
                workerCracking: !isDoneCracking,
                workerRecommendedMultiplier: multiplierRecommendation,
                workerJobQueue: jobQueueClone
            })

            this.cycle("Job From Cracker (Pool)", true)
        }
        else {
            console.error("Call back came to Retreive Job with id " + message.data.jobId + " but job not found in running queue")
        }
    }

    postToJobReporter = async () => {
        console.debug("Posting job to job reporter")

        // Set State to Reporting
        await this.promisedSetState({ workerReportingJob: true })

        let jobQueueClone = this.state.workerJobQueue.slice()
        let completeJob = jobQueueClone.find((job) => (job.trackingStatus === "COMPLETE" || job.trackingStatus === "ERROR"))

        // Set Params
        const params = {
            path: ActiveRequestService.reportJobPath(),
            token: AuthenticationService.getToken(),
            workerId: this.state.workerId,
            requestId: completeJob.requestId,
            listId: completeJob.listId,
            jobId: completeJob.jobId,
            trackingStatus: completeJob.trackingStatus,
            result: completeJob.result,
        }

        this.state.jobReporter.postMessage(params)
    }

    retrieveFromJobReporter = async (message) => {
        let success = false;
        let jobQueueClone = this.state.workerJobQueue.slice()
        let completeJobs = this.state.completeJobs;
        let errorJobs = this.state.errorJobs;

        let completeJob = jobQueueClone.find((job) => (job.jobId === message.data.jobId))
        if (typeof message.data.status !== 'undefined' && typeof completeJob !== 'undefined') {

            // Remove Job from Complete Queue
            jobQueueClone.splice(jobQueueClone.indexOf(completeJob), 1)

            // Mark As Sucess
            success = true;

            if (message.data.status === 'SUCCESS') {
                // Update Count
                switch (completeJob.trackingStatus) {
                    case 'COMPLETE':
                        completeJobs = completeJobs + completeJob.multiplier
                        break;
                    case 'ERROR':
                        errorJobs = errorJobs + completeJob.multiplier
                        break;
                    default:
                        break;
                }
            }
        }
        else {
            console.error("Report Job Failed")
        }

        await this.promisedSetState({
            workerReportingJob: false,
            workerJobQueue: jobQueueClone,
            completeJobs: completeJobs,
            errorJobs: errorJobs
        })

        this.cycle("Job Reporter", success)
    }


    sendHeartbeat = async () => {
        try {
            await WorkerService.sendHeartbeat(this.state.workerId);
            this.setState({ workerLastHeartbeat: new Date() })
        }
        catch (error) {
            console.error("Heartbeat Error " + error.response.data.message)
            if (error.response.data.code === 231) { // Worker Not Found
                this.deactivateWorker(); // Deactivate Worker
            }
        }
    }

    toHHMMSS = (secs) => {
        var sec_num = parseInt(secs, 10)
        var hours = Math.floor(sec_num / 3600)
        var minutes = Math.floor(sec_num / 60) % 60
        var seconds = sec_num % 60

        return [hours, minutes, seconds]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v, i) => v !== "00" || i > 0)
            .join(":")
    }

    uuidv4 = () => {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            // eslint-disable-next-line no-mixed-operators
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    }

    promisedSetState = (newState) => {
        return new Promise((resolve) => {
            this.setState(newState, () => {
                resolve()
            });
        });
    }

    getRandomName = () => {
        var left = ["admiring", "adoring", "agitated", "amazing", "angry", "awesome", "backstabbing", "berserk", "big", "boring", "clever", "cocky", "compassionate", "condescending", "cranky", "desperate", "determined", "distracted", "dreamy", "drunk", "ecstatic", "elated", "elegant", "evil", "fervent", "focused", "furious", "gigantic", "gloomy", "goofy", "grave", "happy", "high", "hopeful", "hungry", "insane", "jolly", "jovial", "kickass", "lonely", "loving", "mad", "modest", "naughty", "nauseous", "nostalgic", "pedantic", "pensive", "prickly", "reverent", "romantic", "sad", "serene", "sharp", "sick", "silly", "sleepy", "small", "stoic", "stupefied", "suspicious", "tender", "thirsty", "tiny", "trusting"]
        var right = ["albattani", "allen", "almeida", "archimedes", "ardinghelli", "aryabhata", "austin", "babbage", "banach", "bardeen", "bartik", "bassi", "bell", "bhabha", "bhaskara", "blackwell", "bohr", "booth", "borg", "bose", "boyd", "brahmagupta", "brattain", "brown", "carson", "chandrasekhar", "colden", "cori", "cray", "curie", "darwin", "davinci", "dijkstra", "dubinsky", "easley", "einstein", "elion", "engelbart", "euclid", "euler", "fermat", "fermi", "feynman", "franklin", "galileo", "gates", "goldberg", "goldstine", "goldwasser", "golick", "goodall", "hamilton", "hawking", "heisenberg", "heyrovsky", "hodgkin", "hoover", "hopper", "hugle", "hypatia", "jang", "jennings", "jepsen", "joliot", "jones", "kalam", "kare", "keller", "khorana", "kilby", "kirch", "knuth", "kowalevski", "lalande", "lamarr", "leakey", "leavitt", "lichterman", "liskov", "lovelace", "lumiere", "mahavira", "mayer", "mccarthy", "mcclintock", "mclean", "mcnulty", "meitner", "meninsky", "mestorf", "minsky", "mirzakhani", "morse", "murdock", "newton", "nobel", "noether", "northcutt", "noyce", "panini", "pare", "pasteur", "payne", "perlman", "pike", "poincare", "poitras", "ptolemy", "raman", "ramanujan", "ride", "ritchie", "roentgen", "rosalind", "saha", "sammet", "shaw", "shirley", "shockley", "sinoussi", "snyder", "spence", "stallman", "stonebraker", "swanson", "swartz", "swirles", "tesla", "thompson", "torvalds", "turing", "varahamihira", "visvesvaraya", "volhard", "wescoff", "williams", "wilson", "wing", "wozniak", "wright", "yalow", "yonath"]
        var l = left[Math.floor(Math.random() * left.length)];
        var r = right[Math.floor(Math.random() * right.length)];
        return l + " " + r;
    }

    getWorkerType = () => {
        if (isElectron()) {
            return 'LOCAL'
        }
        else {
            return 'BROWSER'
        }
    }

}

export default KrakenWorker;