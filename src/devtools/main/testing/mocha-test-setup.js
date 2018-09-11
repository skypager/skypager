// Load Test Environment Utilities
const chai = require('chai')
const should = chai.should() // eslint-disable-line
chai.use(require('chai-like'))
chai.use(require('chai-things'))
chai.use(require('chai-as-promised'))
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.use(sinonChai)

global.expect = chai.expect

// sinon provides test spies
global.sinon = sinon
