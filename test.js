require('dotenv').config();
var MSTeamsLogger = require('.');

var logger = new MSTeamsLogger(
  process.env.MSTEAMS_WEBHOOK_URL,
  "test environment",
  "Apigrate Time-Tracking App",
  {
    author_url: "http://documentation.about.invoice.integration",
    fields: {
      build: "2022.001",
      branch: "main"
    }
  }
);

// basic
// logger.log(
//   true,
//   'That worked.'
// );

//success, summary, details, fields
logger.log(
  true,
  'Invoice Created.',
  'Found customer.\nThere are 3 invoice lines.\nThe total amount is $107.80',
  {
    customer_id: 28390,
    invoice_id: 123789
  }
);

logger.log(
  false,
  'Invoice was not created.',
  'Found customer.\nException processing invoice lines.\nThe quantity is missing for the line with product 1234879.',
  {
    customer_id: 28390,
    product_id: 1234879,
    product_sku: 'TS4921'
  }
);
