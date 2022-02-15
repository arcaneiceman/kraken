/* eslint-disable no-restricted-globals */
self.onmessage = (e) => {
    let response = {};
    try {
        const request = { workerId: e.data.workerId, multiplier: e.data.multiplier }
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", process.env.REACT_APP_API_URL + e.data.path, false);
        xhttp.setRequestHeader("Authorization", "Bearer " + e.data.token)
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.setRequestHeader("Version", process.env.REACT_APP_API_VERSION)
        xhttp.send(JSON.stringify(request));

        switch (xhttp.status) {
            case 200:
                response = JSON.parse(xhttp.responseText);
                response.status = "SUCCESS"
                break;
            default:
                response.status = "ERROR"
                console.error("Get Job Error " + xhttp.status)
        }
    }
    finally {
        self.postMessage(response)
    }
}

