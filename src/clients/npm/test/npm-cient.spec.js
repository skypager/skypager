import runtime from '@skypager/node'
import * as NpmClient from '../src'

describe('The NPM Client', function() {
  runtime.use(NpmClient)

  it('is registered', function() {
    runtime.clients.available.should.include('npm')
  })

  it('can be created', function() {
    const npm = runtime.client('npm')
    npm.should.be.an('object').with.property('client')
  })

  it('can retrieve package info', async function() {
    const packageInfo = await runtime.client('npm').fetchPackageInfo('@skypager/node')
    packageInfo.should.be.an('object')
    packageInfo.should.have.property('name', '@skypager/node')
    packageInfo.should.have.property('versions').that.is.an('object')
  })

  it('can be authorized', function() {
    runtime.client('npm').authorize('some token')
    runtime
      .client('npm')
      .client.defaults.headers.common.should.have.property('Authorization', 'Bearer some token')
  })
})
