# Skypager and Three.js Integration

Skypager's observables can manage the state of entities which are added to a three.js rendered

## Imports

We're going to be loading the [Three.js](https://threejs.org) library for working with 3d

- [THREE](three@0.77.0/three.min.js)

## Demo 

We'll start off by writing some low level functions for creating the various Three.js objects

```javascript editable=true example=SceneManager
 function createRenderer(options = {}) {
  const { name } = options

  const canvas = document.getElementById(name)
  const renderer = new THREE.WebGLRenderer({ canvas })

  return renderer
}

function createScene() {
  return new THREE.Scene()
}

function createCamera(options = {}) {
  const { fov = 75, aspect = 2, near = 0.1, far = 5, position } = options

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

  if (position) {
    if (position.x) camera.position.x = position.x
    if (position.y) camera.position.y = position.y
    if (position.z) camera.position.z = position.z
  }

  return camera
}

function createBoxGeometry(options = {}) {
  const { boxWidth = 1, boxHeight = 1, boxDepth = 1 } = options

  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)

  return geometry
}

function createMesh(geometry, material) {
  return new THREE.Mesh(geometry, material)
}

function createMaterial(options = {}) {
  const { color = '#BADA55' } = options

  const material = new THREE.MeshBasicMaterial({ color, ...options })

  return material
}

function createResizeHandler({ camera, renderer }) {
  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  return resize
}
```

And then finally, our `SceneManager` feature which is our main interface for working with the three.js scene from our application which is embedding it.

```javascript editable=true example=SceneManager 
class SceneManager extends Feature {
  static shortcut = 'sceneManager'
  static isCacheable = true
  static isObservable = true

  static scenes = Feature.createContextRegistry('scenes', {
    context: require.context('../scenes', true, /\.js$/),
  })

  get scenes() {
    return SceneManager.scenes
  }

  get helpers() {
    return {
      createBoxGeometry,
      createCamera,
      createMaterial,
      createMesh,
    }
  }

  setup(sceneId, options = {}) {
    const { setup } = this.scenes.lookup(sceneId)

    const scene = createScene()
    const camera = createCamera({ position: { z: 2 } })
    const renderer = createRenderer({
      name: sceneId,
      ...options,
    })

    const eventLoop = setup(scene, {
      camera,
      ...options,
      three: THREE,
      runtime: this.runtime,
      manager: this,
      renderer,
    })

    return {
      scene,
      camera,
      eventLoop,
      resize: createResizeHandler({ camera, renderer }),
    }
  }
}
```

And then finally we'll enable the `SceneManager` as a runtime feature.

```javascript runnable=true includeExamples=SceneManager
$runtime.use(SceneManager)

$el.innerHTML = 'WHAT UP BITCHES'
```

## Next Steps

```javascript
```

