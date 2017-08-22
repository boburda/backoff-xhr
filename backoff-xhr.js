function BackoffXhr(method, successHandler, errorHandler) {
	this.xhr = new XMLHttpRequest();
	this.url = null;
	this.method = method;

	this.setURL = (url) => this.url = url;
	this.setUrl = this.setURL;
	this.getURL = () => {return this.url};
	this.getUrl = this.getURL;
	this.successHandler = successHandler;
	this.failureHandle = failureHandler;
	this.exec = async function() => {
		// Auth.isValid returns promise
		// resolve instantly to true if expire time > current time
		// or request a new token, store that token, and resolve to true
		if(this.url === null) return null;
			let validAuth = await Auth.isValid();
			this.xhr.open(this.method, this.url);
			this.xhr.send();
		};
	this.xhr.onreadystatechange = e => {
		if(this.xhr.readyState === 4) {
			if(this.xhr.status === 200 || this.xhr.status === 304) {
				var resp = JSON.parse(this.xhr.response);
				this.successHandler(resp);
			} else if(this.xhr.status >= 500) {
        	    fallback = (fallback === 0 ? 1 : fallback * 2);
        	    this.setURL(this.url);
        		setTimeout(()=> { this.xhr.send();
        		}, (1000 * (fallback)));
			} else if(this.xhr.status >= 400 && this.xhr.status < 500) {
				func(res)
			}
		}
	};
}
// 
// function pbXhr(method) {
// 	this.bxhr = new BackoffXhr(method);
// 	this.setUrl = (url) => this.bxhr.setUrl(url);
// 	this.getUrl = (url) => this.bxhr.getUrl(url);
// 	this.exec = () => {
// 			return new Promise((resolve, reject) => {
// 			this.bxhr.successHandler = resolve;
// 			this.bxhr.errorHandler = reject;
// 			this.bxhr.exec();
// 		});
// 	}
// }
