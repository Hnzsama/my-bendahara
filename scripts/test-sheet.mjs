import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

async function testCreateSheet() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();

  if (!email || !privateKey) {
    console.log("No credentials in env");
    return;
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  try {
    console.log("Creating test spreadsheet for bill...");
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: "Kas - Uji Coba Tagihan Baru",
        },
        sheets: [
          {
            properties: {
              title: "Kas_Masuk_Approved",
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "Waktu Verifikasi" } },
                      { userEnteredValue: { stringValue: "Kode Transaksi" } },
                      { userEnteredValue: { stringValue: "Kelas" } },
                      { userEnteredValue: { stringValue: "NIM" } },
                      { userEnteredValue: { stringValue: "Nama Mahasiswa" } },
                      { userEnteredValue: { stringValue: "Tagihan Kas" } },
                      { userEnteredValue: { stringValue: "Nominal" } },
                      { userEnteredValue: { stringValue: "Metode Bayar" } },
                      { userEnteredValue: { stringValue: "PIC Bendahara" } },
                      { userEnteredValue: { stringValue: "Status" } },
                      { userEnteredValue: { stringValue: "Diverifikasi Oleh" } },
                      { userEnteredValue: { stringValue: "Link Struk" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const spreadsheetId = res.data.spreadsheetId;
    const spreadsheetUrl = res.data.spreadsheetUrl;
    console.log("SUCCESS CREATED! ID:", spreadsheetId, "URL:", spreadsheetUrl);

    // Try sharing to user email
    const shareEmail = process.env.GOOGLE_ACCOUNT_EMAIL || "hnzsama@gmail.com";
    if (shareEmail && spreadsheetId) {
      console.log("Sharing to:", shareEmail);
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: "writer",
            type: "user",
            emailAddress: shareEmail,
          },
        });
        console.log("SUCCESS SHARED TO", shareEmail);
      } catch (driveErr) {
        console.log("Drive share warning:", driveErr.message);
      }
    }
  } catch (err) {
    console.error("FAILED CREATING SHEET:", err.message || err);
    console.error("DETAILS:", JSON.stringify(err?.response?.data || err, null, 2));
  }
}

testCreateSheet();
