	'use strict'

var backend_url = dp_config.backendUrl

			angular.module("docloop", [
				'dpApi',
				'dpServices',
				'dpDirectives',
			])
			.config(function ($httpProvider) {
				//$httpProvider.defaults.withCredentials = true;
			})

			.config(function(dpApiProvider){
				dpApiProvider.setUrl('/')
			})
			.controller('adapterCtrl',[

				'$scope',
				'dpAdapters',
				'dpLink',

				function($scope, dpAdapters, dpLink){
					$scope.dpAdapters = dpAdapters.data

					$scope.dpLink = dpLink
				}

			])
			.controller('linkCtrl', [
				'$scope',
				'dpLink',
				'$http',

				function($scope, dpLink, $http){
					$scope.dpLink = dpLink

					$scope.guessPaperhiveSource = function(str){
						var matches 	= 	str.match(/.*paperhive\.org.*\/documents\/([^\/]+)/),
							document_id =	(matches && matches[1]) || str,
							result		= 	{repo:{}, identifier: {} }

						result.repo 		=	{
													name: document_id,
													owner: {login: 'public'}
												}
						result.identifier 	= 	{
													identifier: { 
														adapter:		'paperhive',
														document_id:	document_id
													}
												}

						$http.get('https://paperhive.org/api/documents/'+document_id)
						.then(function(res){
							result.repo.name = res.data.title
						})

						return 	result
					}
				}
			])
			.run([
				'$rootScope',
				'dp',

				function($rootScope, dp){
					$rootScope.dp = dp
				}
			])


			// .controller('linkCtrl', [

			// 	'$scope',
			// 	'dpApi',

			// 	function($scope, dpApi){
			// 		$scope.link = { source: undefined, target: undefined }
			// 		$scope.targets = {}



			// 		$scope.getTargets = function(adapter_id){
			// 			return 	dpApi.getTargets(adapter_id)
			// 					.then(function(result){
			// 						$scope.targets[adapter_id] = result.data
			// 					})
			// 		}

			// 		$scope.getLinks = function(){
			// 			dpApi.getLinks()
			// 			.then(function(links){
			// 				$scope.links = links
			// 			})
			// 		}

			// 		$scope.saveLink = function(){
			// 			console.log($scope.link)
			// 			return 	dpApi.saveLink($scope.link.source, $scope.link.target)
			// 					.then(
			// 						function(result){
			// 							$scope.result = result.data
			// 							$scope.getLinks()
			// 						},
			// 						function(err){
			// 							$scope.result = err.data
			// 						})
			// 		}

			// 		$scope.deleteLink = function(id){
			// 			dpApi.deleteLink(id)
			// 			.then($scope.getLinks)
			// 		}

			// 		$scope.getStats = function(adapter_id){
			// 			$scope.adapters = $scope.adapters || {}
			// 			$scope.adapters[adapter_id] = $scope.adapters[adapter_id] || {}
			// 			$scope.adapters[adapter_id].loading = true

			// 			$scope.adapter
			// 			return  dpApi.getAdapterStats(adapter_id)
			// 					.then(function(stats){
			// 						$scope.adapters[adapter_id] = stats
			// 					})
			// 		}

			// 		$scope.guessPaperhiveDocumentId = function(str){
			// 			var matches = str.match(/https:\/\/paperhive.org\/documents\/([^\/]+)/)

			// 			return 	(matches && matches[1]) || str
			// 		}

			// 		var loginWithgithubInterval

			// 		$scope.loginWithGithub = function(){
			// 			var new_window 	= 	window.open('https://github.com/login/oauth/authorize?scope=read:org&client_id='+$scope.config.clientId, '_blank')

			// 			new_window.focus()

			// 			$scope.adapters = $scope.adapters || {}
			// 			$scope.adapters['github'] = $scope.adapters['github'] || {}
			// 			$scope.adapters['github'].waitingForAuthorization = true

			// 			loginWithgithubInterval	=	window.setInterval(function(){
			// 											try{
			// 												if(new_window.authorizationComplete){
			// 													window.clearInterval(loginWithgithubInterval)
			// 													window.focus()
			// 													new_window.close()
			// 													$scope.getStats('github')
			// 													$scope.getLinks()
			// 												}
			// 											} catch(e) {}
			// 										}, 600)
			// 		}

			// 		$scope.cancelLoginWithGithub = function(){
			// 			window.clearInterval(loginWithgithubInterval)
			// 			$scope.getStats('github')
			// 		}
						
			// 		$scope.getStats('github')
			// 		$scope.getStats('paperhive')

			// 		$scope.getLinks()

			// 		$scope.config = window.dp_config

			// 	}
			// ])

			.run([
				"$rootScope",

				function($rootScope){

				}

			])