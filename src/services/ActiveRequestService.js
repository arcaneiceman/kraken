import axios from './AxiosInstance'

const createActiveRequest = (requestType, requestName, requestMetadata, valueToMatchInBase64, passwordLists, crunchParams) => {
    const data = { requestType, requestName, requestMetadata, valueToMatchInBase64, passwordLists, crunchParams }
    axios.post('/active-request', data)
}

const getSummary = () => {
    return axios.get('/active-request/summary')
}

const getActiveRequests = (pageNumber, pageSize) => {
    return axios.get('/active-request?pageNumber=' + pageNumber + '&pageSize=' + pageSize)
}

const deleteActiveRequest = (activeRequestId) => {
    return axios.delete('/active-request/' + activeRequestId)
}

const getJobPath = () => {
    return '/active-request/get-job';
}

const reportJobPath = () => {
    return '/active-request/report-job'
}

const ActiveRequestService = {
    createActiveRequest,
    getSummary,
    getActiveRequests,
    deleteActiveRequest,
    getJobPath,
    reportJobPath,
}

export default ActiveRequestService;
