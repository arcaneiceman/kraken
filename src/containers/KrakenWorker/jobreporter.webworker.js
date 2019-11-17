/* eslint-disable no-restricted-globals */
self.onmessage = (e) => {
    const request = {
        workerId: e.data.workerId,
        requestId: e.data.requestId,
        listId : e.data.listId,
        jobId : e.data.jobId,
        trackingStatus : e.data.trackingStatus,
        result : e.data.result,
    }
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", e.data.url, false);
    xhttp.setRequestHeader("Authorization", "Bearer " + e.data.token)
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Version", "0.0.1")
    xhttp.send(JSON.stringify(request));

    self.postMessage({  jobId : e.data.jobId })
}