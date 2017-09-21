require('../lib/index.js')

var auth = {
    refreshToken: "YOUR-REFRESH-TOKEN-HERE",
    clientSecret: "YOUR-CLIENT-SECRET-HERE",
    clientId: "YOUR-CLIENT-ID-HERE",
    tokenValidUntil: Date.now(),
    accessToken: ""
}

let refreshToken = async function () {

    // console.log("got to check")
    if (!(this.getUrl() && this.getMethod() && this.getStatus() <= 1)) return false;
    if (auth.tokenValidUntil <= Date.now()) {
        let refreshRequest = new dauntless.client();
        // console.log("testing auth with " + `https://www.googleapis.com/oauth2/v4/token?refresh_token=${auth.refreshToken}&client_secret=${auth.clientSecret}&client_id=${auth.clientId}&grant_type=refresh_token`)
        refreshRequest.open('POST', `https://www.googleapis.com/oauth2/v4/token?refresh_token=${auth.refreshToken}&client_secret=${auth.clientSecret}&client_id=${auth.clientId}&grant_type=refresh_token`);
        refreshRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        let response = await refreshRequest.send();
        let parsedResponse = JSON.parse(response);
        // console.log("got to parsed")
        if (parsedResponse.access_token) {
            let expiresInMilliseconds = parseInt(auth.expires_in) * 1000;
            auth.accessToken = parsedResponse.access_token;
            auth.tokenValidUntil = parseInt((Date.now() + expiresInMilliseconds) - 100000);
        }
    }
    return true;
}

exports = function () {
    var client = new dauntless.client();
    client.open('GET', endpoint);
    client.setValidationHandler(refreshToken);
    return client.send();
}