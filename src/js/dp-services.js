'use strict'

angular.module("dpServices", [
	'dpApi'
])



.service('dpAdapters',[

	'$timeout',
	'$q',
	'dpApi',
	
	function($timeout, $q, dpApi){

		function dpAdapter(data){
			var self = this,
				endpoint_guesses = []

			for(var key in data){ self[key] = data[key]}

			if(!self.id) throw ReferenceError("dpAdapter missing id")

			self.endpoints 	= []
		
			self.loading = 0

			self.refresh = function(){
				if(self.loading ) return self.ready || $q.reject()

				self.loading += 1
					
				self.ready =	$q.all([
									dpApi.getEndpoints(this.id)
									.then( 		result 	=> 	self.addEndpoints(result) ),

									dpApi.getAdapter(this.id)
									.then( 		result 	=>	{ for(var key in data){ self[key] = result[key]} }),

									$timeout(1000)
								])
								.then( 		() => self.restoreGuesses() )
								.finally( 	() => self.loading --)

				return self.ready
			}

			self.guessing = 0


			self.clearEndpoints = function(){
				while(self.endpoints.length) self.endpoints.pop()
				return self
			}

			self.getEndpoint = function(identifier){
				return 	self.endpoints.filter( endpoint => {
							return angular.equals(endpoint.identifier, identifier)
						})[0]
			}

			self.addEndpoints = function(new_endpoints){
				var duplicates = []

				new_endpoints.forEach( new_endpoint => {
					var duplicate 	= 	self.getEndpoint(new_endpoint.identifier)

					if(duplicate){
						duplicates.push(duplicate)
						duplicate.decor = duplicate.decor || new_endpoint.decor
					} else {
						self.endpoints.push(new_endpoint)
					}
				})

				return	duplicates
			}


			self.storeGuess = function(str){
				if(endpoint_guesses.includes(str) ) return null
				
				endpoint_guesses.push(str)

				sessionStorage.setItem(self.id+'_endpoint_guesses', JSON.stringify(endpoint_guesses))

			}

			self.restoreGuesses = function(){
				endpoint_guesses = JSON.parse(sessionStorage.getItem(self.id+'_endpoint_guesses') || '[]')


				return	$q.all(endpoint_guesses.map( str => {
							return	dpApi.guess(self.id, str)
									.then( result => result && self.addEndpoints([result]) )
									.catch( (e) => console.log(e))
						}))
			}



			self.guess = function(str){

				if(self.guessing) return null

				self.guessing ++
				self.guessFailed 		= false
				self.guessSuccessful 	= false

				return	$q.all([
							dpApi.guess(self.id, str).catch( () => null ),
							$timeout(1000)
						])
						.then( ([result, to]) => {
							if(!result) return $q.reject()

							var duplicate = self.addEndpoints([result])[0]
						
							if(!duplicate)	self.storeGuess(str)

							self.guessSuccessful = true

							return duplicate || result				
						})
						.catch( 	(e) => { console.log(e); self.guessFailed = true } )
						.finally( 	() => self.guessing --)
			}



			return self
		}

		var dpAdapters = []


		dpAdapters.refresh = function(){
			while(dpAdapters.length) dpAdapters.pop()

			dpAdapters.ready = 	dpApi.getAdapters()
								.then(function(adapters){
									adapters.forEach(function(adapter_data){
										var duplicate = dpAdapters.get(adapter_data.id)

										if(duplicate){
											for(key in adapter_data){
												duplicate[key] = adapter_data.key
											}
										} else {
											dpAdapters.push(new dpAdapter(adapter_data))
										}
									})


								})

			return dpAdapters.ready
		}

		dpAdapters.get = function(adapter_id){
			return dpAdapters.filter(adapter => adapter.id == adapter_id)[0]
		}


		dpAdapters.refresh()

		return dpAdapters

	}

])



