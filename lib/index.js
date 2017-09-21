// XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['xmlhttprequest'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('xmlhttprequest').XMLHttpRequest);
    } else {
        // Browser globals (root is window)
        root.dauntless = factory(root.XMLHttpRequest);
    }
}(this, function (XMLHttpRequest) {
    var DEBUG = false;
    var config = {
        setDebug: (shouldDebug) => { DEBUG = shouldDebug; },
        getDebug: () => DEBUG
    }
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
    var client = function (method, handleSuccess, handleError) {
        var xhr = new XMLHttpRequest();
        var url = null;
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
        var backoffStep = 1000;
        this.setBackoffStep = stepSize => { return backoffStep = stepSize }
        this.setParams = inParams => { inParams ? Object.assign(params, inParams) : {} };
        var requestBody = undefined;
        var params = {};
        var jitter = 100;
        this.setJitter = (inJitter) => { jitter = inJitter }
        this.getJitter = () => jitter
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
        this.setUrl = (inUrl) => { url = inUrl; }
        /** 
         * @function
         * @access public 
         * @returns {string}
         * */
        this.getUrl = () => url;
        // get/set for method
        this.setMethod = method => this.method = method;
        this.getMethod = () => this.method;
        this.getStatus = () => xhr.status
        var requestHeaders = {};
        var retried = false;
        this.setRequestHeader = (headerName, headerValue) => requestHeaders[headerName] = headerValue;
        this.setHeader = this.setRequestHeader;
        this.setHeaders = function (headersObj) {
            for (let u in headersObj) {
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
            for (let x = start; x <= end; x++) {
                !arr.includes(parseInt(x)) && arr.push(parseInt(x));
            }
        };
        this.setRange(200, 305, this.successOn);
        this.setRange(400, 500, this.errorOn);
        this.setRange(500, 600, this.retryOn);

        // options is an Object with the following structure: {<nameOfXhrPropOrFunction> : [<argsForFunction>] OR <newPropertyValue>}
        this.invokeXhr = (options) => {
            for (let func in options) {
                try {
                    if (xhr[func] && typeof xhr[func] === 'function') {
                        options[func].returnValue = xhr[func].apply(xhr, options[func]);
                    } else if (xhr[func]) {
                        xhr[func] = options[func];
                        // options[func].returnValue = options[func];
                    }
                } catch (e) {
                    options[func].returnValue = e;
                    console.log(e);
                }
            }
            return options;
        };
        this.getSuccessHandler = () => successHandler;
        /**
         * @access public
         * @function
         * @param {successHandler} handler - the {@link module:dauntless.client~successHandler|successHandler} to use with this client instance.
         */
        this.setSuccessHandler = handler => { successHandler = (typeof handler) === "function" ? handler : successHandler };
        /** 
         * @function
         * @access public 
         * @param {errorHandler} handler - the {@link module:dauntless.client~errorHandler|errorHandler} to use with this client instance.
         */
        this.setErrorHandler = handler => { errorHandler = (typeof handler) === "function" ? handler : errorHandler };
        this.setProgressHandler = handler => progressHandler = (typeof handler) === "function" ? handler : progressHandler;

        var retryHandler = function (res) {
            this.retries += 1;
            if (!retried) retried = true;
            if (this.retries < this.maxRetries) {
                let backoffTime = backoffStep * Math.pow(2, this.retries) + Math.random() * this.getJitter();
                this.open(this.getMethod(), this.getUrl());
                setTimeout(() => {
                    this.send(requestBody);
                }, backoffTime);
            } else {
                DEBUG && console.log("Maximum retries reached. Calling error handler...")
                // console.log(typeof this.reject)
                // if(this.autoReject && this.returnPromise) {
                //     console.log("should be calling reject")
                //     let error = new Error();
                //     this.reject(error)
                // } else {

                // }
                this.autoReject && this.returnPromise ? this.reject(xhr.responseText) : errorHandler.call(this, xhr.responseText, xhr.status)
            }
        };
        this.setRetryHandler = handler => retryHandler = (typeof handler) === "function" ? handler : retryHandler;
        this.getRetryHandler = () => retryHandler;
        /** 
         * <p>Checks to see if the request is valid before the request is sent.</p>
         * 
         * @function
         * @access protected 
         * @returns {boolean} Whether the request is valid
         * */
        var validationHandler = function () { return url && this.method && xhr.status <= 1 };
        /**
         * @access public
         * @param {validationHandler} handler - the {@link module:dauntless.client~validationHandler|validationHandler} to use with this client instance.
         */
        this.setValidationHandler = handler => validationHandler = (typeof handler) === "function" ? handler : validationHandler;
        var validationArgs = [];
        this.setValidationArgs = args => validationArgs = args;
        this.setRequestBody = body => {
            if (typeof body === 'object') body = JSON.stringify(body)
            requestBody = body
        };
        this.getRequestBody = () => requestBody;
        var isValid = () => validationHandler ? validationHandler.call(this, this.validationArgs) : true;
        this.checkDone = () => xhr.readyState === 4 && xhr.status > 0;
        this.checkLoading = () => xhr.readyState === 3;
        this.checkReceived = () => xhr.readyState === 2;
        /** 
         * <p>Checks to see if the request is valid (via {@link module:dauntless.client~validationHandler|validationHandler}), then opens and sends the request.</p>
         * 
         * @function
         * @access public 
         * @returns {Promise|Error|Boolean} Will return an Error if there's an error before the request is run. Otherwise, returns a Promise or true (depending on returnPromise's value).
         * */
        this.exec = async function () {
            let err = undefined;
            let unsetHandler = !validationHandler || !retryHandler || (this.returnPromise && ((!this.autoResolve && !successHandler) || (!this.autoReject && !errorHandler)));
            if (unsetHandler) {
                err = new Error();
                err.name = "UnsetHandlerError";
                err.message = "Necessary handlers aren't correctly set";
                DEBUG && console.log(err);
                return err;
            }
            let valid = await isValid();
            if (!valid) {
                err = new Error();
                err.name = "ValidationError"
                err.message = "Failed to validate the request"
                DEBUG && console.log(err);
                return err;
            }
            if (xhr.readyState !== xhr.OPENED) this.open(this.method, url);
            for (let u in requestHeaders) {
                xhr.setRequestHeader(u, requestHeaders[u]);
            }
            if (this.returnPromise && !retried) {
                return new Promise((resolve, reject) => {

                    this.resolve = resolve;
                    this.reject = reject;

                    xhr.send(requestBody);
                });
            } else {

                xhr.send(requestBody);
                return true;
            }
        };

        var buildUrl = function (inUrl) {
            let builtParams = '';
            let paramSymbol = '&';
            for (let u in params) {
                builtParams += `${paramSymbol}${u}=${params[u]}`
                if (paramSymbol === '&') paramSymbol = '?'
            }
            return `${inUrl ? inUrl : url}${builtParams}`
        };
        /** 
         * Stores httpMethod and requestUrl, then opens an XHR request. To actually send the request, use {@link module:dauntless.client~exec|.exec} or  {@link module:dauntless.client~send|.send}
         * @function
         * @access public 
         * @param {string} httpMethod - The method of the request ('GET/PUT/HEAD/DELETE/etc')
         * @param {string} requestUrl - The URL for the request
         * */
        this.open = function (method, url) {
            this.setMethod(method);
            this.setUrl(url);
            xhr.abort();
            xhr.open(this.method, buildUrl());
        }
        /** 
         * Stores httpMethod and requestUrl, then opens an XHR request. To actually send the request, use {@link module:dauntless.client~exec|.exec} or  {@link module:dauntless.client~send|.send}
         * @function
         * @access public 
         * @param {string} [requestBody] - Any valid request body
         * */
        this.send = async function (body) { body && this.setRequestBody(body); return this.exec(); };

        xhr.onreadystatechange = e => {
            if (this.checkDone()) {
                var responseHandled = false;

                if (this.successOn.includes(xhr.status)) {
                    DEBUG && console.log(`Detected success with status code ${xhr.status}. Calling success handler...`)
                    // console.log(this.autoResolve, this.resolve)
                    // if(this.autoResolve) {
                    //     this.resolve(xhr.responseText)
                    // } else {
                    //     successHandler.call(this, xhr.responseText, xhr.status)
                    // }
                    this.autoResolve && this.returnPromise ? this.resolve(xhr.responseText) : successHandler.call(this, xhr.responseText, xhr.status)
                    responseHandled = true;
                } else if (this.retryOn.includes(xhr.status)) {
                    DEBUG && console.log(`Detected transient error with status code ${xhr.status}.  Calling retry handler...`)
                    retryHandler.call(this, xhr.responseText, xhr.status)
                    responseHandled = true;
                } else if (this.errorOn.includes(xhr.status) || !responseHandled) {
                    DEBUG && console.log(`Detected permanent error with status code ${xhr.status}.  Calling error handler...`)
                    this.autoReject && this.returnPromise ? this.reject(xhr.responseText) : errorHandler.call(this, xhr.responseText, xhr.status)
                }
            } else if (this.checkLoading()) {
                progressHandler && progressHandler.call(this, xhr.responseText, xhr.status, xhr)
            }
        };
    }

    var request = client;
    var rp = (url, options) => {
        let client = new request();
        // To do: allow more quick config with options

        if (options) {
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
            if (options.headers) {
                for (let u in options.headers) {
                    client.setRequestHeader(u, options.headers[u]);
                }
            }
            if (options.body) client.setRequestBody(options.body);
            if (options.validationHandler) client.setValidationHandler(options.validationHandler);
            if (options.successHandler) client.setSuccessHandler(options.successHandler);
            if (options.errorHandler) client.setErrorHandler(options.errorHandler);
            if (options.retryHandler) client.setRetryHandler(options.retryHandler);
            if (typeof options.autoResolve === "boolean") client.autoResolve = options.autoResolve;
            if (typeof options.autoReject === "boolean") client.autoReject = options.autoReject;
            if (typeof options.returnPromise === "boolean") client.returnPromise = options.returnPromise;
            if (typeof options.backoffStep === "number") client.setBackoffStep(options.backoffStep);
            if (options.successOn) client.successOn = options.successOn;
            if (options.errorOn) client.errorOn = options.errorOn;
            if (options.retryOn) client.retryOn = options.retryOn;
            if (options.params) client.setParams(options.params);
            if (options.jitter) client.setJitter(options.jitter);
        }
        client.open(options && options.method ? options.method : 'GET', url);
        return client.exec();
    }

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return {
        config: config,
        client: client,
        rp: rp
    };
}));