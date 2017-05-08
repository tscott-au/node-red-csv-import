'use strict'
// project specific code

const path = require('path')

const projUtil = require('./util')
const projModel = require('./model')

const expectedSourceFiles = [
  /.*policy.csv/i,
  /.*risk.csv/i
]

function isNull (value) {
  return (value === undefined || value === null)
}

function routeFiles2BigCSV (topic, sourceFiles, expectedFiles) {
  // we pass in the case insensitive comparer
  var filtered = projUtil.filterArrayRegEx(sourceFiles, expectedFiles)

  // finish msg transform, no point passing anything else to big lib as it gets thrown away.
  var routedMsgs = filtered.matched.map(ele => {
    var x = {'topic': (topic + ':' + path.parse(ele).base),
      'filename': ele}
    return x
  })

  // weap array to make just 1 msg
  var msgUnexpected = {topic: topic, payload: filtered.unmatched}

  return [routedMsgs, msgUnexpected]
}

function removeQueueMeta (msg) {
  delete msg.amqpMessage
  return msg
}

function controlStartOnIn (msg) {
  var payload = JSON.parse(msg.payload)
  msg._id = payload.batchId
  msg.config = payload
  msg.config.topic = (!msg.topic) ? '' : msg.topic
  delete msg.payload
  delete msg.topic
  return removeQueueMeta(msg)
}

function controlStartOnOut (msg) {
  if (msg.config !== undefined && msg.config.sourceDataPath !== undefined &&
    typeof msg.config.sourceDataPath === 'string') {
    msg.topic = 'control.source.data.start.'
  } else { throw new TypeError('Missing start condition: msg.config.sourceDataPath') }
  delete msg._id
  delete msg._rev

  return msg
}

function qSourceFilesNamesOnIn (msg) {
  var x = msg.payload
  if (x.payload === undefined) { x.payload = {} }
  x.payload.start = x.config.sourceDataPath
  x.topic = x.config.batchId
  return x
}

function qSourceFilesNamesOnOut (msg, expectedSourceFiles) {
  // we pass in the case insensitive comparer
  var filtered = projUtil.filterArrayRegEx(msg.payload, expectedSourceFiles)

  // finish msg transform,
  var routedMsgs = filtered.matched.map(ele => {
    var x = {'topic': 'control.source.data.file.start.',
      payload: {'batchId': msg.topic, 'filename': ele}
    }
    return x
  })

  // wrap array to make just 1 msg
  var msgUnexpected = {topic: 'control.source.data.unknown.file.',
    payload: {'batchId': msg.topic, files: filtered.unmatched}
  }

  routedMsgs.push(msgUnexpected)

  return routedMsgs
}

function qCSVDataOnIn (msg) {
  msg.filename = msg.payload.filename
  msg.topic = msg.payload.batchId + ':' + path.parse(msg.payload.filename).base.toLowerCase()
  delete msg.payload

  return removeQueueMeta(msg)
}

function qCSVDataOnOut (msg) {
  var topicParts = msg.topic.split(':')
  var payload = msg.payload
  delete msg.payload
  msg.payload = {topic: topicParts[0],
    key: projModel.getKeyString('policy', payload),
    entity: topicParts[1],
    data: [payload]}

  msg.topic = 'data.source.' + msg.payload.entity
  msg.bufferKey = [msg.payload.topic, msg.payload.entity, msg.payload.key].join(':')
  return msg
}

function qCSVControlOnOut (msg) {
  if (msg.control.state === 'end') {
    msg.control.topic = msg.topic
    msg.topic = 'control.source.data.file.end.'

    return msg
  }
  return null
}

function simpleBuffer (node, context, msg) {
  context.set('timeout', Date.now() + 500)
  setTimeout(checkTimeOut, 600, this)

  var buff = context.get('msgBuffer')
  if (!buff) {
    context.set('msgBuffer', msg)
    return
  }

// Buffer messages with same key
  if (buff.bufferKey === msg.bufferKey) {
    buff.payload.data.push(msg.payload.data[0])
  } else {
    context.set('msgBuffer', msg)
    return buff
  }

  function checkTimeOut () {
    var buff = context.get('msgBuffer')
    if (context.get('timeout') < Date.now() && buff) {
      node.send(buff)
      context.set('msgBuffer', null)
    }
  }
}

