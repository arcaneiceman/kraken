import axios from './AxiosInstance'

const getSummary = () => {
   return axios.get('/complete-request/summary')
}

const listCompleteRequests = (pageNumber, pageSize) => {
    return axios.get('/complete-request?pageNumber=' + pageNumber + '&pageSize=' + pageSize)
}

const deleteCompleteRequest = (completeRequestId) => {
    return axios.delete('/complete-request/' + completeRequestId)
}

const CompleteRequestService = {
    getSummary,
    listCompleteRequests,
    deleteCompleteRequest,
}

export default CompleteRequestService;