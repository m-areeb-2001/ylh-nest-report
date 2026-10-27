/**
 * YLH nest report receiver  -  Google Apps Script (free, runs in your Google account)
 *
 * What it does for every report sent by index.html:
 *   1. appends one row to a Google Sheet          (the "database")
 *   2. saves the photo into a Google Drive folder (if one was attached)
 *   3. emails you the report with a Google Maps link and the photo attached
 *
 * One-time setup (about 5 minutes):
 *   1. Go to https://sheets.google.com  -> new blank sheet -> name it "YLH nest reports".
 *   2. In that sheet: Extensions -> Apps Script. Delete the sample code, paste this file.
 *   3. Edit NOTIFY_EMAIL below if needed. Save (Ctrl+S).
 *   4. Deploy -> New deployment -> type "Web app"
 *        Execute as:        Me
 *        Who has access:    Anyone
 *      -> Deploy -> Authorize (your Google account) -> copy the Web app URL.
 *   5. Paste that URL into index.html as  const ENDPOINT = "https://script.google.com/macros/s/.../exec";
 *   6. Test: open index.html, send a report, check the sheet, Drive folder "YLH nest photos", and your inbox.
 *
 * After editing this script you must Deploy -> Manage deployments -> edit -> "New version",
 * otherwise the old code keeps running.
 */

const NOTIFY_EMAIL = "mareeb@students.kennesaw.edu";
const PHOTO_FOLDER = "YLH nest photos";       // created in your Drive on first use
const SHEET_NAME   = "reports";

const HEADERS = ["received", "submitted_at", "name", "contact", "seen_on", "notes",
                 "address", "lat", "lon", "maps_link", "photo_link", "page"];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok: true, service: "ylh-nest-reports"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const r = JSON.parse(e.postData.contents);
    if (!r.address || r.lat === undefined || r.lon === undefined) {
      return reply({ok: false, error: "address and map pin are required"});
    }
    const photoLink = r.photo && r.photo.base64 ? savePhoto(r) : "";
    appendRow(r, photoLink);
    notify(r, photoLink);
    return reply({ok: true});
  } catch (err) {
    return reply({ok: false, error: String(err)});
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function photoFolder() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER);
}

function savePhoto(r) {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
  const name = stamp + "_" + (r.name || "anon").replace(/[^A-Za-z0-9]+/g, "_") + ".jpg";
  const blob = Utilities.newBlob(Utilities.base64Decode(r.photo.base64), r.photo.type || "image/jpeg", name);
  const file = photoFolder().createFile(blob);
  file.setDescription(`${r.address} (${r.lat}, ${r.lon})`);
  return file.getUrl();
}

function appendRow(r, photoLink) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); }
  if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  sh.appendRow([new Date(), r.submitted_at, r.name, r.contact, r.seen_on, r.notes,
                r.address, r.lat, r.lon, r.maps_link, photoLink, r.page]);
}

function notify(r, photoLink) {
  const subject = `YLH nest report: ${r.address}`;
  const lines = [
    `Address : ${r.address}`,
    `Map     : ${r.maps_link}`,
    `Pin     : ${r.lat}, ${r.lon}`,
    `Name    : ${r.name || "-"}`,
    `Contact : ${r.contact || "-"}`,
    `Seen on : ${r.seen_on || "-"}`,
    `Notes   : ${r.notes || "-"}`,
    `Photo   : ${photoLink || "none"}`,
    ``,
    `Sheet   : ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
  ];
  const opts = {};
  if (r.photo && r.photo.base64) {
    opts.attachments = [Utilities.newBlob(Utilities.base64Decode(r.photo.base64), "image/jpeg", "nest.jpg")];
  }
  MailApp.sendEmail(NOTIFY_EMAIL, subject, lines.join("\n"), opts);
}