function srcPolicySaveOnIn (msg) {
  msg.payload._id = msg.payload.topic + ':' + msg.payload.key
  var x = projModel.getPolicyModel()
  Object.assign(x.policy, msg.payload.data[0])
  msg.payload.policy = x.policy
  msg.payload.policy.key = msg.payload.key
  msg.payload.policy.type = msg.payload.entity.split('.')[0]
  delete msg.payload.data
  return removeQueueMeta(msg)
}

function srcSaveOnIn (msg) {
  msg.retryCount = 0
  msg.origPayload = msg.payload
  msg.topic = msg.origPayload.topic
  msg.payload = {_id: msg.origPayload.topic + ':' + msg.origPayload.key}

  return removeQueueMeta(msg)
}

function srcSaveRetry (msg) {
  msg.topic = msg.origPayload.topic
  msg.payload = {_id: msg.origPayload.topic + ':' + msg.origPayload.key}
  delete msg.dbError
  delete msg.error
  return msg
}

function addToModel (model, msg) {
  let rules = [
    {
      rule: () => msg.origPayload.entity === 'policy.csv',
      action: () => {
        Object.assign(model.policy, msg.origPayload.data[0])
      }
    },
    {
      rule: () => msg.origPayload.entity === 'risk.csv',
      action: () => {
        msg.origPayload.data.forEach(ele => model.policy.risks.push(ele))
      }
    }]

  let rule = rules.find(ele => ele.rule())
  if (isNull(rule)) {
    throw new Error('Missing rule for msg')
  } else {
    rule.action()
    model.policy.key = msg.origPayload.key
    model.policy.type = 'policy'
  }
  return model
}

function srcSaveNewRootDoc (msg) {
  msg.topic = msg.origPayload.topic
  msg.payload = {_id: msg.origPayload.topic + ':' + msg.origPayload.key}

  let x = projModel.getPolicyModel()
  addToModel(x, msg)

  msg.payload.policy = x.policy

  delete msg.dbError
  delete msg.error
  return msg
}

function srcSaveAddToRootDoc (msg) {
  addToModel(msg.payload, msg)
  return msg
}

function srcSaveErrorRouter (msg) {
  var maxRetry = 5
  var error = []
  var needNew = []
  var retry = []

  var hasDbStatusCode = (x) => (
    !isNull(msg.dbError) &&
    !isNull(msg.dbError.statusCode) &&
    msg.dbError.statusCode === x
    )

  var errorRouterRules = [
    {
      rule: () => isNull(msg),
      action: () => {
        error.push({ projectError: 'Error: Missing field: msg' })
      }
    },
    {
      rule: () => isNull(msg.origPayload),
      action: () => {
        msg.projectError = 'Error: Missing field: msg.origPayload'
        error.push(msg)
      }
    },
    {
      rule: () => isNull(msg.retryCount),
      action: () => {
        msg.projectError = 'Error: Missing field: msg.retryCount'
        error.push(msg)
      }
    },
    {
      rule: () => {
        // yes not perfect as the rule changes the data, but will do the job
        if (msg.retryCount < maxRetry) {
          msg.retryCount += 1
          return false
        }
        return true
      },
      action: () => {
        msg.projectError = 'Error: Hit maxRetry limit'
        error.push(msg)
      }
    },
    {
      rule: () => hasDbStatusCode(404),
      action: () => needNew.push(msg)
    },
    {
      rule: () => hasDbStatusCode(409),
      action: () => retry.push(msg)
    }
  ]

  var result = errorRouterRules.find(ele => ele.rule())

  if (isNull(result)) {
    error.push(msg)
  } else {
    result.action()
  }

  return [error, needNew, retry]
}

module.exports = {
  routeFiles2BigCSV,
  expectedSourceFiles,
  controlStartOnIn,
  controlStartOnOut,
  qSourceFilesNamesOnIn,
  qSourceFilesNamesOnOut,
  qCSVDataOnIn,
  qCSVDataOnOut,
  qCSVControlOnOut,
  simpleBuffer,
  srcPolicySaveOnIn,
  srcSaveOnIn,
  srcSaveRetry,
  srcSaveNewRootDoc,
  srcSaveAddToRootDoc,
  srcSaveErrorRouter
}
