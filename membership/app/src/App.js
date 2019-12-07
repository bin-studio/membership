import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'
import { first } from 'rxjs/operators'
// const getAccounts = require('@aragon/os/scripts/helpers/get-accounts')

function App() {
  const { api, appState } = useAragonApi()
  const {subscriptions, name, symbol, isSyncing } = appState
  console.log({subscriptions, name, symbol, isSyncing})
  async function checkAccount() {
    console.log('check')
    let account = (await api.accounts().pipe(first()).toPromise())[0]
    console.log({account})
    let subscriptions = await api.call('totalSubscriptions').toPromise()
    console.log({subscriptions})
    let name = await api.call('name').toPromise()
    console.log({name})
  }
  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <Name>Subscriptions: {subscriptions}</Name>
        <Name>Name: {name}</Name>
        <Name>Symbol: {symbol}</Name>
        <Buttons>
          <Button mode="secondary" onClick={() => api.addSubscription(1, 1, '0x' + '1'.repeat(40), '0x' + '1'.repeat(40)).toPromise()}>
            Add Subscription
          </Button>
          <Button mode="secondary" onClick={checkAccount}>
            Check
          </Button>
          {/* <Button mode="secondary" onClick={() => api.increment(1).toPromise()}>
            Increment
          </Button> */}
        </Buttons>
      </BaseLayout>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-direction: column;
`

const Name = styled.h1`
  font-size: 30px;
`

const Buttons = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 40px;
  margin-top: 20px;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
`

export default App
