const path = require("path");

const FONTS_DIR = path.join(__dirname, "../../../../assets/fonts");

const INVOICE_BRAND = {
  name: "SwiftGoma",
  logoUrl:
    "https://res.cloudinary.com/dx3wclabo/image/upload/v1784622520/dark_logo_ops4d5.png",
  colors: {
    primary: "#F4622A",
    text: "#111111",
    muted: "#6B6B6B",
    border: "#E5E5E5",
  },
  fonts: {
    regular: path.join(FONTS_DIR, "Geist-Regular.ttf"),
    medium: path.join(FONTS_DIR, "Geist-Medium.ttf"),
    bold: path.join(FONTS_DIR, "Geist-Bold.ttf"),
  },
  address: {
    line1: "Goma, Nord-Kivu",
    line2: "République Démocratique du Congo",
  },
  supportEmail: "support@swiftgoma.com",
  website: "https://swiftgoma.com",
  contacts: {
    airtel: "+243976879550",
    orange: "+243855078387",
    vodacom: "+24385507587",
  },
};

module.exports = { INVOICE_BRAND };
