if (typeof window !== "undefined" && typeof global === "undefined") {
  window.global = window
}

module.exports = require("./index")
