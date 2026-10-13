# Course access Apps Script (not deployed)

This folder is a separate Apps Script project for course checkout verification, Google Drive access, and the welcome email.

It is **not deployed**. Do not paste it into `integrations/google-workspace/Code.gs`. That file is the live forms web app (contact and mailing list). Changing it would change forms that are already in production.

Nothing in this folder is a secret. Stripe keys, spreadsheet ids, and Drive folder ids belong in Script properties on the Apps Script project, not in git. See `config.example.json` for the property names and `docs/courses-setup.md` for the setup order.

The public welcome page does not call this script yet. `courses.claimEndpoint` in `js/config.js` stays null until the script is deployed on purpose.
