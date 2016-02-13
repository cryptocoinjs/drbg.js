'use strict'

var path = require('path')
var fs = require('fs')

module.exports.get = function (drbgType, algo) {
  var filename = path.join(__dirname, drbgType + '.rsp')
  var content = fs.readFileSync(filename).toString()

  var vectors = []
  for (var fromIndex = -1; ;) {
    fromIndex = content.indexOf('[' + algo + ']', fromIndex + 1)
    if (fromIndex === -1) break

    for (var i = 0; i < 15; ++i) {
      var vector = {}

      var startIndex = content.indexOf('COUNT = ' + i, fromIndex)
      var items = content.slice(startIndex, content.indexOf('\r\n\r\n', startIndex)).split('\r\n')
      for (var j = 1; j < items.length; ++j) {
        var key = items[j].split(' = ')[0]
        var value = new Buffer(items[j].split(' = ')[1], 'hex')

        if (vector[key] === undefined) {
          vector[key] = value
        } else {
          vector[key] = [ vector[key], value ]
        }
      }

      vectors.push(vector)
    }
  }

  return vectors
}
