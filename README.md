# Durable HTTP/HTTPS Requests (version 2.0.0)

Dauntless is an error tolerant, flexible, and extensible HTTP request client for Node. Use Dauntless if your Node project requires:

* Error tolerance for server backend issues via exponential backoff
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

Creating a client using Dauntless is as simple as passing an HTTP method, callback functions for success and error, and setting the request URL:

```
const dauntless = require('dauntless');
var client = dauntless.client(httpMethod, successHandler, errorHandler);
client.setUrl(requestUrl);

// If you have to send a request body, set it here
client.setBody(requestBody); 

client.exec();
```
It's that simple.

### Headers

Request headers can be set via the following method:

```
client.setRequestHeader("nameOfRequestHeader", "requestHeaderValue")
```

### Handlers

Dauntless uses callback functions (referred to as handlers) to deal with the three main states of the client: success, error, and retry. Handlers are functions with the following syntax:

```
function successHandler(res) {
// Do something with res, the response body passed into this function
}
```

Handlers are always invoked via .call, using the client as the 'this' context. 

### Using Promises and Async-Await

Dauntless supports native ES Promises. By setting client.returnPromise to true, client.exec() will return a Promise, which can then be used with .then() or in async functions. Examples of each pattern are below:

```
// Setup your client
const dauntless = require('dauntless');
var client = dauntless.client(httpMethod);
client.setUrl(yourUrlHere);

...

// Set returnPromise to true
client.returnPromise = true;
```
Then use as you would any other Promise:

```
client.exec().then(res => {
  // Do something with res, the response body passed into this function
});
```

Or in any async function:

```
async function waitForDauntless() {
  const res = await client.exec();
  // Do something with res, the response body assigned to this variable
}
```

### Response Code Ranges

By default, Dauntless clients consider HTTP 2xx and 3xx responses a "success" (successOn), 4xx responses an "error" (errorOn), and 5xx response a "retry" (retryOn). You can customize these ranges by using:

```
// Clears the range, then sets it to this inclusive range of values
client.setRange(beginning, end, this.successOn/errorOn/retryOn)

// Just adds the every number in the range to the range
client.addRange(beginning, end, this.successOn/errorOn/retryOn)
```

## More Features

Dauntless is designed to make minimal assumptions about use cases, but provide you with means of cleanly accommodating your use cases.

### autoResolveRejectPromise

By default, setting returnPromise sets the successHandler to Promise.resolve and the errorHandler to Promise.reject. Implement custom resolution and rejection handling by setting client.autoResolveRejectPromise to false. You can then access the resolve and reject of the Promise from within the successHandler, retryHandler, and errorHandler callbacks by using:

```
this.resolve
this.reject
```

This works very well for situations where the response is paginated and you want to only resolve once there's no more pages of the results. Here's an example using the YouTube Data API:

```
function successHandler = (res) {
  // We're scoped to the Dauntless client here
  // Let's assume this follows the YouTube Data API's Channel Resource from Channels.list
  // first, parse res from JSON
  let response = JSON.parse(res);

  ...

  if(response.nextPageToken) {
    // we've got more data...
    this.setUrl(newRequestUrlWithPageToken);
    if(this.returnPromise) this.returnPromise = false;
    this.exec();
  } else {
    this.resolve();
  }
}
```

Passing true to exec will only send a new request and won't return a new Promise.

### isValid() and the validationHandler

By default, every Dauntless client checks to make sure that the request is valid by way of the isValid() function and the validationHandler. validationHandler is always invoked by isValid() so that the client is the 'this' context. 

### invokeXhr

Dauntless is based off the xmlhttprequest node module. You can access the underlying XMLHttpRequest object at any time by using

```
client.xhr.nameOfMethodOrProp
```

Alternatively, you can call methods and set properties of the XHR object in a batch by using invokeXhr. invokeXhr takes a hash where key names correspond to the XMLHttpRequest's properties. Values are either an array of arguments for a method, or a single value for a variable. For example:

```
const dauntless = require('dauntless');
let client = dauntless.client(httpMethod, successHandler, failureHandler);
client.invokeXhr({ "setRequestHeader": ["headerName", "headerValue"]});
```

invokeXhr returns the object you pass as an argument, along with a returnValue to access any and all info captured by methods called via invokeXhr:

```
const dauntless = require('dauntless');
let client = dauntless.client(httpMethod, successHandler, failureHandler);
var options = client.invokeXhr({ "getAllResponseHeaders"});
console.log(options.getAllResponseHeaders.returnValue);
```

### request-promise mode

Dauntless can be used in a request-promise style configuration without losing the feature you like.

```
const dauntless = require('dauntless');
dauntless.rp(url, options);
```

options has following structure:

```
options = {
  headers: { headerName1: headerValue1, headerName2: headerValue2, ... },
  validationHandler: function,
  method: 'GET/POST/DELETE ... ',
  body: any valid request body
}