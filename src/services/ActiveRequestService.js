import axios from './AxiosInstance'

const createActiveRequest = (requestType, requestName, requestMetadata, valueToMatchInBase64, trackedLists) => {
    const data = { requestType, requestName, requestMetadata, valueToMatchInBase64, trackedLists}
    return axios.post('/active-request', data)
}

const getSummary = () => {
    return axios.get('/active-request/summary')
}

const listActiveRequests = (pageNumber, pageSize) => {
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
    listActiveRequests,
    deleteActiveRequest,
    getJobPath,
    reportJobPath,
}

export default ActiveRequestService;
