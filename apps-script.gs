/**
 * ZÉLL-V NMN Plus — registration form endpoint.
 *
 * SETUP
 * 1. Open (or create) the Google Sheet you want leads written to.
 * 2. Extensions > Apps Script, delete any starter code, and paste this file in.
 * 3. Deploy > New deployment > select type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL from the deploy dialog.
 * 5. Paste that URL into the SHEET_ENDPOINT constant at the top of form.js.
 *
 * Each submission is appended as a row: [Timestamp, Name, Phone, Email, Location].
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var params = e.parameter;

    // A leading "+" (e.g. "+60 12-345 6789") gets parsed as the start of an
    // expression by Sheets' normal input handling and mangles the value, so
    // the phone cell is forced to plain text with a leading apostrophe marker.
    var phone = params.phone ? "'" + params.phone : '';

    sheet.appendRow([
      params.timestamp || new Date().toISOString(),
      params.name || '',
      phone,
      params.email || '',
      params.location || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
