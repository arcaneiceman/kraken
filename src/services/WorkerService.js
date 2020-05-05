import axios from './AxiosInstance'

const createWorker = (workerName, workerType, platform) => {
    const data = {workerName, workerType, platform}
    return axios.post('/worker', data)
}

const getSummary = () => {
    return axios.get('/worker/summary')
}

const getWorkers = (pageNumber, pageSize) => {
    return axios.get('/worker?pageNumber=' + pageNumber + '&pageSize=' + pageSize +'&sort=status,desc')
}

const getWorker = (workerId) => {
    return axios.get('/worker/' + workerId)
}

const deleteWorker = (workerId) => {
    return axios.delete('/worker/' + workerId)
}

const sendHeartbeat = (workerId) => {
    return axios.post('/worker/' + workerId + '/heartbeat')
}

const WorkerService = {
    createWorker,
    getSummary,
    getWorkers,
    getWorker,
    deleteWorker,
    sendHeartbeat
}

export default WorkerService;