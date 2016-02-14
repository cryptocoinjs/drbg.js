'use strict'

var tap = require('tap')
var drbg = require('../')

tap.test('index', function (t) {
  /*
  t.test('export CtrDRBG', function (t) {
    t.equal(drbg.CtrDRBG, require('../ctr'))
    t.end()
  })
  */

  t.test('export HashDRBG', function (t) {
    t.equal(drbg.HashDRBG, require('../hash'))
    t.end()
  })

  t.test('export HmacDRBG', function (t) {
    t.equal(drbg.HmacDRBG, require('../hmac'))
    t.end()
  })

  t.end()
})
