// Root server entry point - forwards to backend/server.js
const path = require("path");
process.chdir(path.join(__dirname, "backend"));
require("./backend/server.js");
