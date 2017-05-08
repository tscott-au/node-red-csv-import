'use strict'
/* global expect */

const projModel = require('./model')
describe('Proj Model module', () => {
  describe('up', () => {
    it('should export a function', () => {
      expect(projModel.up).to.be.a('function')
    })

    it('should reflect its input', () => {
      expect(projModel.up('test')).to.be.eq('test')
    })
  })
  describe('getKeyString', () => {
    it('should export a function', () => {
      expect(projModel.getKeyString).to.be.a('function')
    })

    it('should return a policy key', () => {
      var data = {'COMPANY': 'myCompany', 'PRODUCT': 'myProduct', 'POLICY': 'myPolicy'}
      var expected = 'myCompany:myProduct:myPolicy'
      expect(projModel.getKeyString('policy', data)).to.be.eq(expected)
    })

    it('should error on unknown models', () => {
      var data = {'COMPANY': 'myCompany', 'PRODUCT': 'myProduct', 'POLICY': 'myPolicy'}
      expect(function () { projModel.getKeyString('badModel', data) }).to.throw('Unknown entity name: badModel')
    })
  })
})
