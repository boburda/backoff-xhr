## dauntless.client
#### new dauntless.client([method], [handleSuccess], [handleError])
Dauntless client instance.


| Param | Type | Description |
| --- | --- | --- |
| [method] | <code>string</code> | <p>An HTTP method (POST, GET, PUT, PATCH, DELETE, etc).</p> <p><em>Optional</em> - If method evaluates to false (null, undefined, etc.), dauntless will default to 'GET'.</p> |
| [handleSuccess] | <code>successHandler</code> | <p>The [successHandler](module:dauntless.client#successHandler) for this request.</p>  <p><em>Optional</em> - If no  [successHandler](#module_dauntless.client..successHandler) and no  [errorHandler](#module_dauntless.client..errorHandler) are supplied, dauntless will default to returning a Promise that uses the Promise's .resolve method instead of a  [successHandler](#module_dauntless.client..successHandler).</p> |
| [handleError] | <code>errorHandler</code> | <p>The  [errorHandler](#module_dauntless.client..errorHandler) for this request.</p> <p><em>Optional</em> - If no [successHandler](#module_dauntless.client..successHandler) and no [errorHandler](#module_dauntless.client..errorHandler) are supplied, dauntless will default to returning a Promise that uses the Promise's .reject method instead of a  [errorHandler](#module_dauntless.client..errorHandler).</p> |

<a name="module_dauntless.client+successOn"></a>

#### client.successOn : <code>Array.&lt;number&gt;</code>
Range of response codes on which to call [successHandler](#module_dauntless.client..successHandler).

**Kind**: instance property of [<code>client</code>](#module_dauntless.client)  
**Access**: public  
<a name="module_dauntless.client+retryOn"></a>

#### client.retryOn : <code>Array.&lt;number&gt;</code>
Range of response codes on which to call [retryHandler](module:dauntless.client.retryHandler).

**Kind**: instance property of [<code>client</code>](#module_dauntless.client)  
**Access**: public  
<a name="module_dauntless.client+errorOn"></a>

#### client.errorOn : <code>Array.&lt;number&gt;</code>
Range of response codes on which to call [errorHandler](#module_dauntless.client..errorHandler).

**Kind**: instance property of [<code>client</code>](#module_dauntless.client)  
**Access**: public  
<a name="module_dauntless.client+setUrl"></a>

#### client.setUrl(requestUrl)
**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type |
| --- | --- |
| requestUrl | <code>string</code> | 

<a name="module_dauntless.client+getUrl"></a>

#### client.getUrl() ⇒ <code>string</code>
**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  
<a name="module_dauntless.client+setRange"></a>

#### client.setRange(startOfRange, endOfRange, rangeToSet)
Empties an array, then calls addToRange

**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type |
| --- | --- |
| startOfRange | <code>number</code> | 
| endOfRange | <code>number</code> | 
| rangeToSet | <code>Array.&lt;number&gt;</code> | 

<a name="module_dauntless.client+addToRange"></a>

#### client.addToRange(startOfRange, endOfRange, rangeToSet)
Adds numbers between the startOfRange and endOfRange (inclusive) to rangeToSet

**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type |
| --- | --- |
| startOfRange | <code>number</code> | 
| endOfRange | <code>number</code> | 
| rangeToSet | <code>Array.&lt;number&gt;</code> | 

<a name="module_dauntless.client+setSuccessHandler"></a>

#### client.setSuccessHandler(handler)
**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>successHandler</code> | the [successHandler](#module_dauntless.client..successHandler) to use with this client instance. |

<a name="module_dauntless.client+setErrorHandler"></a>

#### client.setErrorHandler(handler)
**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>errorHandler</code> | the [errorHandler](#module_dauntless.client..errorHandler) to use with this client instance. |

<a name="module_dauntless.client+setValidationHandler"></a>

#### client.setValidationHandler(handler)
**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>validationHandler</code> | the [validationHandler](#module_dauntless.client..validationHandler) to use with this client instance. |

<a name="module_dauntless.client+exec"></a>

#### client.exec() ⇒ <code>Promise</code> \| <code>Error</code> \| <code>Boolean</code>
<p>Checks to see if the request is valid (via [validationHandler](#module_dauntless.client..validationHandler)), then opens and sends the request.</p>

**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Returns**: <code>Promise</code> \| <code>Error</code> \| <code>Boolean</code> - Will return an Error if there's an error before the request is run. Otherwise, returns a Promise or true (depending on returnPromise's value).  
**Access**: public  
<a name="module_dauntless.client+open"></a>

#### client.open(httpMethod, requestUrl)
Stores httpMethod and requestUrl, then opens an XHR request. To actually send the request, use [.exec](module:dauntless.client.exec) or  [.send](module:dauntless.client.send)

**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| httpMethod | <code>string</code> | The method of the request ('GET/PUT/HEAD/DELETE/etc') |
| requestUrl | <code>string</code> | The URL for the request |

<a name="module_dauntless.client+send"></a>

#### client.send([requestBody])
Stores httpMethod and requestUrl, then opens an XHR request. To actually send the request, use [.exec](module:dauntless.client.exec) or  [.send](module:dauntless.client.send)

**Kind**: instance method of [<code>client</code>](#module_dauntless.client)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| [requestBody] | <code>string</code> | Any valid request body |

<a name="module_dauntless.client..successHandler"></a>

#### client.successHandler(responseText, responseCode)
<p>Called when the request response is successful. Always called with the client instance as the 'this' context.</p>

**Kind**: inner method of [<code>client</code>](#module_dauntless.client)  
**Access**: protected  

| Param | Type | Description |
| --- | --- | --- |
| responseText | <code>string</code> | The responseText from the request |
| responseCode | <code>number</code> | The HTTP response code from the request |

<a name="module_dauntless.client..errorHandler"></a>

#### client.errorHandler(responseText, responseCode)
<p>Called when the request response is a non-transient error. Always called with the client instance as the 'this' context.</p>

**Kind**: inner method of [<code>client</code>](#module_dauntless.client)  
**Access**: protected  

| Param | Type | Description |
| --- | --- | --- |
| responseText | <code>string</code> | The responseText from the request |
| responseCode | <code>number</code> | The HTTP response code from the request |

<a name="module_dauntless.client..validationHandler"></a>

#### client.validationHandler() ⇒ <code>boolean</code>
<p>Checks to see if the request is valid before the request is sent.</p>

**Kind**: inner method of [<code>client</code>](#module_dauntless.client)  
**Returns**: <code>boolean</code> - Whether the request is valid  
**Access**: protected  
<a name="module_dauntless.rp"></a>

### dauntless.rp(requestUrl, options) ⇒ <code>Promise</code>
<p>Simple, request-promise like structure with Dauntless features.</p>

**Kind**: static method of [<code>dauntless</code>](#module_dauntless)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| requestUrl | <code>string</code> | The URL for the request |
| options | <code>rpOptions</code> | Additional options to set before starting the request. |

<a name="module_dauntless..rpOptions"></a>


You may set the following as part of an **rpOptions** object:

| Name | Type | Description |
| --- | --- | --- |
| body | <code>string</code> | Any valid request body |
| headers | <code>Object</code> | <p>Object enumerating headerName and headerValue as key-value pairs.</p> |
| validationHandler | <code>function</code> | See [validationHandler](#module_dauntless.client..validationHandler) for documentation. |
| successHandler | <code>function</code> | See [successHandler](#module_dauntless.client..successHandler) for documentation. |
| errorHandler | <code>function</code> | See [errorHandler](#module_dauntless.client..errorHandler) for documentation. |
| retryHandler | <code>function</code> | See [retryHandler](module:dauntless.client.retryHandler) for documentation. |
| autoResolve | <code>boolean</code> | See [autoResolve](module:dauntless.client.autoResolve) for documentation. |
| autoReject | <code>boolean</code> | See [autoReject](module:dauntless.client.autoReject) for documentation. |
| successOn | <code>Array.&lt;number&gt;</code> | See [successOn](module:dauntless.client.successOn) for documentation. |
| errorOn | <code>Array.&lt;number&gt;</code> | See [errorOn](module:dauntless.client.errorOn) for documentation. |
| retryOn | <code>Array.&lt;number&gt;</code> | See [retryOn](module:dauntless.client.retryOn) for documentation. |