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
gtag('config', 'UA-2078617-29', {'page_path': '/device'}); // TODO: Remove object once experiment is live

