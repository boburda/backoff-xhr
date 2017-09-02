XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

/**
 * Dauntless
 * @module dauntless
 */

/**
 * Dauntless client instance.
 * @class 
 * @param {string} [method] - <p>An HTTP method (POST, GET, PUT, PATCH, DELETE, etc).</p>
 * 
 * <p><em>Optional</em> - If method evaluates to false (null, undefined, etc.), dauntless will default to 'GET'.</p>
 * @param {successHandler} [handleSuccess] - <p>The {@link module:dauntless.client#successHandler|successHandler} for this request.</p> 
 * 
 * <p><em>Optional</em> - If no  {@link module:dauntless.client~successHandler|successHandler} and no  {@link module:dauntless.client~errorHandler|errorHandler} are supplied, dauntless will default to returning a Promise that uses the Promise's .resolve method instead of a  {@link module:dauntless.client~successHandler|successHandler}.</p>
 * @param {errorHandler} [handleError] - <p>The  {@link module:dauntless.client~errorHandler|errorHandler} for this request.</p>
 * 
 * <p><em>Optional</em> - If no {@link module:dauntless.client~successHandler|successHandler} and no {@link module:dauntless.client~errorHandler|errorHandler} are supplied, dauntless will default to returning a Promise that uses the Promise's .reject method instead of a  {@link module:dauntless.client~errorHandler|errorHandler}.</p>
 */
