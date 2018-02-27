	'use strict'

var backend_url = dp_config.backendUrl

			angular.module("docloop", [
				'dpApi',
				'dpServices',
				'dpDirectives',
			])
			.config(function ($httpProvider) {
				$httpProvider.defaults.withCredentials = true;
			})

			.config(function(dpApiProvider){
				dpApiProvider.setUrl(backend_url)
			})
			
			.run([
				'$rootScope',
				'dp',

				function($rootScope, dp){
					$rootScope.dp = dp
				}
			])

			.run([
				"$rootScope",

				function($rootScope){

				}

			])