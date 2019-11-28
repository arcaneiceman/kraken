import React, { Component } from 'react';
import ActiveRequestService from '../../services/ActiveRequestService';
import AuthenticationService from '../../services/AuthenticationService';
import WorkerService from '../../services/WorkerService'
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import Button from 'react-bootstrap/Button';
import DetailBox from '../../components/DetailBox/DetailBox';
import Octicon, { Rocket } from '@githubprimer/octicons-react';
import isElectron from 'is-electron';
import JobCrackerLocal from './jobcracker.local.webworker';

import classes from './KrakenWorker.module.css'

// Web Workers 
// eslint-disable-next-line import/no-webpack-loader-syntax
import JobFetcher from 'worker-loader!./jobfetcher.webworker';
// eslint-disable-next-line import/no-webpack-loader-syntax
import JobCrackerBrowser from 'worker-loader!./jobcracker.browser.webworker';
// eslint-disable-next-line import/no-webpack-loader-syntax
import JobReporter from 'worker-loader!./jobreporter.webworker'

class KrakenWorker extends Component {

    state = {
        /* State Variables */
        workerActive: false,
        workerActiveCoreCount: window.navigator.hardwareConcurrency === 1 ? 1 : (window.navigator.hardwareConcurrency - 1),
        workerGettingJob: false,
        workerCracking: false,
        workerReportingJob: false,

        /* Worker Variables */
        workerId: null,
        workerName: null,
        workerLastHeartbeat: null,
        workerHeartbeatTimer: null,
        workerSparkplugTimer: null,
        workerActivationTimer: null,
        workerJobQueue: [],
        workerRecommendedMultiplier: 1, // Default Mutliplier is 1
        executionStartTime: null,

        /* Web Workers */
        crackerPool: [],
        jobFetcher: null,
        jobReporter: null,

        /* Stats */
        secondsSinceActivation: 0,
        completeJobs: 0,
        errorJobs: 0
    }

    activateWorker = async () => {
        console.log("Activating Worker")

        let data = {}
        try{
            let response = await WorkerService.getWorker(this.state.workerId)
            data = response.data
        }
        catch (error){
            try {
                await this.promisedSetState({
                    secondsSinceActivation: 0,
                    completeJobs: 0,
                    errorJobs: 0
                })
                let response = await WorkerService.createWorker(this.getRandomName(), 'BROWSER')
                data = response.data
            }
            catch (error) {
                console.log("Create Worker error " + error.response.data.message)
                return
            }
        }

        // Set Window Unload Listner
        window.addEventListener("beforeunload", this.onUnload)

        // Create Intervals
        const heartbeatTimer = setInterval(() => { this.sendHeartbeat() }, 15000);
        const sparkPlugTimer = setInterval(() => { this.cycle("Interval"); }, 30000);
        const activationTimer = setInterval(() => { this.setState({ secondsSinceActivation: this.state.secondsSinceActivation + 1 }) }, 1000);

        // Create Web Workers Pool
        let crackerPoolClone = [];
        if (isElectron()) {
            let cracker = JobCrackerLocal(this.uuidv4(), this.retrieveJobFromCrackers)
            crackerPoolClone.push(cracker)
        }
        else {
            for (let i = 0; i < this.state.workerActiveCoreCount; i++) {
                let cracker = new JobCrackerBrowser()
                cracker.addEventListener("message", this.retrieveJobFromCrackers, true);
                crackerPoolClone.push(cracker)
            }
        }

        await this.promisedSetState({
            workerActive: true,
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

        this.cycle("Activate Worker")
    }

    deactivateWorker = async () => {
        console.log("Deactivating Worker")

        // Stop All Web Workers
        this.state.crackerPool.forEach((element) => element.terminate())
        this.state.jobFetcher.terminate()
        this.state.jobReporter.terminate()

        // Clear Window Listner 
        window.removeEventListener("beforeunload", this.onUnload)

        // Clear Internvals
        clearInterval(this.state.workerHeartbeatTimer);
        clearInterval(this.state.workerSparkplugTimer);
        clearInterval(this.state.workerActivationTimer);

        // Change Running -> Pending
        let jobQueueClone = this.state.workerJobQueue.slice();
        jobQueueClone.forEach((job) => {
            if (job.trackingStatus === "RUNNING")
                job.trackingStatus = "PENDING"
        });

        // Set State to deactivate worker
        await this.promisedSetState({
            workerActive: false,
            workerGettingJob: false,
            workerCracking: false,
            workerReportingJob: false,

            workerHeartbeatTimer: null,
            workerSparkplugTimer: null,
            workerActivationTimer: null,
            workerJobQueue: jobQueueClone,
            webWorkerList: [],
            executionStartTime: null,
        })
    }

    render() {
        let display = null;
        if (this.state.workerActive) {
            const inProgressJobs = this.state.workerJobQueue.filter((job) => job.trackingStatus === "PENDING" || job.trackingStatus === "RUNNING")
                .reduce((sum, job) => { return sum + job.multiplier }, 0)
            display =
                <div>
                    <SectionHeading heading={'Worker'} />
                    <div className={classes.main_active}>
                        <div>
                            <div className={classes.content}>
                                <DetailBox boxValue={inProgressJobs.toString()} boxText={'In Progress'} />
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
                        <div className={classes.stopButtonContainer}>
                            <Button variant="danger" onClick={this.deactivateWorker}>Stop</Button>
                        </div>
                    </div>
                </div >
        }
        else {
            display =
                <div>
                    <SectionHeading heading={'Add a Worker'} />
                    <div className={classes.main_inactive}>
                        <h3 className={classes.startText}> Start Worker Here</h3>
                        <Button className={classes.startButton} onClick={this.activateWorker}> Work <Octicon icon={Rocket} /></Button>
                    </div>
                </div>;
        }
        return (display);
    }

    componentWillUnmount() {
        if (this.state.workerActive)
            this.deactivateWorker()
    }

    /*
        Cycle function
        This function runs:
            - Producer (getting job from server) 
            - Consumer (cracking job)
            - Reporter (sending job to server)
    */
    cycle = async (from) => {
        console.log("Cycle : from " + from)

        if (!this.state.workerActive)
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
        console.log("Posting request to job fetcher")

        // Set State to Fetching
        await this.promisedSetState({ workerGettingJob: true })

        // Set Params
        const params = {
            path: ActiveRequestService.getJobPath(),
            token: AuthenticationService.getToken(),
            workerId: this.state.workerId,
            multiplier: Math.max(Math.min(this.state.workerRecommendedMultiplier, 1000), 1),
            activeCoreCount: this.state.workerActiveCoreCount
        }
        console.log("Getting Job with multiplier " + params.multiplier)

        // Send Request To Fetcher
        this.state.jobFetcher.postMessage(params)
    }

    retrieveFromJobFetcher = async (message) => {
        let jobQueueClone = this.state.workerJobQueue.slice()
        console.log("Retreiving response from job fetcher")
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
        }
        else {
            console.log("Get Job Failed")
            await this.promisedSetState({ workerGettingJob: false })
            return;
        }

        await this.promisedSetState({
            workerJobQueue: jobQueueClone,
            workerGettingJob: false
        });

        this.cycle("Retreiving response from job fetcher")
    }

    postToCrackers = async () => {
        console.log("Posting Job to Crackers")

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
            }
            this.state.crackerPool[i].postMessage(chunk);
        }