exports.client = function(method, handleSuccess, handleError) {
    this.xhr = new XMLHttpRequest();
    this.url = null;
    /** Range of response codes on which to call {@link module:dauntless.client~successHandler|successHandler}.
     * @type {number[]}
     * @access public */
    this.successOn = [];
    /** Range of response codes on which to call {@link module:dauntless.client~retryHandler|retryHandler}.
     * @type {number[]}
     * @access public */
    this.retryOn = [];
    /** Range of response codes on which to call {@link module:dauntless.client~errorHandler|errorHandler}.
     * @type {number[]}
     * @access public */
    this.errorOn = [];
    this.method = method ? method : 'GET';
    this.retries = 0;
    this.maxRetries = 4;
    var requestBody = undefined;
    this.jitter = 100;
    /** 
     * <p>Called when the request response is successful. Always called with the client instance as the 'this' context.</p>
     * 
     * @function
     * @access protected 
     * @param {string} responseText - The responseText from the request
     * @param {number} responseCode - The HTTP response code from the request
     * */
    var successHandler = handleSuccess;
    /** 
     * <p>Called when the request response is a non-transient error. Always called with the client instance as the 'this' context.</p>
     * 
     * @function
     * @access protected 
     * @param {string} responseText - The responseText from the request
     * @param {number} responseCode - The HTTP response code from the request
     * */
    var errorHandler = handleError;
    var progressHandler = undefined;
    // if you don't pass any handlers, default to Promise
    this.returnPromise = (!successHandler && !this.errorHandler);
    this.autoResolveRejectPromise = this.returnPromise;
    this.autoResolve = this.autoResolveRejectPromise;
    this.autoReject = this.autoResolveRejectPromise;
    /** 
     * @function
     * @access public 
     * @param {string} requestUrl
     * */
    this.setUrl = (url) => {this.url = url; return this;}
    /** 
     * @function
     * @access public 
     * @returns {string}
     * */
    this.getUrl = () => this.url;
    // get/set for method
    this.setMethod = method => this.method = method;
    this.getMethod = ()=> this.method;
    var requestHeaders = {};
    this.setRequestHeader = (headerName, headerValue) => requestHeaders[headerName] = headerValue;
    this.setHeader = this.setRequestHeader;
    this.setHeaders = function(headersObj) {
        for(let u in headersObj) {
            this.setHeader(u, headersObj[u]);
        }
    }
    /** 
     * Empties an array, then calls addToRange
     * @function
     * @access public 
     * @param {number} startOfRange
     * @param {number} endOfRange
     * @param {number[]} rangeToSet
     * */
    this.setRange = (start, end, arr) => {
        arr.splice(0, arr.length);
        this.addToRange(start, end, arr);
    }
    /** 
     * Adds numbers between the startOfRange and endOfRange (inclusive) to rangeToSet
     * @function
     * @access public 
     * @param {number} startOfRange
     * @param {number} endOfRange
     * @param {number[]} rangeToSet
     * */
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
    this.getSuccessHandler = ()=> successHandler;
    /**
     * @access public
     * @function
     * @param {successHandler} handler - the {@link module:dauntless.client~successHandler|successHandler} to use with this client instance.
     */
    this.setSuccessHandler = handler => successHandler = handler;    
    /** 
     * @function
     * @access public 
     * @param {errorHandler} handler - the {@link module:dauntless.client~errorHandler|errorHandler} to use with this client instance.
     */
    this.setErrorHandler = handler => errorHandler = handler;
    this.setProgressHandler = handleProgress => progressHandler = handleProgress;

    retryHandler = (res) => {
        let backoffTime = 1000 * Math.pow(2, this.retries) + Math.random() * this.jitter;
        this.xhr.open(this.getMethod(), this.getUrl());
        setTimeout(()=> { this.xhr.send(requestBody);
        }, backoffTime);
        this.retries+=1;
    };
    this.setRetryHandler = handleRetry => retryHandler = handleRetry;
    this.getRetryHandler = ()=> retryHandler;
    /** 
     * <p>Checks to see if the request is valid before the request is sent.</p>
     * 
     * @function
     * @access protected 
     * @returns {boolean} Whether the request is valid
     * */
    var validationHandler = function() { return this.url && this.method && this.xhr.status <= 1 };
    /**
     * @access public
     * @param {validationHandler} handler - the {@link module:dauntless.client~validationHandler|validationHandler} to use with this client instance.
     */
    this.setValidationHandler = handler => validationHandler = handler;
    var validationArgs = [];
    this.setValidationArgs = args => validationArgs = args;
    this.setRequestBody = requestBody => requestBody = requestBody;
    this.getRequestBody = ()=> requestBody;
    var isValid = () => validationHandler ? validationHandler.call(this, this.validationArgs) : true;
    this.checkDone = ()=> this.xhr.readyState === 4;
    this.checkLoading = () => this.xhr.readyState === 3;
    this.checkReceived = () => this.xhr.readyState === 2;
    /** 
     * <p>Checks to see if the request is valid (via {@link module:dauntless.client~validationHandler|validationHandler}), then opens and sends the request.</p>
     * 
     * @function
     * @access public 
     * @returns {Promise|Error|Boolean} Will return an Error if there's an error before the request is run. Otherwise, returns a Promise or true (depending on returnPromise's value).
     * */
    this.exec = async function() {
        let err = undefined;
        let unsetHandler = !validationHandler || !retryHandler || /* !progressHandler || */ (this.returnPromise && ((!this.autoResolve && !successHandler) || (!this.autoReject && !errorHandler)));
        if(unsetHandler) {
            err =  new Error();
            err.name = "UnsetHandlerError";
            err.message = "Necessary handlers aren't correctly set";
            console.log(err);
            return err;
        }
            let valid = await isValid();
            if(!valid) {
                err =  new Error();
                err.name = "ValidationError"
                err.message = "Failed to validate the request"
                console.log(err);
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
                    
                    this.resolve = resolve;
                    this.reject = reject;

                    this.xhr.send(requestBody);
                });
            } else {
                this.xhr.send(requestBody);
                return true;
            }
        };

    /** 
     * Stores httpMethod and requestUrl, then opens an XHR request. To actually send the request, use {@link module:dauntless.client~exec|.exec} or  {@link module:dauntless.client~send|.send}
     * @function
     * @access public 
     * @param {string} httpMethod - The method of the request ('GET/PUT/HEAD/DELETE/etc')
     * @param {string} requestUrl - The URL for the request
     * */
    this.open = function(method, url) {
        this.setMethod(method);
        this.setUrl(url);
        this.xhr.abort();
        this.xhr.open(this.method, this.url);
    }
    /** 
     * Stores httpMethod and requestUrl, then opens an XHR request. To actually send the request, use {@link module:dauntless.client~exec|.exec} or  {@link module:dauntless.client~send|.send}
     * @function
     * @access public 
     * @param {string} [requestBody] - Any valid request body
     * */
    this.send = async function(body) { body && this.setRequestBody(body); this.exec(); };
    
	this.xhr.onreadystatechange = e => {
        if(this.checkDone()) {
            var responseHandled = false;
            if(this.successOn.includes(this.xhr.status)) {
                this.autoResolve ? this.resolve(this.xhr.responseText) : successHandler.call(this, this.xhr.responseText, this.xhr.status)
                responseHandled = true;
            } else if(this.retryOn.includes(this.xhr.status)) {
                retryHandler.call(this, this.xhr.responseText, this.xhr.status)
                responseHandled = true;
            } else if(this.errorOn.includes(this.xhr.status) || !responseHandled) {
                console.log("rejected", this.xhr.responseText); 
                this.autoReject ? this.reject(this.xhr.responseText) : errorHandler.call(this, this.xhr.responseText, this.xhr.status)
            } 
        } else if(this.checkLoading()) {
            progressHandler && progressHandler.call(this, this.xhr.responseText, this.xhr.status, this.xhr)
        }
	};
}

