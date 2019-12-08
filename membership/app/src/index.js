import React from 'react'
import ReactDOM from 'react-dom'
import { AragonApi } from '@aragon/api-react'
import App from './App'

const reducer = (state, action) => {
  console.log('reducer called', {action})
  if (state === null) {
    return {
      subscriptions: 0,
      isSyncing: true,
      name: "",
      symbol: "",
    }
  }
  return state
}

ReactDOM.render(
  <AragonApi reducer={reducer}>
    <App />
  </AragonApi>,
  document.getElementById('root')
)
