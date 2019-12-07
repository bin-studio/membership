import React from 'react'
import ReactDOM from 'react-dom'
import { AragonApi } from '@aragon/api-react'
import App from './App'

const reducer = state => {
  console.log('reducer called')
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
