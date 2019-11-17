/* eslint-disable no-restricted-globals */
self.onmessage = (e) => {
    const request = { workerId: e.data.workerId, multiplier: e.data.multiplier }
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", e.data.url, false);
    xhttp.setRequestHeader("Authorization", "Bearer " + e.data.token)
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Version", "0.0.1")
    xhttp.send(JSON.stringify(request));

    let response = {};
    switch (xhttp.status) {
        case 200:
            response = JSON.parse(xhttp.responseText);
            response.status = "SUCCESS"
            break;
        default:
            response.status = "ERROR"
            console.log("Get Job Error " + xhttp.status)
    }

    self.postMessage(response)
}