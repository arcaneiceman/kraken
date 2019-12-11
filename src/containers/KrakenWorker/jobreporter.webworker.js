/* eslint-disable no-restricted-globals */
self.onmessage = (e) => {
    let response = {};
    try {
        const request = {
            workerId: e.data.workerId,
            requestId: e.data.requestId,
            listId: e.data.listId,
            jobId: e.data.jobId,
            trackingStatus: e.data.trackingStatus,
            result: e.data.result,
        }
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", process.env.REACT_APP_API_URL + e.data.path, false);
        xhttp.setRequestHeader("Authorization", "Bearer " + e.data.token)
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.setRequestHeader("Version", process.env.REACT_APP_API_VERSION)
        xhttp.send(JSON.stringify(request));

        switch (xhttp.status) {
            case 200:
                response.jobId = e.data.jobId;
                response.status = "SUCCESS"
                break;
            default:
                response.status = "ERROR"
                console.log("Get Job Error " + xhttp.status)
        }
    }
    finally{
        self.postMessage(response)
    }

}