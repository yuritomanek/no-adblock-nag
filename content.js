// No Adblock Nag
//
// How the nag works on Raptive (AdThrive) sites:
//   1. An inline script fetches ads.adthrive.com/abd/abd.js. If that is blocked,
//      it sets the cookie __adblocker=true. It only runs if the cookie is absent.
//   2. A second inline script (#adblock-recovery-*) polls that cookie. If "true",
//      it loads Ad-Shield (html-load.com, content-loader.com, ...). When those fail,
//      it deletes <body> every 100ms and calls confirm(), which reloads the page
//      or sends you to error-report.com. If the cookie is "false", it gives up.
//
// So: pre-set __adblocker=false before any page script runs, and refuse any
// attempt to flip it to true. Detection never runs, recovery never starts.

(() => {
  const NAME = '__adblocker';

  try {
    document.cookie = `${NAME}=false; max-age=31536000; path=/`;
  } catch (e) {
    return; // opaque origins (sandboxed iframes, about:blank) throw here
  }

  const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  if (!desc || !desc.set || !desc.get) return;

  Object.defineProperty(Document.prototype, 'cookie', {
    configurable: true,
    enumerable: desc.enumerable,
    get() {
      return desc.get.call(this);
    },
    set(value) {
      if (typeof value === 'string' && /^\s*__adblocker\s*=\s*true/i.test(value)) {
        console.debug('[No Adblock Nag] blocked __adblocker=true');
        return;
      }
      desc.set.call(this, value);
    },
  });
})();
