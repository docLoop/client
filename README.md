# docloopClient

This is a client for [DocloopCore](http://github.com/docloop/core).

In order to make this work, you have to edit app.js and add the link to your app running a [DocloopCore](http://github.com/docloop/core) as backendUrl.
Another way to accomplish the same is to create config.js in the SRC-directory with the following content:

```javascript
window.dp_config = {
	backendUrl:	'http://127.0.0.1:7777' //or wherever your core runs
}

```
