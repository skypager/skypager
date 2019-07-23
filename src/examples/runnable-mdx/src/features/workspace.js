import { Feature } from '@skypager/runtime'

/**
 * The Workspace feature manages the state of the
 * main shell of the renderer App.  Things like drawer visibility,
 * are controlled by a top level DrawerLayout component based on
 * semantic ui Sidebar.Pushable
 *
 * Each Screen Component can use the Drawer component to assign children which occupy
 * the drawer's content.  It uses ReactDOM createPortal to render,
 * which allows for Drawer dom elements to be inserted at the top level, but be controlled
 * by screens further down the tree.
 */
export default class Workspace extends Feature {
  static shortcut = 'workspace'

  static isObservable = true

  static defaultDrawers = {
    top: {
      visible: false,
    },
    right: {
      visible: false,
    },
    bottom: {
      visible: false,
    },
    left: {
      visible: false,
    },
  }

  static observables() {
    return {
      drawers: ['shallowMap', Workspace.defaultDrawers],
      toggleDrawer: ['action', this.toggleDrawer],
      updateDrawer: ['action', this.updateDrawer],
      closeAllDrawers: ['action', this.closeAllDrawers],
    }
  }

  /**
   * Update the state of a given drawer.  You can control visibility this way, or also provide
   * other state which will be passed to the underlying <Drawer /> component
   */

  updateDrawer(drawerId, updates) {
    const current = this.drawers.get(drawerId) || {}

    this.drawers.set(drawerId, {
      ...current,
      ...updates,
    })
  }

  /**
   * Toggle a drawer on or off.  You can pass a callback which will be called
   * after the drawer is closed or open.
   *
   * @param {String} drawerId - the id of the drawer you want to control
   * @param {Boolean|Function} forceState - pass a true or false value to force it open or closed regardless of what it is now.
   * @param {Function} callback - a function which will get called after the state is updated
   */
  toggleDrawer(drawerId, forceState, callback) {
    const current = this.drawers.get(drawerId) || {}

    if (typeof forceState === 'function') {
      callback = forceState
    }

    if (forceState === true || forceState === false) {
      this.drawers.set(drawerId, {
        ...current,
        visible: forceState,
      })
    } else {
      this.drawers.set(drawerId, {
        ...current,
        visible: !current.visible,
      })
    }

    if (typeof callback === 'function') {
      callback(drawerId, this.drawers.get(drawerId).visible, this)
    }
  }

  /**
   * Forces all drawers closed.
   *
   * @param {Function} callback a function which will be called when the drawers are closed
   */
  closeAllDrawers(callback) {
    const drawerIds = this.drawers.keys()
    drawerIds.forEach(drawerId => this.toggleDrawer(drawerId, false, callback))
  }

  /**
   * Observes the drawers for the purpose of emitting events
   *
   * @private
   */
  observeDrawers() {
    this.drawers.observe(({ name, newValue, oldValue }) => {
      if (newValue.visible && !oldValue.visible) {
        this.emit(`${name}DrawerDidShow`)
      } else if (oldValue.visible && !newValue.visible) {
        this.emit(`${name}DrawerDidHide`)
      }
    })
  }

  featureWasEnabled() {
    this.observeDrawers()
  }
}
