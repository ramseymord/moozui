/* 	Class:
		HistoryManager

	Author:
		Neil Jenkins - http://www.nmjenkins.com
		
	Version:
		1.21 (2008-04-02)
		
	Version history:
		1.21 Fix IE quoting bug.
		1.2  Clean up code to make better use of Mootools framework
		1.1  Update to allow IE to keep its history even when navigating to a different site and back.
		1.0  Initial release
		
	License:
		GNU GPL 2.0: http://creativecommons.org/licenses/GPL/2.0/
		
	Description:
		Javascript class for restoring use of the back/forward buttons on web pages that are completely
		dynamic and therefore don't actually navigate to different pages.
		
	Usage:
		Calling new HistoryManager() returns an instance of the History Manager
		e.g. var h = new HistoryManager();

		Public interfaces:

		addState(String: hash)
			This method creates a new history state in the browser (as though a link has been clicked)
			and also sets the location hash to the supplied argument to allow for bookmarking.

			The hash is expected to be a vaild URI hash component; the global function encodeURI() is useful for
			this. Encoding the state of a javascript program into a string is very much specific to each program therefore
			no processing is done by this module; it is left to the subscribing functions to encode and parse the state.
			
			e.g. h.addState('tab3');
		
		addEvent(String: event, Function: callbackFunction)
			This method subscribes functions to be called when the history state changes.
			NB The only event currently available is 'onHistoryChange'.
			   Functions subscribed to this event will be called with the hash of the new state as their argument.
			e.g. h.addEvent('onHistoryChange', functionToCall);
		
		removeEvent(String: event, Function: callbackFunction)
			This method removes functions subscribed to the HistoryManager by the addEvent method		
			e.g. h.removeEvent('onHistoryChange', functionToRemove);

		getCurrentLocation()
			Returns the current hash.
			e.g. var state = h.getCurrentLocation();

	Dependencies:
		mootools: http://mootools.net

	Notes:
		This is a singleton; there can only ever be one instance of the class. Calling new HistoryManger() for a second time
		will simply return a reference to the current instance.
		Supports Gecko, Safari, Opera and IE
*/

var HistoryManager = (function() {

	var HistoryManagerSingleton = new Class({
		
		initialize: function() {
			this._currentLocation = this._getHash();
			
			if (window.ie) {
				this.addState = this._addStateIE;
				this._iframe = new Element('iframe', {
					src: "javascript:'<html></html>'",
					styles: {
						'position': 'absolute',
						'top': '-1000px'
					}
				}).inject(document.body).contentWindow;
				
				$justForIE = function(hash) {
					this._getHash = function() { return hash; }
					this._monitorDefault.call(this);
					location.hash = hash;
				}.bind(this);
				
				var waitForLoad = function waitForIframeLoad() {
					if (this._iframe && this._iframe.document && this._iframe.document.body) {
						if (!this._iframe.document.body.innerHTML)
							this.addState(this._currentLocation, true);
						$clear(waitForLoad);
					}
				}.periodical(50, this);
			}
			else if (window.webkit419) {
				this._form = new Element("form", {method: 'get'}).inject(document.body);
				this._historyCounter = history.length;
				this._stateHistory = [];
				this._stateHistory[history.length] = this._getHash();
				
				this.addState = this._addStateSafari;
				this._monitorSafari.periodical(250, this);
			}
			else if (window.opera && navigator.appVersion.toFloat() < 9.5) {
				this.addState = this._addStateDefault;
	
				$justForOpera =  this._monitorDefault.bind(this);
				new Element('img', {
					src: "javascript:location.href='javascript:$justForOpera();';",
					style: "position: absolute; top: -1000px;"
				}).inject(document.body);
			}
			else {
				this.addState = this._addStateDefault;
				this._monitorDefault.periodical(250, this);
			}
		},
		
		getCurrentLocation: function() {
			return this._currentLocation;
		},
		
		_getHash: function() {
			return location.href.split('#')[1] || '';
		},
		
		_addStateIE: function(hash, override) {
			if (this._currentLocation == hash && !override) return;

			this._currentLocation = hash;
			this._iframe.document.write('<html><body onload="top.$justForIE(\'', hash.replace("'", "\\'") ,'\');">Loaded</body></html>');
			this._iframe.document.close();
		},
		
		_addStateSafari: function(hash) {
			if (this._currentLocation == hash) return;
	
			this._form.setProperty('action', '#' + hash).submit()
			this._currentLocation = hash;
			this._stateHistory[history.length] = this._getHash();
			this._historyCounter = history.length;
		},
	
		_monitorSafari: function() {
			if (history.length != this._historyCounter) {
				this._historyCounter = history.length;
				this._currentLocation = this._stateHistory[history.length];
				this.fireEvent('onHistoryChange', [this._currentLocation]);
			}
		},
	
		_addStateDefault: function(hash) {
			if (this._currentLocation == hash) return;
			location.hash = '#' + hash;
			this._currentLocation = hash;
		},
	
		_monitorDefault: function() {
			var hash = this._getHash();
	
			if (hash != this._currentLocation) {
				this._currentLocation = hash;
				this.fireEvent('onHistoryChange', [hash]);
			}
		}
	});
	
	HistoryManagerSingleton.implement(new Events);
	
	var singleton;

	return function() {
		return singleton ? singleton : singleton = new HistoryManagerSingleton();
	}
	
})();