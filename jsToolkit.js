/*!
 * @author Jonathon Hibbard
 *
 * JSToolkit - A small javascript toolkit object I wrote to help reduce some redudant
 * calls to both javascript and jquery.
 *
 * @requires : jQuery
 */

(function() {
  // Require jQuery
  if(!jQuery || jQuery == 'undefined') {
    console.log("FAILED to find jquery!");
    return;
  }

  // Get a quick reference to the window (primary) object
  var $this = this,
  // default settings for issuing a JSON GET request via jQuery's ajax() method
  JSONRequestDefaults = {
    url: null,
    type: "GET",
    params: {},
    // 5 second timeout...
    timeout: 5000,
    errorReporting: true,
    onError: function(jqXHR, textStatus, errorThrown) {
      throw "An error has occurred while issuing a request to the URL: " + this.url + (!errorThrown || errorThrown.length < 1) ? errorThrown : '';
    },
    onTimeout: function() {
      console.log("The getJSONData request (" + this.url + ") timed out!");
    },
    noResponseReporting: false,
    noResponse: function() {
      throw "A getJSONData request was made but a response was not recieved!'";
    }
  },


  validateURL = function(url) {
    if(!url || typeof url != 'string') {
      throw "ERROR: getJSONData() needs a url!";
    }
  };

  // The main object
  var jsToolkit = function(obj) {
    if(obj instanceof jsToolkit) return obj;
    if(!(this instanceof jsToolkit)) return new jsToolkit(obj);
    this.jsToolkitWrapper = obj;
  };

  $this.jsToolkit = jsToolkit;

  // Used as a single source to find all of our "globals" that may be needing to get passed around..
  jsToolkit.globals = jsToolkit.globals || {};


  // helper to jquery's ajax() for requesting json data with some extra features.
  jQuery.extend(jsToolkit, {

    // Just a helper method for logging to the console.  I think Denny Schimkoski wrote this initially.
    consoleLog: function (msg, obj) {
      if(console && console.log) {
        console.log("%s: %o", msg, obj);
      }
    },

    // Method for applying a callback.  Validates that callback supplied is, indeed, a method.
    // All additional params passed are considered to be params forwarded on to the callback.
    applyCallback: function(obj, callback) {
      obj = obj || this;
      if(jQuery.isFunction(callback)) {
        callback.apply(obj, Array.prototype.slice.call(arguments, 2));
      }
    },

    isValidString: function(value) {
      return (value && value.length && Object.prototype.toString.call(value) == '[object String]' && !(/^\s*$/).test(value));
    },

    isValidInteger: function(value) {
      return (value && !isNaN(value) && Object.prototype.toString.call(value) == '[object Number]' && value != +value);
    },

    dataStore: {
      // Gets all data associated to an element by the supplied keyName
      getByKey: function(obj, keyName) {
        obj = obj || jQuery(window);
        keyName = keyName || null;
        return obj.data(keyName);
      },

      // Stores information via jQuery's data method without worrying about losing it due to scope.
      create: function(obj, options) {
        obj = obj || jQuery(window);

        var elementData = {},
        local_settings = jQuery.extend({ keyName: '', keyData: {}, onKeyExists: 'overwrite'}, options);

        elementData = obj.data(local_settings.keyName);
        if($this.isValidObject(elementData)) {
          switch(local_settings.onKeyExists) {
            case 'overwrite':
              obj.data(local_settings.keyName, local_settings.keyData);
            break;
            case 'push':
              obj.data(local_settings.keyName, elementData.push(local_settings.keyData));
            break;
              obj.data(local_settings.keyName, jQuery.extend(elementData, local_settings.keyData));
            default:
            break;
          }
          return;
        }

        obj.data(local_settings.keyName, local_settings.keyData);
      },

      // Destroys the data in an element identified by key
      remove: function(obj, key) {
        obj = obj || jQuery(window);
        if(key) {
          if(jQuery.isArray(key)) {
            jQuery.each(key, function(indx, keyName) {
              obj.removeData(keyName);
            });
          } else if(typeof key == 'string') {
            obj.removeData(key);
          }
        }
      }
    },

    getJSONData: function(options, responseCallback){
      options = (options && jQuery.isPlainObject(options)) ? options : {};

      var settings = jQuery.extend({}, JSONRequestDefaults, options);
      validateURL(settings.url);

      // We use jQuery jQuery.ajax here since we want timeouts and all sorts of other cool options when requesting a URL for JSON data..
      jQuery.ajax(jQuery.extend({}, {
        dataType: 'json',
        timeout: parseInt(settings.timeout),
        success: function(response) {
          if(!response && !!settings.reportNoResponase === true) {
            settings.onError();
            this.applyCallback(this, responseCallback, false);
          } else {
            this.applyCallback(this, responseCallback, response);
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if(t == 'timeout') {
            settings.onTimeout();
            this.applyCallback(this, responseCallback, false);
          } else {
            if(!!settings.reportError === true) settings.onError(jqXHR,textStatus,errorThrown);
            this.applyCallback(this, responseCallback, false);
          }
        }
      }, settings));
    },

     // @concept author http://www.coderholic.com/javascript-the-good-parts/
     // Get all parts of a URL and return parts as an object.
    getURLParts: function(urlString) {
      if(!urlString || urlString.length < 1) return false;

      var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/,
      url = urlString,
      result = parse_url.exec(url),
      domainTLD = false;

      // If we don't have a valid array or at least the URL portion of our array, return false.
      if(!jQuery.isArray(result) || !result[0] || result[0].length < 1) {
        return false;
      }

      if(result[3].length > 0) {
        domainTLD = result[3].substring(result[3].length - 4);
        if(domainTLD) {
          switch(domainTLD.toLowerCase()) {
            case '.com': case '.net': case '.org':
              domainTLD = true;
            break;
            default:
              domainTLD = false;
            break;
          }
        } else {
          domainTLD = false;
        }
      }
      return {
        url:   result[0],
        schema:(result[1] && result[1].length > 0 ? result[1] : false),
        slash: (result[2] && result[2].length > 0 ? result[2] : false),
        host:  (result[3] && result[3].length > 0 ? result[3] : false),
        port:  (result[4] && result[4].length > 0 ? result[4] : false),
        path:  (result[5] && result[5].length > 0 ? result[5] : false),
        query: (result[6] && result[6].length > 0 ? result[6] : false),
        hash:  (result[7] && result[7].length > 0 ? result[7] : false),
        hasTLD: domainTLD
      };
    }
  });
}).call(this);
