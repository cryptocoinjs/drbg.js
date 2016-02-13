'use strict'

var tap = require('tap')
var drbg = require('../')

tap.test('index', function (t) {
  t.test('export hmac', function (t) {
    t.equal(drbg.HmacDRBG, require('../hmac'))
    t.end()
  })

  t.end()
})
