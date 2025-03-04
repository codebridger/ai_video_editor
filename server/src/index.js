const fs = require("fs");
const { createRest } = require("@modular-rest/server");

const permissionGroups = require("./permissions").permissionGroups;

const path = require("path");
const { projectFileTriggers } = require("./modules/video_project/triggers");

// Load .env file
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

function getKeys() {
  return {
    private: fs.readFileSync(
      path.join(__dirname, "..", "keys", "private.pem"),
      "utf8"
    ),
    public: fs.readFileSync(
      path.join(__dirname, "..", "keys", "public.pem"),
      "utf8"
    ),
  };
}

// Create the rest server
// The createRest function returns a promise
const app = createRest({
  port: 8080,
  modulesPath: path.join(__dirname, "modules"),
  uploadDirectory: path.join(__dirname, "..", "uploads"),
  // keypair: process.env.KEYPAIR ? getKeys() : undefined,
  staticPath: {
    rootDir: path.join(__dirname, "..", "uploads"),
    rootPath: "/assets",
    setHeaders: (res, path, stats) => {
      if (path.endsWith(".mp4")) {
        res.setHeader("Accept-Ranges", "bytes");
      }
    },
  },
  koaBodyOptions: {
    formidable: {
      maxFileSize: 6144 * 1024 * 1024,
    },
  },
  // staticPath: {
  //   rootDir: path.join(__dirname, "assets"),
  // },
  mongo: {
    mongoBaseAddress:
      process.env.MONGO_BASE_ADDRESS || "mongodb://localhost:27017",
    dbPrefix: "video_editor_",
  },
  adminUser: {
    email: process.env.ADMIN_EMAIL || "",
    password: process.env.ADMIN_PASSWORD || "",
  },
  verificationCodeGeneratorMethod: function () {
    return "123456";
  },
  permissionGroups,
  authTriggers: [],
  fileTriggers: [...projectFileTriggers],
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
