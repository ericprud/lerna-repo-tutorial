const Library1 = (function () {
  return {
    name: "Library1"
  }
})()

if (typeof require !== 'undefined' && typeof exports !== 'undefined')
  module.exports = Library1
