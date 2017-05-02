'use strict'
/* global expect */

const projProj = require('./proj')
describe('Proj module', () => {
  describe('expectedSourceFiles', () => {
    it('should export an array', () => {
      expect(projProj.expectedSourceFiles).to.be.a('Array')
    })

    it('should have at least 1 entry', () => {
      expect(projProj.expectedSourceFiles.length).to.be.above(0)
    })
  })

  describe('routeFiles2BigCSV', () => {
    it('should export a function', () => {
      expect(projProj.routeFiles2BigCSV).to.be.a('function')
    })

    it('should fan out messages', () => {
      var msg = {topic: 'a', payload: ['w', 'x', 'y', 'z']}
      var expected = [[{topic: 'a:w', filename: 'w'}, {topic: 'a:y', filename: 'y'}],
       {topic: 'a', payload: ['x', 'z']}]
      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.routeFiles2BigCSV(msg.topic, msg.payload, [/w/, /y/]))
      expect(results).to.be.eq(expected)
    })
  })
})
