const Library1 = (function () {
  return {
    name: "Scope1/Library2 requires " + require("library1").name
  }
})()

if (typeof require !== 'undefined' && typeof exports !== 'undefined')
  module.exports = Library1
