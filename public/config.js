var stateMachineRefreshInterval = 1;
var configureuc = false;
var faxOnCallServer = false;
var defaultLogLevel = 4;
var overrideURLS = false;
var mapDisplayDispatcher = true;
var callServerPredefinedAction = false;
var demoMode = true;
var captcha = false;
var secretKey = "YOUR_SECRET_KEY1";
var conferenceMode = false;
var conferenceMode1 = "Ship Mode";
var conferenceMode2 = "Fleet Mode";
var application =  "Coral";
var aboutUsUrl = "https://www.coraltele.com/corporate-mantra";
var additionalTheme = false;
var singleGroupUpdate = false;
var clickToCall = false;
//activeConferencePollingData
var disableActiveConferenceListPolling = false;
var activeConferencePollingInterval = 2000;   //milisec
// this tag use for traceCall data in billing cdr report
var enableTraceCall = false;
var locationAsHome = [25.4280065, 81.8299179];
var disablePhone = true;

// Knowledge Center Configuration
var KNOWLEDGE_CENTER_BASE_PATH = "static/KNOWLEDGE-CENTER-PDFS"; // relative so it works with basename

// IQMS external APIs. Edit this file on the deployed server, then refresh.
// No new build is required. Do not add a trailing slash.
// sampoornaBase includes scheme, host, optional port, and the path through /ivrs.
// ivrsApiBase is controller.php with no query string.
var IQMS_CONFIG = {
  sampoornaBase: "https://sampoorna.cao.local/afcao/ipas/ivrs",
  ivrsApiBase: "https://175.25.5.7/API/controller.php",
  apiToken: "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS"
};