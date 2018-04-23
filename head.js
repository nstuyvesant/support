// Salesforce Live Agent
liveagent.init('https://d.la1-c1-lon.salesforceliveagent.com/chat', '572D000000001yp', '00D200000001UUG');
if (!window._laq) {
    window._laq = [];
}
window._laq.push(function() {
    liveagent.showWhenOnline('573D0000000028q', document.getElementById('liveagent_button_online_573D0000000028q'));
    liveagent.showWhenOffline('573D0000000028q', document.getElementById('liveagent_button_offline_573D0000000028q'));
});

// Global site tag (gtag.js) - Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-2078617-29', {'page_path': '/device'});

// Marketo Munchkin
(function() {
    var didInit = false;
    function initMunchkin() {
        if(didInit === false) {
            didInit = true;
            Munchkin.init('482-YUQ-296');
        }
    }
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'https://munchkin.marketo.net/munchkin-beta.js';
    s.onreadystatechange = function() {
        if (this.readyState == 'complete' || this.readyState == 'loaded') {
            initMunchkin();
        }
    };
    s.onload = initMunchkin;
    document.getElementsByTagName('head')[0].appendChild(s);
})();
