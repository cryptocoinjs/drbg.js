'use strict'

exports.bsum = function (buffers) {
  var dst = new Buffer(buffers[0])

  for (var i = 1; i < buffers.length; ++i) {
    for (var j = buffers[i].length - 1, dj = dst.length - 1, carry = 0; j >= 0; --j, --dj) {
      carry += buffers[i][j] + dst[dj]
      dst[dj] = carry & 0xff
      carry >>>= 8
    }

    for (; carry > 0 && dj >= 0; --dj) {
      carry += dst[dj]
      dst[dj] = carry & 0xff
      carry >>>= 8
    }
  }

  return dst
}
