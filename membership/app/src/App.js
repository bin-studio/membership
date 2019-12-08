import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button, Field, TextInput } from '@aragon/ui'
import styled from 'styled-components'
import { first } from 'rxjs/operators'
try {
  var FooTokenABI = require('../../build/contracts/FooToken.json')
} catch (error) {
  console.log(`don't have fooToken ABI`)
}

const defaults = {
  paymentAmount: 1,
  durationInSeconds: 5 /* minutes */ * 60 * 1000,
  subscriptionBaseURI: 'http://localhost:9000/.functions/tokenURI/'
}

function App() {
  const { api, appState } = useAragonApi()
  const { account, subscriptions, name, symbol, isSyncing } = appState 

  async function getTokenAddress() {
    let network = await api.network().pipe(first()).toPromise()
    let address = FooTokenABI.networks[network.id].address
    return address
  }

  // add subscription
  const [newSubAmount, setNewSubAmount] = useState(defaults.paymentAmount)
  const [newSubDuration, setNewSubDuration] = useState(defaults.durationInSeconds)
  async function addSubscription(duration, amount) {
    return api.addSubscription(
      duration, // defaults.durationInSeconds,
      amount, // defaults.paymentAmount,
      account,
      await getTokenAddress(),
      defaults.subscriptionBaseURI
    ).toPromise()
  }

  // list subscriptions
  function SubscriptionsList(props) {
    const list = props.list || [];
    const listItems = list.map((sub, i) => 
      <li key={i}>
        ID – <span title={sub.subscriptionId}>{sub.subscriptionId.substr(0, 16)}...</span><br />
        Amount – {sub.amount} [??]<br />
        Frequency – {sub.durationInSeconds} seconds<br />
        <Button label="Subscribe" size="small" onClick={() => subscribe(sub.subscriptionId)} />
        <Button label="Delete" size="small" mode="negative" onClick={() => removeSubscription(sub.subscriptionId)}  />
      </li>
    )
    return (
      <ul>{listItems}</ul>
    )
  }

  // subscribe to subscription
  async function subscribe(subscriptionId) {
    console.log('subscribe to', subscriptionId)
    return api.subscribe(subscriptionId).toPromise()
  }
  // remove subscription
  async function removeSubscription(subscriptionId) {
    console.log('remove', subscriptionId)
    return api.removeSubscription(subscriptionId).toPromise()
  }

  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <Section>
          <Heading>Create new Membership</Heading>
          <form>
            <div>
              <Field label="Amount">
                <TextInput
                  type="number"
                  value={newSubAmount}
                  onChange={event => setNewSubAmount(event.target.value)}
                />
              </Field>
              <Field label="Frequency">
                <TextInput
                  type="number"
                  value={newSubDuration}
                  onChange={event => setNewSubDuration(event.target.value)}
                />
              </Field>
            </div>
            <Button mode="strong" onClick={() => addSubscription(newSubDuration, newSubAmount)}>
              Add Membership
            </Button>
          </form>
        </Section>
        <Section>
          <Heading>All Memberships</Heading>
          <SubscriptionsList list={subscriptions} />
        </Section>
        <Section>
          <Heading>Your Memberships</Heading>
        </Section>

        <Section>
          <Heading>Your Membership Badges (NFTs)</Heading>
        </Section>

        {/* <Name>Subscriptions: {subscriptions}</Name> */}
        {/* <Name>Name: {name}</Name> */}
        {/* <Name>Symbol: {symbol}</Name> */}
        {/* <Name>Account: {account}</Name> */}
        <Buttons>
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
  padding: 2em;
  min-height:100vh;
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

const CreateSubscriptionsForm = styled.div`
  display:flex;
  margin:2em 0;
  justify-content:space-between;
`
const Section = styled.section`
  margin:3em 0;
`
const Heading = styled.h2`
  font-weight:bolder;
  font-size:1.125em;
  margin-bottom:.5em;
`

export default App
