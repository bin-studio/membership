import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'
import { first } from 'rxjs/operators'
import FooTokenABI from '../../build/contracts/FooToken.json'

const durationInSeconds = 5 /* minutes */ * 60 * 1000
const paymentAmount = 1
const subscriptionBaseURI = 'http://localhost:9000/.functions/tokenURI/'

function App() {
  const { api, appState } = useAragonApi()
  const {account, subscriptions, name, symbol, isSyncing } = appState
  console.log({account, subscriptions, name, symbol, isSyncing})

  async function getTokenAddress() {
    console.log('get token address')
    let network = await api.network().pipe(first()).toPromise()
    console.log({network})
    let address = FooTokenABI.networks[network.id].address
    console.log({address})
    return address
  }
  async function getAccount() {
    return (await api.accounts().pipe(first()).toPromise())[0]
  }
  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <Name>Subscriptions: {subscriptions}</Name>
        <Name>Name: {name}</Name>
        <Name>Symbol: {symbol}</Name>
        <Buttons>
          <Button mode="secondary" onClick={async () => api.addSubscription(durationInSeconds, paymentAmount, await getAccount(), await getTokenAddress(), subscriptionBaseURI).toPromise()}>
            Add Subscription
          </Button>
          {/* <Button mode="secondary" onClick={checkAccount}>
            Check
          </Button> */}
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
