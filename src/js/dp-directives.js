'use strict'

angular.module("dpDirectives", [
	'dpApi'
])

.directive('dpEndpointConfig',[

	'dp',

	function(dp){
		return {
			templateUrl: '	partials/dp-endpoint-config.html',
			scope:			{
								dpType:		'@',
								dpEndpoint:	'<'
							},

			link: function(scope){
				scope.dp 	= dp
				scope.show 	= {}
			}
		}
	}

])

.directive('dpEndpoint',[

	function(){
		return {
			restrict:		"E",
			templateUrl: '	partials/dp-endpoint.html',
			scope:			{
								dpEndpoint:		'<'
							}

		}
	}

])

.directive('dpPanel', [
	'dp',

	function(dp){
		return {
			restrict:		'AE', 
			templateUrl: 	'partials/dp-panel.html',
			transclude:		{
								'dpExtraLine':	'?dpExtraLine'
							},
			scope:			{
								dpTitle:		'@?',
								dpDetails:		'@?',
								dpImage:		'@?',
								dpIconClass:	'@?',
								dpLabel:		'@?'
							},

			link: function(scope, element){
				scope.dp = dp

			},

			controller: function($scope,$transclude) {
				$scope.transcludePresent = function(slot) {
					return $transclude.isSlotFilled(slot);
				}
			}
		}
	}
])

.directive('dpAdapter',[

	'dp',

	function(dp){
		return {
			restrict:		'A', 
			templateUrl: 	'partials/dp-adapter.html',
			scope:			{
								dpAdapter: 	'<',
								dpLabel:	'@'
							},

			link: function(scope){
				scope.dp = dp
			}
		}
	}

])

.directive('dpSelect',[


	function(){

		return {

			scope:	true,

			link: function(scope, element, attrs){


				scope.test ="JJJJ"

				scope.$select = {
					selected:		undefined,
					object:			undefined,
					property:		attrs.dpProperty,
					options:		[],
					active:			false,
					toggle:			function(){},
					open:			function(){},
					close:			function(){},
					select:			function(){}
				}




				scope.$select.toggle = function(toggle){
					if(scope.$select.size == 0)  return scope.$select.active = false

					scope.$select.active 	= 	toggle === undefined
											?	!scope.$select.active
											:	!!toggle
				}

				Object.defineProperty(scope.$select, 'size', {
			 		get: () => element.find('dp-options').children().length 
				})


				scope.$select.open 	= () => scope.$select.toggle(true)
				scope.$select.close = () => scope.$select.toggle(false) 

				scope.$watch('$select.active', () => element.toggleClass('open', scope.$select.active))



				// start click outside: 
				var body	= angular.element(document.getElementsByTagName('body'))
				body.on('click touchstart', click)

				function click(e){
					var c = e.target

					while(c && c != element[0]){ c = c.parentElement }

					if(!c){	
						scope.$select.close()
						scope.$digest()
					}

				}

				var change_to = undefined

				scope.$on('$destroy', function(){
					body.off('click', click)
				})

				//end click outside



				scope.$watch(
					() => scope.$parent[attrs.dpObject],
					() => scope.$select.object = scope.$parent[attrs.dpObject]
				)


				scope.$watch(
					() 		=> 	scope.$select.object[attrs.dpProperty],
					value	=>  scope.$select.selected = value,
					true
				)

				scope.$watch('$select.selected', ()	=> {
					
					scope.$select.object[attrs.dpProperty] = scope.$select.selected

					element.find('dp-selected').addClass('changed')

					clearTimeout(change_to)
					change_to = setTimeout( () => element.find('dp-selected').removeClass('changed'), 800 )

				})


				scope.$watch(
					attrs.dpOptions, 		
					dpOptions 	=> 	{
						scope.$select.options = dpOptions || [] 
					}
					,true //this is important, if removed causes infdg
				) 
			}
		}
	}

])


.directive('dpLink', [

	'dp',

	function(dp){
		return {
			restrict:		'E',
			templateUrl: 	'partials/dp-link.html',
			scope:			{
								dpLink: '<'
							},

			link: function(scope){
				scope.dp = dp
			}

		}
	}
])


.directive('dpTrackChange',[

	'$timeout',

	function($timeout){
		return {
			restrict:	"A",

			link: function(scope, element, attrs){

				var to = undefined

				scope.$watch(attrs.dpTrackChange, () => {
					element.addClass('changed')
					$timeout.cancel(to)
					to = $timeout(800).then( () => element.removeClass('changed'))
				})
			}
		}
	}

])


.directive('dpClickOutside',[
	function(){
		return {
			restrict:	"A",

			link: function(scope, element, attrs){

				var body	= angular.element(document.getElementsByTagName('body'))
				body.on('click touchstart', click)

				function click(e){
					var c = e.target

					while(c && c != element[0]){ c = c.parentElement }

					if(!c){	
						console.log('click outside', attrs.dpClickOutside)
						scope.$eval(attrs.dpClickOutside)
						scope.$digest()
					}

				}

				scope.$on('$destroy', function(){
					body.off('click', click)
				})

			}
		}
	}
])


.filter('isString', [
	function(){
		return function(t){
			return typeof t == 'string'
		}
	}
])

.filter('isBoolean', [
	function(){
		return function(t){
			return typeof t == 'boolean'
		}
	}
])


.filter('dpDecor', [

	'dpAdapters',

	function(dpAdapters){

		var empty = {}

		return function(identifier){
			if(!identifier)			return empty
			if(!identifier.adapter) return empty

			var adapter		=	dpAdapters.get(identifier.adapter) 

			if(!adapter)			return empty

			var endpoint	=	adapter.getEndpoint(identifier)

			if(!endpoint)			return empty

			return endpoint.decor || empty
		}

	}
])


.filter('delayChanges', [

	'$timeout',

	function($timeout){

		var table = {}


		var delayCahnges = function(value, id, delay){

			var now = Date.now()

			table[id] 			= 	table[id] || {}
			table[id][delay]	= 	table[id][delay] || { 
										lastChange:		now, 
										previousValue: 	undefined,
										currentValue:	value,
										to:				undefined
									}


			Object.keys(table[id]).forEach( d => {
				if(!angular.equals(value, table[id][d].currentValue)) {

					table[id][d].lastChange 	= now
					table[id][d].previousValue	= table[id][d].currentValue
					table[id][d].currentValue	= value

					$timeout.cancel(table[id][d].to)

					table[id][d].to = $timeout(d)
				}
			})



			return 	(now - table[id][delay].lastChange > delay)
					?	table[id][delay].currentValue
					:	table[id][delay].previousValue
		}

		delayCahnges.$stateful = true

		return delayCahnges
	}

])

.filter('linkify',[

	'$sce', 

	function($sce){
		return function(str){
			return 	$sce.trustAsHtml(
						str
						.replace(/<[^>]+>/g, '')
						.replace(/(https?:\/\/[^\s]*)/, '<a href="$&">$&</a>')
					)
		}
	}

])


.filter('trustAsHtml',[
	'$sce',

	function($sce){
		return function(html){
			return $sce.trustAsHtml(html)
		}
	}
])

.filter('isEmpty', [
	function(){
		return function(x){
			return !x || Object.keys(x).length == 0
		}
	}
])

.filter('firstWith',[
	function(){
		return function(array, key, value){
			if(!array || !array.filter) return array

			return array.filter(function(item){ return item[key] == value })[0]
		}
	}
])

.filter('equals', [
	function(){
		return function(obj1, obj2){
			return angular.equals(obj1, obj2)
		}
	}
])

.filter('console',[
	function(){
		return x => console.log(x)
	}
])