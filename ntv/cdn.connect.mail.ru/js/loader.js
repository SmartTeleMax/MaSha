var mailru = mailru || {};
mailru.loader = {
	modvers: {
		receiver: 1,
		proxy: 12,
		api: 72,
        api_dev: 2,
        xdm: 5
	},
    modreleases: {
		receiver: null,
		proxy: null,
		api: null,
        api_dev: null,
        xdm: null
	},
	_modulePath: 'http://img1.imgsmail.ru/r/js/connect/',
	_loaded: {},
	_readyCallbacks: {},
	require: function(module, onready, deferLoad){
		if(this._loaded[module]){
			onready();
		} else {
			if(!this._readyCallbacks[module]){
				if(module=='api') {
					var ts = +new Date();
					(function(obj, name, cb){
						if (obj.addEventListener){
							obj.addEventListener(name, cb, false);
						} else if (obj.attachEvent){
							obj.attachEvent('on'+ name, cb);
						}
					})(window, 'beforeunload', function(){
						if(!mailru.loader._loaded[module] && (+new Date() - ts) > 15000){
							(new Image()).src='http://goshka.mail.ru/gstat?api.require=1&rnd='+ Math.random();
						}
					})
				}

                if(typeof this._readyCallbacks[module] === 'undefined')
				    this._readyCallbacks[module] = [];
				this._readyCallbacks[module].push(onready);
				var modver = (this.modvers[module] && ('?'+ this.modvers[module])) || '';
                var modrelease = (this.modreleases[module] && ('/' + this.modreleases[module]) + '/') || '/';
                deferLoad = mailru.isIE && deferLoad? true : false;
				document.URL.match(/testmode=1/) && (modver = '');

				with(document.getElementsByTagName('head')[0].appendChild(document.createElement('script'))){
					type = 'text/javascript';
					src = this._modulePath+ module+ modrelease+ module+ '.js' +modver;
                    if(deferLoad){
                        defer = "defer";
                    }
				}
			} else {
				this._readyCallbacks[module].push(onready);
			}

		}
	},
	onready: function(module){
		if(this._readyCallbacks[module]){
			this._loaded[module] = true;
			var cbs = this._readyCallbacks[module];
            if(cbs.length)
                for(var i=0; i<cbs.length; i++){
                    try{
                        cbs[i]();
                    }catch(e){}
                }

		}
	}
};

(function(){
	var branch = document.URL.match(/__branch=([a-z0-9_-]+)/i );
	if(!branch)
		branch = window.name.match(/__branch=([a-z0-9_-]+)/i );
	if(branch){
		mailru.loader._modulePath = 'http://'+ branch[1]+ '.my.rapira9.mail.ru/mail/ru/images/js/connect/';
		mailru.loader._branch = branch[1];
	}
})()

mailru.isIE = /*@cc_on!@*/false;
mailru.isOpera = !!window.opera;
mailru.isApp = false;
if(window.name.indexOf('app') != -1)
	mailru.isApp = true;

mailru.intercomType = ( (window.postMessage && !mailru.isIE) || (mailru.isApp && mailru.isIE && window.postMessage))? 'event' : (((function(){var i,a,o,p,s="Shockwave",f="Flash",t=" 2.0",u=s+" "+f,v=s+f+".",rSW=RegExp("^"+u+" (\\d+)");if((o=navigator.plugins)&&(p=o[u]||o[u+t])&&(a=p.description.match(rSW)))return a[1];else if(!!(window.ActiveXObject))for(i=10;i>0;i--)try{if(!!(new ActiveXObject(v+v+i)))return i}catch(e){}return 0;})() < 10) ? 'hash' : 'flash');

mailru.init = function(onready, private_key, DOMFlashId){
	mailru.loader.require('api', function(){
		try{
			mailru.app.init(private_key);
		}catch(e){
			(new Image()).src='http://goshka.mail.ru/gstat?api.param1=1&rnd='+ Math.random();
		}
		var e;
		if(DOMFlashId && (e=document.getElementById(DOMFlashId))){
			setTimeout(onready, 1);
			mailru.events.listen('event', function(name, data){
				document.getElementById(DOMFlashId).mailruEvent(name, data);
			});
		}
	})
}
mailru.autoInit = (function(){
    var a = document.getElementsByTagName('a'), al = a.length;
    for(var i = 0; i < al; i++){
    	if (typeof a[i] !== 'undefined' && a[i].className.indexOf('mrc__plugin') != -1) {
            mailru.loader.require('api', function(){
                mailru.plugin.init();
            });
            break;
    	}
    }    
})();


(function(){
	var req = function(type, log){
        try{

            if( typeof log !== 'string' ) log = log.join('|');
            (new Image()).src = 'http://goshka.mail.ru/gstat?ua=1&clienterror.'+ type +'=1&logme='+ log;
            (new Image()).src='http://goshka.mail.ru/gstat?api.param4=1&rnd=' + Math.random();
        } catch(e) {}
	}

	var handler = function(msg, src, line){
        if( (src||'').match(/mail\.ru/i) ){
            try{
                if(msg == 'Error loading script' || line == 0) return false;
                req('ejs2', [
                        encodeURIComponent(src),
                        line,
                        encodeURIComponent(msg),
                        encodeURIComponent(location.toString()),
                        'js5'
                    ].join('|')
                );
            } catch(e) {}
        }
    };

    window.onerror = handler;
})();
