# YLH nest report page

One-page public site that collects yellow-legged hornet nest leads (name, contact, photo, address + map pin)
for the thesis. Yellow/black theme. One HTML file, no build step, no API keys.

## Files
- `index.html`      the whole site (text, form, map, submit logic). Edit text directly in the HTML.
- `nest_photo.jpg`  hero photo (crop of our own Skydio frame S1017235). Replace with any square-ish photo.
- `apps_script.gs`  the receiver: Google Sheet row + Drive photo + email to mareeb@students.kennesaw.edu.

## Run locally
Double-clicking `index.html` works for the layout, but the address search is more reliable from a
tiny local server (browsers treat `file://` pages as origin `null`):

    cd "07_Website"
    python -m http.server 8080
    # open http://localhost:8080

Until `ENDPOINT` in index.html is filled in, the page runs in **local test mode**: pressing
"Send report" shows the exact data that would be sent instead of sending it.

## Go live (when ready)
1. Follow the setup comment at the top of `apps_script.gs` (5 min, your Google account).
2. Paste the Web app URL into `const ENDPOINT = "..."` in index.html.
3. Host the folder anywhere static: GitHub Pages, Netlify drop, or KSU web space.

## Map
Leaflet 1.9.4 + CARTO street tiles + Esri satellite tiles + Nominatim geocoding. All free, no key.
(OpenStreetMap's own tile server returns 403 for pages opened from file://, which is why CARTO is used.)
Nominatim's policy is max 1 request per second and a real referrer; a low-traffic form is fine.
If the site ever gets heavy traffic, switch tiles/geocoding to a keyed provider (MapTiler, Geoapify).

## Where to change things
- Thesis blurb: `<header>` paragraph and the "Why I am asking" section.
- City list: `CITIES` array in the script block (second value 1 = highlighted).
- Map start point / zoom: `KSU_MARIETTA` and `setView(..., 11)`.
- Photo size limit before upload: `MAX_PHOTO_PX` (1600 px keeps uploads under ~500 KB).
- Spam: hidden `website` field; bots that fill it are dropped silently.
