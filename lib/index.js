var xh = require("xmlhttprequest");

exports.conn = function(method, successHandler, errorHandler) {
    this.xhr = new xh.XMLHttpRequest();
    this.url = null;
    this.acceptOn = [];
    this.retryOn = [];
    this.errorOn = [];
    this.method = method ? method : 'GET';
    this.retries = 0;
    this.maxRetries = 4;
    this.requestBody = undefined;
    this.jitter = 100;
    this.successHandler = successHandler;
    this.errorHandler = errorHandler;
    // if you don't pass any handlers, default to Promise
    this.returnPromise = (!sucessHandler && !errorHandler);
    this.autoResolveRejectPromise = this.returnPromise;
    // get/set for URL
	this.setUrl = (url) => {this.url = url; return this;}
    this.getUrl = () => this.url;
    // get/set for method
    this.setMethod = method => this.method = method;
    this.getMethod = ()=> this.method;
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
    this.setRange(200, 305, this.acceptOn);
    this.setRange(400, 500, this.errorOn);
    this.setRange(500, 600, this.retryOn);

    // quick access so you don't have to do conn.xhr.<propOrFunctionName> and so you can
    // set lots of options with one call
    // options is an Object with the following structure: {<nameOfXhrPropOrFunction> : [<argsForFunction>] OR <newPropertyValue>}
    this.setXhrOptions = (options) => {
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

    this.setSuccessHandler = successHandler => this.sucessHandler = sucessHandler;
    this.setErrorHandler = errorHandler => this.errorHandler = errorHandler;

    this.retryHandler = (res) => {
        let backoffTime = 1000 * Math.pow(2, this.retries) + Math.random() * this.jitter;
        this.xhr.open(this.getMethod(), this.getUrl());
        setTimeout(()=> { this.xhr.send(this.requestBody);
        }, backoffTime);
        this.retries+=1;
    };
    this.setRetryHandler = retryHandler => this.retryHandler = retryHandler;
    this.getRetryHandler = ()=> this.retryHandler;
    this.validationHandler = () => this.url && this.method && this.xhr.status === 0;
    this.setValidationHandler = validationHandler => this.validationHandler = validationHandler;
    this.validationArgs = [];
    this.setValidationArgs = validationArgs => this.validationArgs = validationArgs;
    this.setRequestBody = requestBody => this.requestBody = requestBody;
    this.getRequestBody = ()=> this.requestBody;
    this.isValid = ()=> { return this.validationHandler ? this.validationHandler.call(this, this.validationArgs) : true };
    this.checkDone = ()=> this.xhr.readyState === 4;
    this.checkLoading = () => this.xhr.readyState === 3;
    this.checkReceived = () => this.xhr.readyState === 2;
    this.exec = async function() {
        console.log('await auth')
            let validAuth = await this.isValid();
            console.log("auth valid");
            this.xhr.open(this.method, this.url);
            if(this.returnPromise) {
                return new Promise((resolve, reject) => {
                    // Either let Dauntless handle resolution and rejection...
                    if(this.autoResolveRejectPromise) {
                        this.setSucessHandler(resolve);
                        this.setErrorHandler(reject);
                    } else {
                        // ...or implement your own logic for how to handle resolving and rejecting
                        this.promiseFunctions = {
                            resolve: resolve,
                            reject: reject
                        }
                    }
                    this.xhr.send(this.requestBody);
                });
            } else {
                this.xhr.send(this.requestBody);
            }
        };

	this.xhr.onreadystatechange = e => {
        if(this.checkDone()) {
            var responseHandled = false;
            if(this.acceptOn.includes(this.xhr.status)) { 
                this.successHandler(this.xhr.responseText, this.xhr.status)
                responseHandled = true
            } else if(this.retryOn.includes(this.xhr.status)) {
                this.retryHandler(this.xhr.responseText, this.xhr.status)
                responseHandled = true
            } else if(this.errorOn.includes(this.xhr.status) || !responseHandled) {
                this.errorHandler(this.xhr.responseText, this.xhr.status)
            } 
        } else if(this.checkLoading()) {
            this.progressHandler && this.progressHandler(this.xhr.responseText, this.xhr.status, this.xhr)
        }
	};
}