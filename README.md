# Dauntless - An Error Tolerant Request Module

Dauntless is a minimalist, error tolerant, easily extensible request module for Node.

* Error tolerance for server backend issues via exponential backoff
* Implements native ES6 Promises and async-await
* Includes hook to easily check for authorization
* Easily extensible architecture
* Small library size and only a single dependency

Use Dauntless if your Node project has to interact with servers that occasionally throw transient backend errors. Tested and proven to work with YouTube's REST APIs. 

# Installation

It's as easy as installing the package via npm

```
npm install dauntless
```

# Usage

Creating a connection using Dauntless is as simple as passing an HTTP method, handlers for success and error, and setting the request URL:

```
const dauntless = require('dauntless');
var connection = dauntless.conn(httpMethod, successHandler, errorHandler);
connection.setUrl(requestUrl);
connection.exec();
```

## Handlers

Dauntless uses handlers to deal with the three main states of the connection: success, error, and retry. Handlers are functions with the following syntax:

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
To use as a Promise, then do:

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

Dauntless is based off the xmlhttprequest node module. You can access the underlying XMLHttpRequest object at any time by using

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




