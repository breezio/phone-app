angular.module('neo.base', ['ngResource'])
    .factory('Config', function() {
        var config = {
          baseUrl: 'http://192.168.2.108:8080',
            version: '1.0.0'
        };

        if (window.cordova)
            config.baseUrl = 'http://192.168.2.108:8080';

        config.apiUrl = config.baseUrl + '/api/1';

        return config;
    })

    .filter('staticurl', function(Config) {
      return function(input) {
        return Config.baseUrl + input;
      };
    })

    .factory('Resource', function ($resource, Config) {
        return function ( url, params, methods ) {

    		defaults = {
    			query: {
    				isArray: true,
    				cache: true,
    				transformResponse: function(data) {
	    				data = angular.fromJson(data);
	    				if (data) {
	    					return data.items || data;
	    				}
	    				return [];
	    			}
    			},
                get: {
                    cache: true
                }
    		};

            defaults.queryFresh = angular.copy(defaults.query);
            defaults.queryFresh.cache = false;

            defaults.getFresh = angular.copy(defaults.query);
            defaults.getFresh.cache = false;


    		url = Config.apiUrl + url;
			methods = angular.extend( defaults, methods );

			var resource = $resource( url, params, methods );

			return resource;
    	}

    });
