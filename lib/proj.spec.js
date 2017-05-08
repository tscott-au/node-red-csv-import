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

  describe('controlStartOnIn', () => {
    it('should export a function', () => {
      expect(projProj.controlStartOnIn).to.be.a('function')
    })

    it('should clean a message from the q', () => {
      var msg = { _msgid: '1',
        topic: 'controlStart',
        payload: '{"batchId":"1.939","sourceDataPath":"./sample/"}',
        amqpMessage: {
          Message: { 'dummy': 'text' }
        }
      }

      var expected = { _msgid: '1',
        _id: '1.939',
        config:
        { batchId: '1.939',
          sourceDataPath: './sample/',
          topic: 'controlStart' }
      }

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.controlStartOnIn(msg))
      expect(results).to.be.eq(expected)
    })

    it('should clean a message from the q', () => {
      var msg = { _msgid: '1',

        payload: '{"batchId":"1.939","sourceDataPath":"./sample/"}',
        amqpMessage: {
          Message: { 'dummy': 'text' }
        }
      }

      var expected = { _msgid: '1',
        _id: '1.939',
        config:
        { batchId: '1.939',
          sourceDataPath: './sample/',
          topic: '' }
      }

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.controlStartOnIn(msg))
      expect(results).to.be.eq(expected)
    })
  })

  describe('controlStartOnOut', () => {
    it('should export a function', () => {
      expect(projProj.controlStartOnOut).to.be.a('function')
    })

    it('should prepare msg to Q', () => {
      var msg = { _msgid: '1',
        _id: '1.939',
        _rev: '1.939',
        config:
        { batchId: '1.939',
          sourceDataPath: './sample/',
          topic: 'controlStart' }
      }

      var expected = { _msgid: '1',
        config:
        { batchId: '1.939',
          sourceDataPath: './sample/',
          topic: 'controlStart' },
        topic: 'control.source.data.start.'
      }

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.controlStartOnOut(msg))
      expect(results).to.be.eq(expected)
    })

    it('should be have an array as param 2', () => {
      var msg = {}
      expect(function () { projProj.controlStartOnOut(msg) }).to.throw('Missing start condition: msg.config.sourceDataPath')
    })
  })

  describe('qSourceFilesNamesOnIn', () => {
    it('should export a function', () => {
      expect(projProj.qSourceFilesNamesOnIn).to.be.a('function')
    })

    it('should prepare msg from Q', () => {
      var msg = { _msgid: '1',
        _id: '1.939',
        payload: {
          config: { batchId: '1.939',
            sourceDataPath: './sample/',
            topic: 'controlStart' }
        }
      }

      var expected = { config: { batchId: '1.939',
        sourceDataPath: './sample/',
        topic: 'controlStart' },
        payload: {start: './sample/'},
        topic: '1.939'
      }

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.qSourceFilesNamesOnIn(msg))
      expect(results).to.be.eq(expected)
    })
  })

  describe('qSourceFilesNamesOnOut', () => {
    it('should export a function', () => {
      expect(projProj.qSourceFilesNamesOnOut).to.be.a('function')
    })

    it('should prepare msg from Q', () => {
      var msg = {
        config: {x: 'y'},
        topic: '1',
        payload: ['w', 'x', 'y', 'z'],
        origPayload: {'acsv': 'b.csv'}

      }

      var expected = [{topic: 'control.source.data.file.start.', payload: {batchId: '1', filename: 'w'}},
        {topic: 'control.source.data.file.start.', payload: {batchId: '1', filename: 'y'}},
        {topic: 'control.source.data.unknown.file.', payload: {batchId: '1', files: ['x', 'z']}}]

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.qSourceFilesNamesOnOut(msg, [/w/, /y/]))
      expect(results).to.be.eq(expected)
    })
  })

  describe('qCSVDataOnIn', () => {
    it('should export a function', () => {
      expect(projProj.qCSVDataOnIn).to.be.a('function')
    })

    it('should prepare msg from Q', () => {
      var msg = { _msgid: '1',
        topic: 'controlStart',
        payload: {'batchId': '1.939', 'filename': './sample/ABC.CSV'},
        amqpMessage: {
          Message: { 'dummy': 'text' }
        }
      }

      var expected = {_msgid: '1', topic: '1.939:abc.csv', 'filename': './sample/ABC.CSV'}

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.qCSVDataOnIn(msg))
      expect(results).to.be.eq(expected)
    })
  })

  describe('qCSVDataOnOut', () => {
    it('should export a function', () => {
      expect(projProj.qCSVDataOnOut).to.be.a('function')
    })

    it('should prepare msg for Q', () => {
      var msg = {
        topic: 'batchId:entity.csv',
        payload: {'COMPANY': 'c', 'PRODUCT': 'p', 'POLICY': 'pol'}
      }

      var expected = {
        topic: 'data.source.entity.csv',
        payload: {
          'topic': 'batchId',
          'key': 'c:p:pol',
          'entity': 'entity.csv',
          'data': [{'COMPANY': 'c',
            'PRODUCT': 'p',
            'POLICY': 'pol'}]
        },
        bufferKey: 'batchId:entity.csv:c:p:pol'
      }

      expected = JSON.stringify(expected, null, '\t')
      var results = JSON.stringify(projProj.qCSVDataOnOut(msg), null, '\t')
      expect(results).to.be.eq(expected)
    })
  })

  describe('qCSVControlOnOut', () => {
    it('should export a function', () => {
      expect(projProj.qCSVControlOnOut).to.be.a('function')
    })

    it('should prepare msg for Q', () => {
      var msg = { topic: '1493779140351.385:risk.csv',
        control: { state: 'end' } }

      var expected = {
        topic: 'control.source.data.file.end.',
        control: { state: 'end', topic: '1493779140351.385:risk.csv' } }

      expected = JSON.stringify(expected, null, '\t')
      var results = JSON.stringify(projProj.qCSVControlOnOut(msg), null, '\t')
      expect(results).to.be.eq(expected)
    })

    it('should ignore non end', () => {
      var msg = { topic: '1493779140351.385:risk.csv',
        control: { state: 'running' } }

      expect(projProj.qCSVControlOnOut(msg)).to.be.eq(null)
    })
  })

  describe('simpleBuffer', () => {
    it('should export a function', () => {
      expect(projProj.simpleBuffer).to.be.a('function')
    })
    // todo: need to add mocks to support testing of the simple buffer.
    //
  })

  describe('srcSaveOnIn', () => {
    it('should export a function', () => {
      expect(projProj.srcSaveOnIn).to.be.a('function')
    })

    it('should prepare msg from Q', () => {
      var msg = {
        topic: 'q.routing.Topic',
        payload: {'topic': 'topic', 'key': 'key'},
        amqpMessage: {
          Message: { 'dummy': 'text' }
        }
      }

      var expected = {topic: 'topic',
        payload: {_id: 'topic:key'},
        retryCount: 0,
        origPayload: {'topic': 'topic', 'key': 'key'}}

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveOnIn(msg))
      expect(results).to.be.eq(expected)
    })
  })

  describe('srcSaveRetry', () => {
    it('should export a function', () => {
      expect(projProj.srcSaveRetry).to.be.a('function')
    })

    it('should prepare msg from Q', () => {
      var msg = {
        topic: 'q.routing.Topic',
        payload: {'topic': 'topic', 'key': 'key'},
        retryCount: 0,
        origPayload: {'topic': 'topic', 'key': 'key'},
        dbError: {x: 'y'},
        error: {msg: 'was real bad'}

      }

      var expected = {topic: 'topic',
        payload: {_id: 'topic:key'},
        retryCount: 0,
        origPayload: {'topic': 'topic', 'key': 'key'}}

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveRetry(msg))
      expect(results).to.be.eq(expected)
    })
  })

  describe('srcSaveNewRootDoc', () => {
    it('should export a function', () => {
      expect(projProj.srcSaveNewRootDoc).to.be.a('function')
    })

    it('should prepare new model document to save', () => {
      var msg = {
        topic: 'q.routing.Topic',
        payload: {'topic': 'topic', 'key': 'key'},
        retryCount: 0,
        origPayload: {'topic': 'topic', 'key': 'key', entity: 'policy.csv', data: [{x: 'y'}]},
        dbError: {x: 'y'},
        error: {msg: 'was real bad'}

      }

      var expected = {
        'topic': 'topic',
        'payload': {
          '_id': 'topic:key',
          'policy': {
            'key': 'key',
            'type': 'policy',
            'risks': [],
            'addresses': [],
            'x': 'y'}
        },
        'retryCount': 0,
        'origPayload': {'topic': 'topic', 'key': 'key', 'entity': 'policy.csv', 'data': [{'x': 'y'}]}}

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveNewRootDoc(msg))
      expect(results).to.be.eq(expected)
    })
  })

  describe('srcSaveAddToRootDoc', () => {
    it('should export a function', () => {
      expect(projProj.srcSaveAddToRootDoc).to.be.a('function')
    })

    it('should add policy to document to save', () => {
      var msg = {
        'topic': 'topic',
        'payload': {
          '_id': 'topic:key',
          'policy': {
            'key': '',
            'type': '',
            'risks': [{'risk': true}],
            'addresses': []
          }
        },
        'retryCount': 0,
        'origPayload': {'topic': 'topic', 'key': 'key', 'entity': 'policy.csv', 'data': [{'x': 'y'}]}}

      var expected = {
        'topic': 'topic',
        'payload': {
          '_id': 'topic:key',
          'policy': {
            'key': 'key',
            'type': 'policy',
            'risks': [{'risk': true}],
            'addresses': [],
            'x': 'y'}
        },
        'retryCount': 0,
        'origPayload': {'topic': 'topic', 'key': 'key', 'entity': 'policy.csv', 'data': [{'x': 'y'}]}}

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveAddToRootDoc(msg))
      expect(results).to.be.eq(expected)
    })

    it('should add risk to document to save', () => {
      var msg = {
        'topic': 'topic',
        'payload': {
          '_id': 'topic:key',
          'policy': {
            'key': '',
            'type': '',
            'risks': [],
            'addresses': []
          }
        },
        'retryCount': 0,
        'origPayload': {'topic': 'topic', 'key': 'key', 'entity': 'risk.csv', 'data': [{'x': 'y'}]}}

      var expected = {
        'topic': 'topic',
        'payload': {
          '_id': 'topic:key',
          'policy': {
            'key': 'key',
            'type': 'policy',
            'risks': [{'x': 'y'}],
            'addresses': []
          }
        },
        'retryCount': 0,
        'origPayload': {'topic': 'topic', 'key': 'key', 'entity': 'risk.csv', 'data': [{'x': 'y'}]}}

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveAddToRootDoc(msg))
      expect(results).to.be.eq(expected)
    })
  })

  describe('srcSaveErrorRouter', () => {
    it('should export a function', () => {
      expect(projProj.srcSaveErrorRouter).to.be.a('function')
    })

    it('should return an array with 3 elements', () => {
      var msg = null
      var result = projProj.srcSaveErrorRouter(msg)
      expect(result).to.be.a('array')
      expect(result.length).to.be.eq(3)
    })

    it('should route no msg  to error', () => {
      var msg = null
      var expected = [[{ projectError: 'Error: Missing field: msg' }], [], []]

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveErrorRouter(msg))
      expect(results).to.be.eq(expected)
    })

    it('should route no missing origPayload  to error', () => {
      var msg = {topic: 'topic',
        payload: {_id: 'topic:key'},
        retryCount: 1,
        projectError: 'Error: Missing field: msg.origPayload'}
      var expected = [[msg], [], []]

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveErrorRouter(msg))
      expect(results).to.be.eq(expected)
    })

    it('should route unknown to error', () => {
      var msg = {topic: 'topic',
        payload: {_id: 'topic:key'},
        retryCount: 1,
        origPayload: {'topic': 'topic', 'key': 'key'}}

      var expected = [[msg], [], []]
      expected = JSON.stringify(expected)

      // reset retry count
      msg.retryCount = 0

      var results = JSON.stringify(projProj.srcSaveErrorRouter(msg))
      expect(results).to.be.eq(expected)
    })

    it('should fail when no retryCount', () => {
      var msg = {
        topic: 'q.routing.Topic',
        payload: {'topic': 'topic', 'key': 'key'},
        origPayload: {'topic': 'topic', 'key': 'key'},
        projectError: 'Error: Missing field: msg.retryCount'
      }

      var expected = [[msg], [], []]

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveErrorRouter(msg))
      expect(results).to.be.eq(expected)
    })

    it('should route max retry to error', () => {
      var msg = {topic: 'topic',
        payload: {_id: 'topic:key'},
        retryCount: 5,
        origPayload: {'topic': 'topic', 'key': 'key'},
        projectError: 'Error: Hit maxRetry limit'}

      var expected = [[msg], [], []]

      expected = JSON.stringify(expected)
      var results = JSON.stringify(projProj.srcSaveErrorRouter(msg))
      expect(results).to.be.eq(expected)
    })

    it('should route db 404 to needNew', () => {
      var msg = {topic: 'topic',
        payload: {_id: 'topic:key'},
        retryCount: 1,
        origPayload: {'topic': 'topic', 'key': 'key'},
        dbError: {statusCode: 404}
      }

      var expected = [[], [msg], []]
      expected = JSON.stringify(expected)
      // reset retry count
      msg.retryCount = 0

      var results = JSON.stringify(projProj.srcSaveErrorRouter(msg))
      expect(results).to.be.eq(expected)
    })

    it('should route db 409 to retry', () => {
      var msg = {topic: 'topic',
        payload: {_id: 'topic:key'},
        retryCount: 1,
        origPayload: {'topic': 'topic', 'key': 'key'},
        dbError: {statusCode: 409}
      }

      var expected = [[], [], [msg]]
      expected = JSON.stringify(expected)
      // reset retry count
      msg.retryCount = 0

      var results = JSON.stringify(projProj.srcSaveErrorRouter(msg))
      expect(results).to.be.eq(expected)
    })
  })
})
