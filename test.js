let btoa = function (str) { return Buffer.from(str).toString('base64') };
let atob = function (str) { return Buffer.from(str, 'base64').toString() };
const nock = require('nock')
require('mocha')
const expect = require('chai').expect
var dauntless = require("./lib/index.js");
var auth = {}

// dauntless.config.setDebug(true);
nock("http://test.com")
    .get("/helloworld/")
    .times(4)
    .reply(200, "Hello World");
nock("http://test.com")
    .patch("/helloworld")
    .times(4)
    .reply(200, "Hello World");
nock("https://www.googleapis.com")
    .post("/oauth2/v4/token")
    .query(true)
    .times(4)
    // This response uses the example access_token and refresh_token from Google's OAuth2 server-side workflow
    .reply(function (uri, requestBody) {
        // console.log('intercepting')
        return [200, {
            "access_token": "1/fFAGRNJru1FTz70BzhT3Zg",
            "expires_in": 3920,
            "token_type": "Bearer",
            "refresh_token": "1/xEoDL4iW3cxlI7yDbSRFYNG01kVKM2C-259HOF2aQbI"
        }]
    });
nock("http://test.com")
    .post("/helloworld/")
    .times(4)
    .reply(function (uri, requestBody) {
        try {
            requestBody = JSON.parse(requestBody)
        } catch (e) {
            console.log(e)
            return [400, { error: e }]
        }
        if (requestBody.id === "123" && requestBody.hello === "world") return [200, "Hello World"]
    })
// .reply(200, "Hello World");
nock("http://test.com")
    .get("/retry/")
    .times(20)
    .reply(500, "Hello World");

let checkAccess = async function () {

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


describe('XHR pattern', () => {
    before(() => {


    });

    // Callback-based tests
    it('Callback-based GET', function (done) {
        let client = new dauntless.client()
        client.returnPromise = false
        client.open("GET", "http://test.com/helloworld/")
        client.setSuccessHandler(function (res) {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
        client.send()
    });

    it('Callback-based POST', function (done) {
        let test = new dauntless.client()
        test.returnPromise = false
        test.open("POST", "http://test.com/helloworld/")
        test.setSuccessHandler(function (res) {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
        test.send({ "id": "123", "hello": "world" })
    });

    it('Callback-based PATCH with OAuth2 Validation Handler', function (done) {

        auth = { 'refresh_token': '', tokenValidUntil: 0 }
        let client = new dauntless.client()
        client.returnPromise = false
        client.open("PATCH", "http://test.com/helloworld")
        client.setValidationHandler(checkAccess)
        client.setSuccessHandler(function (res) {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
        client.send()
    });

    it('Callback-based Retry (should fail after retrying 4 times)', function (done) {
        let client = new dauntless.client()
        client.returnPromise = false
        client.open("GET", "http://test.com/retry/")
        client.setBackoffStep(1)
        client.setJitter(1)
        client.setErrorHandler(function (res, status) {
            expect(res).to.be.a('string')
            // console.log(status)
            done()
        })
        client.send()
    }).timeout(30 * 1000);

    // Promise-based
    it('Promise-based GET', function (done) {
        let client = new dauntless.client()
        client.open("GET", "http://test.com/helloworld/")
        client.send().then((res) => {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
    });

    it('Promise-based POST', function (done) {
        let client = new dauntless.client()
        client.open("POST", "http://test.com/helloworld/")
        client.send({ "id": "123", "hello": "world" }).then((res) => {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
    });

    it('Promise-based PATCH with OAuth2 Validation Handler', function (done) {

        auth = { 'refresh_token': '', tokenValidUntil: 0 }
        let client = new dauntless.client()
        client.open("PATCH", "http://test.com/helloworld")
        client.setValidationHandler(checkAccess)
        client.send().then(function (res) {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
    });

    it('Promise-based Retry (should fail after retrying 4 times)', function (done) {
        let client = new dauntless.client()
        // client.returnPromise = fals
        client.open("GET", "http://test.com/retry/")
        client.setBackoffStep(1)
        client.setJitter(1)
        client.send().catch(error => {
            done()
        })
    }).timeout(30 * 1000);
});
//   return;
describe('request-promise pattern', () => {

    it('GET', function (done) {
        dauntless.rp("http://test.com/helloworld/", {}).then((res) => {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
    });

    it('POST', function (done) {
        dauntless.rp("http://test.com/helloworld/", {
            method: "POST",
            body: { "id": "123", "hello": "world" }
        }).then((res) => {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
    });

    it('PATCH with OAuth2 Validation Handler', function (done) {

        auth = { 'refresh_token': '', tokenValidUntil: 0 }
        dauntless.rp("http://test.com/helloworld", {
            method: "PATCH",
            validationHandler: checkAccess
        }).then(function (res) {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
    });

    it('Retry (should fail after retrying 4 times)', function (done) {
        dauntless.rp("http://test.com/retry/", {
            backoffStep: 1,
            jitter: 1
        }).catch((res) => {
            expect(res).to.be.a('string')
            expect(res).to.equal("Hello World")
            done()
        })
    }).timeout(30 * 1000);
});

return;