        // Set exuction time
        pendingJob.executionStartTime = Date.now();

        // Set State
        await this.promisedSetState({ workerJobQueue: jobQueueClone })

        this.cycle("Posting job to crackers success!");
    }

    retrieveJobFromCrackers = async (message) => {
        // Immutibiliaty Copies
        let crackerPoolClone = this.state.crackerPool.slice()
        let jobQueueClone = this.state.workerJobQueue.slice()
        let multiplierRecommendation = this.state.workerRecommendedMultiplier;

        let isDoneCracking = false
        let runningJob = jobQueueClone.find((job) => (job.jobId === message.data.jobId))
        if (runningJob !== null) {
            switch (message.data.crackingStatus) {
                case "CRACKED":
                    isDoneCracking = true
                    console.log("Job " + runningJob.jobId + " Found")
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
                        console.log("Job " + runningJob.jobId + " Complete")

                        // Mark Job as complete
                        runningJob.trackingStatus = "COMPLETE"

                        let executionTime = Date.now() - runningJob.executionStartTime;
                        console.log(" Job took " + executionTime + " ms to complete. Multipler of " + runningJob.multiplier)
                        multiplierRecommendation = Math.floor((60000 * runningJob.multiplier) / executionTime) // 60000 is 1 minute
                        console.log("Setting Multiplier Recommendation to " + multiplierRecommendation)
                    }
                    break;
                case "ERROR":
                    isDoneCracking = true
                    console.log("Job " + runningJob.jobId + " Error")

                    // Update Tracking Status
                    runningJob.trackingStatus = "ERROR"

                    // Terminate chunks from all crackers
                    crackerPoolClone.forEach((element) => element.terminate())
                    break;
                default:
                    throw Error("Catastrophic Failure. No Tracking Status Reported")
            }

            await this.promisedSetState({
                workerCracking: !isDoneCracking,
                workerRecommendedMultiplier: multiplierRecommendation,
                workerJobQueue: jobQueueClone
            })

            this.cycle("Retrieve Job From Cracker (Pool)")
        }
        else {
            console.log("Call back came to Retreive Job but job not found in running queue")
        }
    }

    postToJobReporter = async () => {
        console.log("Posting job to job reporter")

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
        let jobQueueClone = this.state.workerJobQueue.slice()
        let completeJobs = this.state.completeJobs;
        let errorJobs = this.state.errorJobs;

        let completeJob = jobQueueClone.find((job) => (job.jobId === message.data.jobId))
        if (completeJob !== null) {
            // Remove Job from Complete Queue
            jobQueueClone.splice(jobQueueClone.indexOf(completeJob), 1)

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

        await this.promisedSetState({
            workerReportingJob: false,
            workerJobQueue: jobQueueClone,
            completeJobs: completeJobs,
            errorJobs: errorJobs
        })

        this.cycle("Retreive From Job Reporter")
    }

    sendHeartbeat = async () => {
        try {
            await WorkerService.sendHeartbeat(this.state.workerId);
            this.setState({ workerLastHeartbeat: new Date() })
        }
        catch (error) {
            console.log("Heartbeat Error " + error.response.data.message)
            if (error.response.data.code === 231)
                this.deactivateWorker();
        }
    }

    onUnload = (event) => {
        event.returnValue = "Worker is still active! Please Stop Worker before Closing tab"
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

}

export default KrakenWorker;