.service('dpLinks',[

	'$rootScope',
	'$q',
	'$timeout',
	'dpApi',
	'dpAdapters',

	function($rootScope, $q, $timeout, dpApi, dpAdapters){
		var dpLinks = []


		function Endpoint(type, data){

			data = data || {}

			var adapter 	= undefined,
				identifier 	= data.identifier


			var self = {
				type: 		type,
				id:			data.id,
				config:		data.config || {},

				importData(data){
					self.config 	= data.config || {}
					self.identifier = data.identifier
				},

				set adapter(a){
					adapter = a

					if(identifier && adapter && adapter.id != identifier.adapter) identifier = undefined
					if(adapter) adapter.refresh().then( () => self.refreshConfig() )

				},

				get adapter(){
					return adapter						
				},

				set identifier(i){
					identifier = i

					if(!identifier) return null

					if( !adapter || (adapter.id != identifier.adapter) )  self.adapter  = dpAdapters.get(identifier.adapter)

					self.refreshConfig()

				},

				get identifier(){
					return identifier
				},

				refreshConfig(){
					for(var key in adapter.endpointDefaultConfig){
						self.config[key] = 	self.config[key] !== undefined
											?	self.config[key] 
											:	adapter.endpointDefaultConfig[key]	
					} 
				},

				get export(){
					var export_config = {}

					if(adapter) for(var key in adapter.endpointDefaultConfig) {
						export_config[key] = 	self.config[key] !== undefined
												?	self.config[key]
												:	adapter.endpointDefaultConfig[key]
					}

					return {
						id: 		self.id,
						config:		export_config,
						identifier:	self.identifier,
						adapter_id:	self.adapter && self.adapter.id
					}
				},

				guess(str){
					return	adapter.guess(str)
							.then(function(guessed_endpoint){
								if(!guessed_endpoint) return null
								self.identifier = guessed_endpoint.identifier
							})
				},

				get guessing() 			{ return adapter && adapter.guessing },

				get guessFailed() 		{ return adapter && adapter.guessFailed },
				set guessFailed(v) 		{ adapter && (adapter.guessFailed = v) },

				get guessSuccessful() 	{ return adapter && adapter.guessSuccessful },
				set guessSuccessful(v) 	{ adapter && (adapter.guessSuccessful = v) }

			}

			dpAdapters.ready
			.then(function(){
				self.adapter  	= 	dpAdapters.get(data.adapter_id || identifier && identifier.adapter)
				self.identifier =	identifier 
			})

			return self
		}


		function Link(data){

			data = data || {}

			var self = {
				id: 			data.id,
				source: 		new Endpoint('source', data.source),
				target:			new Endpoint('target', data.target),


				savingFailed:	false,
				loadingailed:	false,
				removingFailed:	false,

				saving:			0,
				loading:		0,
				removing:		0,

				get export(){
					return {
						id:		self.id,
						source:	self.source.export,
						target:	self.target.export
					}
				},

				get busy(){
					return self.saving || self.loading || self.removing
				},

				refresh(){
					if(self.loading) return null

					self.loadingFailed = false
					self.loading ++

					$q.all([
						dpApi.getLink(self.id)
						.then(	link_data	=> {
							self.source.importData(link_data.source)
							self.target.importData(link_data.target)	
						})
						.catch( reason  	=> self.loadingFailed = (reason || true)),
						$timeout(1000)
					])
					.finally( () => {
						self.loading --
					})

						
				},


				save(){
					if(self.saving) return null

					self.savingFailed = false
					self.saving ++

					var api_call = 	self.id
									?	dpApi.updateLink
									:	dpApi.saveLink

					$q.all([
						api_call(self.export)
						.then(	link_data	=> self.id = link_data.id )
						.then(	()			=> dpLinks.push(self) )
						.catch( reason  	=> self.savingFailed = (reason || true)),
						$timeout(1000)
					])
					.finally( () => {
						self.saving --
					})
				},


				remove(){
					if(self.removing) return null

					self.removingFailed = false
					self.removing ++

					$q.all([
						dpApi.removeLink(self.id)
						.then( () => {
							dpLinks.active = new Link()
							var pos = dpLinks.indexOf(self)
							if(pos != -1) dpLinks.splice(pos, 1)
						})
						.catch( reason  => self.removingFailed = (reason || true)),
						$timeout(1000)
					])
					.finally( () => {
						self.removing --
					})
				}

			}

			return self
		}


		Object.defineProperty(dpLinks, 'busy', {
			get: () => dpLinks.ready.$$state.status == 0
		})

		dpLinks.refresh = function(){
			dpLinks.ready =	dpAdapters.ready
							.then( dpApi.getLinks )
							.then( links => {				
								dpLinks.clear()

								//addEndpoints

								links.forEach( link_data => {
									dpAdapters
									.get(link_data.source.identifier.adapter)
									.addEndpoints([link_data.source])

									dpAdapters
									.get(link_data.target.identifier.adapter)
									.addEndpoints([link_data.target])
								})

								links = links.map( link_data => new Link(link_data) )

								dpLinks.push(...links)
							})
							.then( () => dpLinks.active || dpLinks.restoreActiveLink() )

			return dpLinks.ready
		}

		dpLinks.get = function(id){
			return 	id
					?	dpLinks.filter( link => link.id == id )[0]
					:	undefined
		}

		dpLinks.clear = function(){
			while(dpLinks.length) dpLinks.pop()
			return dpLinks
		}


		//active Link

		dpLinks.newLink = function(){
			dpLinks.active = new Link()
		}

		dpLinks.restoreActiveLink = function(){
			var link_data 	= undefined

			try 	{ link_data = JSON.parse(sessionStorage.getItem('activeLink')) }
			catch(e){ }
			
			dpLinks.ready
			.then( ()	=>  dpLinks.get(link_data && link_data.id) )
			.then( link	=>	dpLinks.active = link || new Link(link_data) )
		}

		dpLinks.storeActiveLink = function(){
			sessionStorage.setItem('activeLink', dpLinks.active ? JSON.stringify(dpLinks.active.export) : null )
		}


		$rootScope.$watch(
			() => dpLinks.active,
			(current, last) => { 
				if(last) dpLinks.storeActiveLink()
			},
			true
		)

		dpLinks.refresh()

		return dpLinks
	}

])



.service('dp',[

	'$rootScope',
	'dpAdapters',
	'dpLinks',

	function($rootScope, dpAdapters, dpLinks){

		var dp = this

		dp.adapters 	= dpAdapters
		dp.links		= dpLinks

	}



])