/* PDFnix - Google Ads setup. Edit ONLY this top part, then upload again.
   Step 1: after Google AdSense approves your site, set enabled to true and paste your publisher ID in client.
   Step 2: for each place below, either paste the ad unit number (slots) OR paste the full ad code (custom).
   Places: header (top), sidebarTop and sidebarBottom (right side), footer (bottom).
   showPlaceholders: true shows dashed "Ad space" boxes so you can see where ads go. Set to false before you launch. */
window.PDFNIX_ADS={
  enabled:false,
  showPlaceholders:true,
  client:'',                 // example: 'ca-pub-1234567890123456'
  slots:{header:'',sidebarTop:'',sidebarBottom:'',footer:''},   // example: header:'1234567890'
  custom:{header:'',sidebarTop:'',sidebarBottom:'',footer:''}   // paste ad code between backticks: `...`
};
(function(){var A=window.PDFNIX_ADS;if(!A||!A.enabled)return;
function run(){var any=false;
 document.querySelectorAll('[data-ad]').forEach(function(el){var k=el.getAttribute('data-ad'),c=A.custom&&A.custom[k],id=A.slots&&A.slots[k];
  if(c){el.innerHTML=c;el.querySelectorAll('script').forEach(function(o){var n=document.createElement('script');Array.prototype.forEach.call(o.attributes,function(a){n.setAttribute(a.name,a.value)});n.text=o.text;o.parentNode.replaceChild(n,o)});any=true}
  else if(A.client&&id){el.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="'+A.client+'" data-ad-slot="'+id+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';any=true}});
 if(A.client&&any){var s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+A.client;
  s.onload=function(){document.querySelectorAll('ins.adsbygoogle').forEach(function(){try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}})};document.head.appendChild(s)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run()})();
