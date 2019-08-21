import runtime from '@skypager/runtime'

import { useEffect, useContext, createContext, useState } from 'react'

export const RuntimeContext = createContext(runtime)

export function useClientRequest(client, clientMethod, ...args) {
  const [requestState, updateRequestState] = useState({
    loading: true,
    data: undefined,
    error: undefined,
  })

  const makeRequest = async () => {
    try {
      const response = await client[clientMethod].call(client, ...args)
      updateRequestState({ data: response, loading: false, error: undefined })
    } catch (error) {
      updateRequestState({ data: undefined, loading: false, error: error })
    }
  }

  useEffect(() => {
    makeRequest()
  }, [clientMethod, ...args])

  return requestState
}

export function useRuntimeState(runtimeInstance = runtime, ...keys) {
  const { flatten, pick } = runtime.lodash
  const [currentState, updateState] = useState(() => runtimeInstance.currentState)

  keys = flatten(keys).filter(v => typeof v === 'string' && v && v.length)

  useEffect(() => {
    const disposer = runtime.state.observe(({ name, object }) => {
      if (keys.length) {
        updateState(object.toJSON())
      } else if (keys.indexOf(name) > -1) {
        updateState(pick(object.toJSON(), keys))
      }
    })

    return disposer
  }, [runtime.stateVersion])

  return currentState
}
