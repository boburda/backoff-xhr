var xh = require("xmlhttprequest");

exports.client = function(method, handleSuccess, handleError) {
    this.xhr = new xh.XMLHttpRequest();
    this.url = null;
    this.successOn = [];
    this.retryOn = [];
    this.errorOn = [];
    this.method = method ? method : 'GET';
    this.retries = 0;
    this.maxRetries = 4;
    requestBody = undefined;
    this.jitter = 100;
    successHandler = handleSuccess;
    errorHandler = handleError;
    progressHandler = undefined;
    // if you don't pass any handlers, default to Promise
    this.returnPromise = (!successHandler && !errorHandler);
    this.autoResolveRejectPromise = this.returnPromise;
    // get/set for URL
	this.setUrl = (url) => {this.url = url; return this;}
    this.getUrl = () => this.url;
    // get/set for method
    this.setMethod = method => this.method = method;
    this.getMethod = ()=> this.method;
    requestHeaders = {};
    this.setRequestHeader = (headerName, headerValue) => requestHeaders[headerName] = headerValue;
    // empties an array, then calls addToRange
    this.setRange = (start, end, arr) => {
        arr.splice(0, arr.length);
        this.addToRange(start, end, arr);
    }
    // adds a range of numbers to 
    this.addToRange = (start, end, arr) => {
        for(let x = start; x <= end; x++) { 
            !arr.includes(parseInt(x)) && arr.push(parseInt(x)); 
        }
    };
    this.setRange(200, 305, this.successOn);
    this.setRange(400, 500, this.errorOn);
    this.setRange(500, 600, this.retryOn);

    // quick access so you don't have to do client.xhr.<propOrFunctionName> and so you can
    // set lots of options with one call
    // options is an Object with the following structure: {<nameOfXhrPropOrFunction> : [<argsForFunction>] OR <newPropertyValue>}
    this.invokeXhr = (options) => {
        for(let func in options) {
            try {
                if(this.xhr[func] && typeof this.xhr[func] === 'function') {
                    options[func].returnValue = this.xhr[func].apply(this.xhr, options[func]);
                } else if(this.xhr[func]) {
                    this.xhr[func] = options[func];
                    // options[func].returnValue = options[func];
                }
            } catch (e) {
                options[func].returnValue = e;
                console.log(e);
            }
        }
        return options;
    };

    this.setSuccessHandler = handleSuccess => successHandler = handleSuccess;
    this.setErrorHandler = handleError => errorHandler = handleError;
    this.setProgressHandler = handleProgres => progressHandler = handleProgress;

    retryHandler = (res) => {
        let backoffTime = 1000 * Math.pow(2, this.retries) + Math.random() * this.jitter;
        this.xhr.open(this.getMethod(), this.getUrl());
        setTimeout(()=> { this.xhr.send(requestBody);
        }, backoffTime);
        this.retries+=1;
    };
    this.setRetryHandler = handleRetry => retryHandler = handleRetry;
    this.getRetryHandler = ()=> retryHandler;
    validationHandler = () => this.url && this.method && this.xhr.status === 0;
    this.setValidationHandler = validationHandler => this.validationHandler = validationHandler;
    validationArgs = [];
    this.setValidationArgs = args => validationArgs = args;
    this.setRequestBody = requestBody => requestBody = requestBody;
    this.getRequestBody = ()=> requestBody;
    isValid = ()=> { return this.validationHandler ? this.validationHandler.call(this, this.validationArgs) : true };
    this.checkDone = ()=> this.xhr.readyState === 4;
    this.checkLoading = () => this.xhr.readyState === 3;
    this.checkReceived = () => this.xhr.readyState === 2;
    this.exec = async function() {
            let valid = await isValid();
            if(!valid) {
                let err = new Error();
                err.name = "ValidationError"
                err.message = "Failed to validate the request"
                return err;
            } 
            if(this.xhr.readyState !== this.xhr.OPENED) this.xhr.open(this.method, this.url);
            if(this.headers) {
                for(let u in requestHeaders) {
                    this.xhr.setRequestHeader(u, requestHeaders[u]);
                }
            }
            if(this.returnPromise) {
                return new Promise((resolve, reject) => {
                    // Either let Dauntless handle resolution and rejection...
                    if(this.autoResolveRejectPromise) {
                        this.setSuccessHandler(resolve);
                        this.setErrorHandler(reject);
                    } else {
                        // ...or implement your own logic for how to handle resolving and rejecting
                        this.resolve = resolve;
                        this.reject = reject;
                    }
                    this.xhr.send(requestBody);
                });
            } else {
                this.xhr.send(requestBody);
            }
        };

	this.xhr.onreadystatechange = e => {
        if(this.checkDone()) {
            var responseHandled = false;
            if(this.successOn.includes(this.xhr.status)) {
                successHandler(this.xhr.responseText, this.xhr.status)
                responseHandled = true
            } else if(this.retryOn.includes(this.xhr.status)) {
                retryHandler(this.xhr.responseText, this.xhr.status)
                responseHandled = true
            } else if(this.errorOn.includes(this.xhr.status) || !responseHandled) {
                console.log("rejected", this.xhr.responseText); 
                errorHandler(this.xhr.responseText, this.xhr.status)
            } 
        } else if(this.checkLoading()) {
            progressHandler && progressHandler(this.xhr.responseText, this.xhr.status, this.xhr)
        }
	};
}

exports.request = exports.client;

exports.rp = (url, options)=> {
    var client = new exports.client(options && options.method ? options.method : 'GET');
    // To do: allow more quick config with options
    client.setUrl(url);
    client.xhr.open(client.getMethod(), client.getUrl());

    if(options) {
        if(options.headers) {
            for(let u in options.headers) {
                client.setRequestHeader(u, options.headers[u]);
            }
        }

        // 
        if(options.body) client.setRequestBody(options.body);
        if(options.validationHandler) client.setValidationHandler(options.validationHandler);
    }
    return client.exec();
}