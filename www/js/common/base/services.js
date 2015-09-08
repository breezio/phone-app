angular.module('neo.base', ['ngResource'])
    .factory('Config', function() {
      var config = {
          baseUrl: 'https://testing.breezio.com',
          version: '1.0.0',
        };

      if (window.cordova)
          config.baseUrl = 'https://testing.breezio.com';

      config.apiUrl = config.baseUrl + '/api/1';

      return config;
    })

    .filter('staticurl', function(Config) {
      return function(input) {
        if (input) {
          if (input.split(Config.baseUrl).length > 1) {
            return input;
          } else {
            return Config.baseUrl + input;
          }
        } else {
          return input;
        }
      };
    })

    .factory('Resource', function($resource, Config) {
      return function(url, params, methods) {

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
            },
          },
          get: {
            // TODO: check if disabling caching is okay
            cache: false,
          },
        };

        defaults.queryFresh = angular.copy(defaults.query);
        defaults.queryFresh.cache = false;

        defaults.getFresh = angular.copy(defaults.query);
        defaults.getFresh.cache = false;


        url = Config.apiUrl + url;
        methods = angular.extend(defaults, methods);

        for (var i in methods) {
          var method = methods[i];
          if (method.method != undefined) {
            method.url = Config.apiUrl + method.url;
          }
        }

        var resource = $resource(url, params, methods);

        return resource;
      }

    });
