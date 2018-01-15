angular.module("dpApi", [])


.provider('dpApi', [


	function(){

		var backend_url = ''

		this.setUrl = function(url){
			backend_url = url
		}

		this.$get = [
			'$http',

			function($http){
				
				this.saveLink = function(link){
					return 	$http.post(backend_url+'/links', link)
							.then(
								function(result){ return result.data },
								function(result){ return Promise.reject(result.data) }
							)
				}

				this.updateLink = function(link){
					return 	$http.put(backend_url+'/links/'+link.id, link)
							.then(
								function(result){ return result.data },
								function(result){ return Promise.reject(result.data) }
							)
				}

				this.getLink = function(id){
					return 	$http.get(backend_url+'/links/'+id)
							.then(
								function(result){ return result.data },
								function(result){ return Promise.reject(result.data) }
							)
				}

				this.removeLink = function(id){
					return 	$http.delete(backend_url+'/links/'+id)
							.then(
									result => result ? result.data : {},
									result => result ? Promise.reject(result.data) : Promise.reject(result)
							)
				}

				this.getLinks = function(){
					return	$http.get(backend_url+'/links')
							.then(function(result){ return result ? result.data : []})
				}


				this.getAdapters = function(){
					return 	$http.get(backend_url+'/adapters')
							.then( function(result){ return result.data })
				}

				this.getAdapter = function(adapter_id){
					return 	$http.get(backend_url+'/adapters/'+adapter_id)
							.then(function(result){ return result ? result.data : {}})
				}


				this.getEndpoints = function(adapter_id){
					return 	$http.get(backend_url+'/adapters/'+adapter_id+'/endpoints')
							.then(function(result){ return result ? result.data : [] })
				}

				
				this.validateEndpoint = function(adapter_id, endpoint){
					return	$http.post(backend_url+'/validateEndpoint', endpoint)
				}


				this.guess = function(adapter_id, str){
					return	$http.get(backend_url+'/adapters/'+adapter_id+'/guessEndpoint/'+encodeURIComponent(str))
							.then( result => result.data)
				}
			}
		]
	}
])