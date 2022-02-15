import axios from './AxiosInstance'

const getSummary = () => {
    return axios.get('/complete-request/summary')
}

const listCompleteRequests = (pageNumber, pageSize) => {
    return axios.get('/complete-request?pageNumber=' + pageNumber + '&pageSize=' + pageSize)
        .then(response => {
            response.data.content.forEach(completeRequest => {
                completeRequest.totalJobCount = completeRequest.trackedLists.map(trackedList => trackedList.totalJobCount).reduce((acc, value) => acc + value, 0);
                completeRequest.completedJobCount = completeRequest.trackedLists.map(trackedList => trackedList.completedJobCount).reduce((acc, value) => acc + value, 0);
                completeRequest.errorJobCount = completeRequest.trackedLists.map(trackedList => trackedList.errorJobCount).reduce((acc, value) => acc + value, 0);
                if (Object.keys(completeRequest.results).length === 0)
                    completeRequest.result = "Not Found"
                else if (Object.keys(completeRequest.results).length < completeRequest.targetCount)
                    completeRequest.result = "Partial"
                else
                    completeRequest.result = "Found"
                
                switch(completeRequest.requestType){
                    case "2500":
                        completeRequest.requestType = "WPA";
                        break;
                    case "1000":
                        completeRequest.requestType = "NTLM";
                        break;
                    case "0":
                        completeRequest.requestType = "MD5";
                        break;
                    default:
                        completeRequest.requestType = "Unknown"
                }
            })
            return response;
        })
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