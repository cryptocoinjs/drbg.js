'use strict'

var tap = require('tap')
var HmacDRBG = require('../hmac')

var NISTVectors = require('./nist-vectors')

tap.test('hmac', function (t) {
  t.test('not supported hash algorithm', function (t) {
    t.throws(function () {
      new HmacDRBG('md5')  // eslint-disable-line no-new
    }, new Error('hash md5 is not supported'))
    t.end()
  })

  t.test('not enough entropy', function (t) {
    t.test('on initialization', function (t) {
      t.throws(function () {
        new HmacDRBG('sha256', new Buffer(0), new Buffer(32))  // eslint-disable-line no-new
      }, new Error('Not enough entropy'))
      t.end()
    })

    t.test('on reseed', function (t) {
      var drbg = new HmacDRBG('sha256', new Buffer(32), new Buffer(32))
      t.throws(function () {
        drbg.reseed(new Buffer(0))
      }, new Error('Not enough entropy'))
      t.end()
    })

    t.end()
  })

  t.test('NIST vector', function (t) {
    function test (algo, algoVectors) {
      var vectors = NISTVectors.get('hmac', algoVectors)
      t.test(algo, function (t) {
        vectors.forEach(function (vector) {
          var drbg = new HmacDRBG(algo, vector.EntropyInput, vector.Nonce, vector.PersonalizationString)
          drbg.reseed(vector.EntropyInputReseed, vector.AdditionalInputReseed)
          drbg.generate(vector.ReturnedBits.length, vector.AdditionalInput[0])
          var found = drbg.generate(vector.ReturnedBits.length, vector.AdditionalInput[1])
          t.equal(found.toString('hex'), vector.ReturnedBits.toString('hex'))
        })

        t.end()
      })
    }

    test('sha1', 'SHA-1')
    test('sha224', 'SHA-224')
    test('sha256', 'SHA-256')
    test('sha384', 'SHA-384')
    test('sha512', 'SHA-512')

    t.end()
  })

  t.end()
})
