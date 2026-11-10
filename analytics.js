// Set the GA4 web stream ID to enable reporting for this deployment.
const measurementId = 'G-93X5VZCRFY';
const analyticsEnabled = /^G-[A-Z0-9]+$/.test(measurementId);
function analyticsTag() {
 window.dataLayer.push(arguments);
}
if (analyticsEnabled) {
 window.dataLayer = window.dataLayer || [];
 const tag = document.createElement('script');
 tag.async = true;
 tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
 document.head.append(tag);
 analyticsTag('js', new Date());
 analyticsTag('config', measurementId, {
  page_location: location.origin + location.pathname,
  page_referrer: '',
  allow_google_signals: false,
  allow_ad_personalization_signals: false
 });
}
function trackGame(event, mode, playType, playerCount) {
 if (!analyticsEnabled) return;
 analyticsTag('event', event, {game_mode: mode, play_type: playType, player_count: playerCount});
}
