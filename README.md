# Durable HTTP/HTTPS Requests (version 2.1.1)

Dauntless is an error tolerant, flexible, and extensible HTTP/HTTPS request client for Node based off the XMLHttpRequest specification. Use Dauntless if your Node project requires:

* Error tolerance for server backend issues via built-in exponential backoff
* Implementation of native ES6 Promises and async-await
* Hooks to easily check for request authorization
* Flexible, extensible architecture with minimal assumptions about use cases
* Small library size and only a single dependency

Dauntless assumes very little about what your request looks like or how you want to interact with it, preferring to give you the control of your requests.

## Installation

It's as easy as installing the package via npm

```
npm install dauntless --save
```

## Usage

Creating a promise-wrapped XHR request using Dauntless is as simple as sending a regular XHR request:

```
const dauntless = require('dauntless');
var client = new dauntless.client();
client.open(HttpMethod, requestUrl);
var promisedRequest = client.send(requestBody);
```

request-promise style invocation is also supported:

```
const dauntless = require('dauntless');
dauntless.rp(url, options);
```

See 'request-promise mode' below for more information.

## Features

Though dauntless requires minimal configuration out of the box, client instances are highly configurable while still allowing you to focus on writing logic that powers your software.

### Handlers, autoResolve, and autoReject

Dauntless uses callback functions (referred to as handlers) to deal with the three main states of the request: success, error, and retry. Handlers are functions with the following syntax:

```
function successHandler(res) {
// Do something with res, the response body passed into this function
}
```

Handlers are always invoked via .call, with the client as the 'this' context. When you pass no arguments into the client constructor, returnPromise, autoResolveRejectPromise, autoResolve, and autoReject default to true.

Implement custom resolution and/or rejection handling by setting client.autoResolve or client.autoReject to false and then calling setSuccessHandler (or setErrorHandler). You can then access the resolve and reject of the Promise returned by the client from within the successHandler and errorHandler callbacks by using this.resolve and this.reject.

Custom resolution and rejection is useful for situations where the response is paginated and you want to only resolve once you've paginated through all the results. Here's an example using the YouTube Data API:

```
function dataReader = (res) {
  // We're scoped to the Dauntless client here
  // Let's assume this follows the YouTube Data API's Channel Resource from Channels.list
  // first, parse res from JSON
  let response = JSON.parse(res);

  // Do what you need to do with dataReader

  if(response.nextPageToken) {
    // we've got more data...
    this.open(HttpMethod, requestUrlWithPageToken);
    if(this.returnPromise) this.returnPromise = false;
    this.send();
  } else {
    this.resolve();
  }
}

let client = new dauntless.client();
client.autoResolve = false;
client.setSuccessHandler(dataReader);
client.open(HttpMethod, requestUrl);
client.send();
```

Clean, concise code without having to go through callback hell.

### Validation Handling

Every Dauntless client checks to make sure that the request is valid by way of the validationHandler. By default, that code looks like this:

```
    var validationHandler = function() { return this.url && this.method && this.xhr.status <= 1 };
```

Here's an example of a custom validationHandler implementation. It checks to see if an OAuth2 access token obtained through Google's OAuth2 flow has expired, refreshes if it has, and then returns true to say that we've got a valid token:

```
async function refreshToken() {
  if(!(this.url && this.method && this.xhr.status <= 1)) return false;
  if(tokenValidUntil <= Date.now()) {
      let refreshRequest = new dauntless.client();
      refreshRequest.open('POST', `https://www.googleapis.com/oauth2/v4/token?refresh_token=${refresh}&client_secret=${secret}&client_id=${id}&grant_type=refresh_token`);
      refreshRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      let response = await refreshRequest.send();
      let parsedResponse = JSON.parse(response);
    }
  return true;
}

var client = new dauntless.client();
client.open('GET', endpoint);
client.setValidationHandler(refreshToken);
client.send();
```

Now your client will automatically check to see if the access token is valid before proceeding with your initial request.

### Response Code Ranges

By default, Dauntless requests consider HTTP 2xx and 3xx responses a "success" (successOn), 4xx responses an "error" (errorOn), and 5xx response a "retry" (retryOn). You can customize these ranges by using:

```
// Clears the range, then sets it to this inclusive range of values
client.setRange(beginning, end, client.successOn/errorOn/retryOn)

// Just adds the every number in the range to the range
client.addRange(beginning, end, client.successOn/errorOn/retryOn)
```

### invokeXhr

Dauntless is based off the xmlhttprequest node module. You can access the underlying XMLHttpRequest object at any time by using

```
client.xhr.nameOfMethodOrProp
```

Alternatively, you can call methods and set properties of the XHR object in a batch by using invokeXhr. invokeXhr takes a hash where key names correspond to the XMLHttpRequest's properties. Values are either an array of arguments for a method, or a single value for a variable. For example:

```
const dauntless = require('dauntless');
let client = new dauntless.client(httpMethod, successHandler, failureHandler);
client.invokeXhr({ "setRequestHeader": ["headerName", "headerValue"]});
```

invokeXhr returns the object you pass as an argument, along with a returnValue to access any and all info captured by methods called via invokeXhr:

```
const dauntless = require('dauntless');
let client = new dauntless.client(httpMethod, successHandler, failureHandler);
var options = client.invokeXhr({ "getAllResponseHeaders"});
console.log(options.getAllResponseHeaders.returnValue);
```

### request-promise mode

Dauntless requests can be invoked in a request-promise style configuration without losing access to features like exponential backoff.

```
const dauntless = require('dauntless');
dauntless.rp(url, options);
```

options has following structure:

```
options = {
  headers: { headerName1: headerValue1, headerName2: headerValue2, ... },
  validationHandler: <Function>,
  successHandler: <Function>,
  errorHandler: <Function>,
  autoResolve: Boolean,
  autoReject: Boolean,
  successOn: [ Array, of, integers, ... ],
  errorOn: [ Array, of, integers, ... ],
  retryOn: [ Array, of, integers, ... ],
  method: 'GET/POST/DELETE/etc',
  body: any valid request body
}
```