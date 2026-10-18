# No Adblock Nag

A tiny browser extension that stops the "Please allow ads on this site" popup that appears on many recipe blogs and other sites using Raptive (AdThrive) ads.

It does not block ads, load anything, or send any data. It sets one cookie and protects it.

## The problem

You open a page and get this:

- A browser dialog: **"Please allow ads on this site. Click OK to learn more."**
- The page behind it is blank grey. The content has been deleted.
- **Cancel** reloads the page, and the popup comes back.
- **OK** sends you to `report.error-report.com`, which blames your ad blocker for "breaking" the site.

This mostly hits people who block ads at the network level: Pi-hole, AdGuard Home, AdGuard DNS, NextDNS, a router blocklist, and so on. DNS blocking can't fix it, because the DNS block is what triggers it.

## What's going on

The site runs two inline scripts from Raptive, its ad network:

1. **Detection.** It requests `ads.adthrive.com/abd/abd.js`. If that request fails, it sets the cookie `__adblocker=true` for 5 minutes. It only runs if that cookie doesn't exist yet.
2. **"Ad block recovery".** A script with an id like `adblock-recovery-xxxxxx` polls the `__adblocker` cookie.
   - If it's `true`, it loads Ad-Shield from domains such as `html-load.com`, `content-loader.com`, `fb.html-load.com` and `rule.evenyippee.com`.
   - When those fail to load, it removes the page `<body>` every 100ms, then calls `confirm()`. OK goes to `error-report.com`, Cancel reloads.
   - If the cookie is `false`, it stops and does nothing.

So the whole chain hangs off one cookie value.

## The fix

The extension runs before any page script and:

1. Sets `__adblocker=false` for the current site.
2. Overrides the `document.cookie` setter so any attempt to write `__adblocker=true` is ignored. Every other cookie works as normal.

Result: the detection script sees the cookie already exists and skips itself, and the recovery script sees `false` and gives up. Ad-Shield is never requested and the page loads normally. Your DNS blocking keeps working.

The whole thing is about 40 lines in `content.js`. Read it before installing; it's short.

## Install

Works in Chromium-based browsers (Chrome, Edge, Brave, Arc, Dia, Vivaldi). Tested in Dia.

1. Download or clone this repo to a folder you'll keep. The browser loads it from that folder, so deleting the folder removes the extension.
2. Open `chrome://extensions` (or your browser's equivalent).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. Reload the affected page.

Firefox: untested. It should work in Firefox 128 or later, which supports `"world": "MAIN"` content scripts, but nobody has confirmed it yet.

## Check it's working

On an affected page, open DevTools and run:

```js
document.cookie
```

You should see `__adblocker=false`. With the console set to show verbose messages, you'll also see `[No Adblock Nag] blocked __adblocker=true` whenever the site tries to flip it.

## Limitations

- **Raptive sites only.** Ad-Shield is also sold directly to publishers without Raptive. Those sites use a different trigger and this extension won't help there.
- **It can break.** If Raptive renames the cookie or changes how the recovery script decides to run, the popup will come back. This was written against the scripts as they were in October 2026.
- **It runs on every site.** It has to, because there's no way to know in advance which sites use Raptive. On sites that don't, it adds one harmless cookie named `__adblocker` and does nothing else.

## Permissions and privacy

- No permissions requested beyond a content script.
- No network requests, no storage, no analytics.
- Nothing leaves your browser.

## Reporting a site that still shows the popup

Open an issue with:

1. The page URL.
2. The output of `document.cookie` on that page.
3. A screenshot of the popup.

That's usually enough to tell whether it's a renamed cookie or a non-Raptive Ad-Shield setup.

## License

MIT. See [LICENSE](LICENSE).
