import runtime, { Feature, Runtime } from '../src'

describe('The Feature Helper', function() {
  it('is automatically attached to all runtimes', function() {
    runtime.should.have.property('features')
      .that.is.an('object')
      .that.has.property('register')
      .that.is.a('function')

    runtime.should.have.property('feature').that.is.a('function')
  })

  describe('consistent enable behavior', function() {
    class Jail extends Feature {
      async checkSupport() {
        return true 
      }

      enable() {
        this.ringBell = () => `ring ring: ${this.uuid}`   
      }

      get whatsUp() {
        return 'boss'
      }
    }

    runtime.features.register('jail', () => Jail)

    it('maintains enable state', async function() {
      const jail = runtime.feature('jail')
      jail.isEnabled.should.equal(false, 'jail knows it isnt enabled')
      await jail.enable() 
      jail.isEnabled.should.equal(true, 'jail should consider itself enabled')
      runtime.enabledFeatureIds.should.include('jail')
  
      jail.should.have.property('ringBell')
    })
  })

  describe('class based providers', function() {
    class School extends Feature {
      static methods = ['ringBell']

      static ringBell() {
        return `ring ring: ${this.uuid}`
      }

      get whatsUp() {
        return 'boss'
      }
    }

    /*
    Object.defineProperty(School, 'ringBell', {
      value: School.ringBell,
      enumerable: true 
    })
    */

    runtime.features.register('school', () => School)
    
    const school = runtime.feature('school')

    it('should create an instance of the subclass', function() {
      school.should.have.property('whatsUp', 'boss')
    })

    it('should treat static methods as provider functions',function() {
      school.provider.should.have.property('ringBell')
      school.should.have.property('ringBell').that.is.a('function')
      school.ringBell().should.include(school.uuid)
    })

    it('should support default exports', function() {
      class Office extends Feature {
        get whatsUp() {
          return 'boss'
        }  
      }  

      runtime.features.register('office', () => ({
        default: Office,
        featureMethods: ['functionBased'],
        functionBased: () => 'combo' 
      }))

      const office = runtime.feature('office')

      office.should.have.property('whatsUp', 'boss')
      office.should.have.property('functionBased')
      office.functionBased().should.equal('combo')
    })
  })

  describe('object based providers', function() {
    const lazyMethodSpy = require('sinon').spy() 

    const objectBased = {
      featureMethods: ['getThisBread', 'lazyAssMethod'],
      hostMethods: ['getThisPaper'],
      getThisPaper() {
        return this.uuid
      },
      getThisBread() {
        return this.uuid
      },
      lazyAssMethod() {
        lazyMethodSpy(this.uuid)
        return 1
      }
    }

    runtime.features.register('object-based', () => objectBased)

    it('can treat the object based module as a feature instance', function() {
      const obj = runtime.feature('object-based')  
      obj.should.have.property('thisBread', obj.uuid)
      obj.should.have.property('assMethod', 1)
      obj.should.have.property('assMethod', 1)
      lazyMethodSpy.should.have.been.calledOnce
    })

    it('does not modify the runtime until it is enabled', async function() {
      const obj = runtime.feature('object-based')  
      runtime.should.not.have.property('thisPaper')
      await obj.enable()
      runtime.should.have.property('thisPaper', runtime.uuid)
    })
  })
})