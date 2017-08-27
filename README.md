# dauntless.js

Dauntless.js is a minimalist, error tolerant, highly configurable request package for Node. It was created to be a more resilient option than request-promise when dealing with transient errors by implementing exponential backoff while still allowing for a single Promise to wrap around the HTTP request. 

# Installation

```
npm install dauntless
```

# Usage

Creating a connection using dauntless.js is as simple as passing an HTTP method, handlers for success and error, and setting the request URL:

```
const dauntless = require('dauntless');
var connection = dauntless.conn(httpMethod, successHandler, errorHandler);
connection.setUrl(requestUrl);
connection.exec();
```

## Handlers

dauntless.js uses handlers to deal with the three main states of the connection: success, error, and retry. These handlers all use the same function syntax:

```
function successHandler(res) {
// Do something with res, the response body passed into this function
}
```

## Using Promises and Async-Await

Dauntless supports native ES Promises. Use the following code:

```
const dauntless = require('dauntless');
var connection = dauntless.conn(httpMethod);
connection.setUrl(yourUrlHere);
connection.returnPromise = true;
```
To use as a Promise, simply do:

```
connection.exec().then(res => {
  // Do something with res, the response body passed into this function
});
```

For async-await, do:

```
async function waitForDauntless() {
  const res = await connection.exec();
  // Do something with res, the response body assigned to this variable
}
```

## Advanced Features

Dauntless.js is based off the xmlhttprequest node module. You can access the underlying XMLHttpRequest object at any time by using

```
nameOfDauntlessConnection.xhr.nameOfMethodOrProp
```

Alternatively, you can call methods and set properties of the XHR object in a batch by using setXhrOptions. setXhrOptions takes a hash where key names correspond to the XMLHttpRequest's properties. Values are either an array of arguments for a method, or a single value for a variable. For example:

```
const dauntless = require('dauntless');
let connection = dauntless.conn(httpMethod, successHandler, failureHandler);
connection.setXhrOptions({ "setRequestHeader": ["headerName", "headerValue"]});
```

setXhrOptions returns the object you pass as an argument, along with a returnValue to access any and all info captured by methods called via setXhrOptions:

```
const dauntless = require('dauntless');
let connection = dauntless.conn(httpMethod, successHandler, failureHandler);
var options = connection.setXhrOptions({ "getAllResponseHeaders"});
console.log(options.getAllResponseHeaders.returnValue);
```