exports.request = exports.client;

/** 
 * <p>Simple, request-promise like structure with Dauntless features.</p>
 * 
 * @function
 * @access public 
 * @param {string} requestUrl - The URL for the request
 * @param {rpOptions} options - Additional options to set before starting the request.
 * @returns {Promise}
 * */
exports.rp = (url, options)=> {
    var client = new exports.request(options && options.method ? options.method : 'GET');
    // To do: allow more quick config with options
    client.setUrl(url);
    client.xhr.open(client.getMethod(), client.getUrl());

    if(options) {
        /**
        * @typedef {Object} rpOptions - Options related to the request
        * @property {string} body - Any valid request body
        * @property {Object} headers - <p>Object enumerating headerName and headerValue as key-value pairs.</p>
        * @property {function} validationHandler - See {@link module:dauntless.client~validationHandler|validationHandler} for documentation.
        * @property {function} successHandler - See {@link module:dauntless.client~successHandler|successHandler} for documentation.
        * @property {function} errorHandler - See {@link module:dauntless.client~errorHandler|errorHandler} for documentation.
        * @property {function} retryHandler - See {@link module:dauntless.client~retryHandler|retryHandler} for documentation.
        * @property {boolean} autoResolve - See {@link module:dauntless.client~autoResolve|autoResolve} for documentation.
        * @property {boolean} autoReject - See {@link module:dauntless.client~autoReject|autoReject} for documentation.
        * @property {number[]} successOn - See {@link module:dauntless.client~successOn|successOn} for documentation.
        * @property {number[]} errorOn - See {@link module:dauntless.client~errorOn|errorOn} for documentation.
        * @property {number[]} retryOn - See {@link module:dauntless.client~retryOn|retryOn} for documentation.
        */
        if(options.headers) {
            for(let u in options.headers) {
                client.setRequestHeader(u, options.headers[u]);
            }
        }
        if(options.body) client.setRequestBody(options.body);
        if(options.validationHandler) client.setValidationHandler(options.validationHandler);
        if(options.successHandler) client.setSuccessHandler(options.successHandler);
        if(options.errorHandler) client.setErrorHandler(options.errorHandler);
        if(options.retryHandler) client.setRetryHandler(options.retryHandler);
        if(options.autoResolve) client.autoResolve = options.autoResolve;
        if(options.autoReject) client.autoReject = options.autoReject;
        if(options.successOn) client.successOn = options.successOn;
        if(options.errorOn) client.errorOn = options.errorOn;
        if(options.retryOn) client.retryOn = options.retryOn;
    }
    return client.exec();
}