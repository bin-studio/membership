import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button, Field, TextInput } from '@aragon/ui'
import styled from 'styled-components'
import { first } from 'rxjs/operators'
// import FooTokenABI from '../../build/contracts/FooToken.json'
var FooTokenABI
try {
  FooTokenABI = require('../../build/contracts/FooToken.json')
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
  const { name, symbol, account, subscriptions, instances, nfts, isSyncing } = appState 
  const symbl = symbol.toUpperCase()

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
        Fee – {sub.amount} {symbl}<br />
        Frequency – {sub.durationInSeconds} seconds<br />
        <Button label="Subscribe" size="small" onClick={() => subscribe(sub.subscriptionId, sub.tokenAddress, sub.amount)} />
        <Button label="Delete" size="small" mode="negative" onClick={() => removeSubscription(sub.subscriptionId)}  />
      </li>
    )
    return (
      <ul>{listItems}</ul>
    )
  }

  // subscribe to subscription
  async function subscribe(subscriptionId, tokenAddress, amount) {
    // TODO: decide and set amount to a better number
    // right now it just approves enough to allow the subscription to be executed once
    // either we set it as an option and multiply that number by amount
    // or we set it to a crazy high number
    console.log('subscribe to', subscriptionId)
    const intentParams = {
      token: { address: tokenAddress, value: amount * 2 }
      // gas: 500000
    }
    return api.subscribe(subscriptionId, intentParams).toPromise()
  }
  // remove subscription
  async function removeSubscription(subscriptionId) {
    console.log('remove', subscriptionId)
    return api.removeSubscription(subscriptionId).toPromise()
  }

  // list My Subscriptions
  function MySubscriptionsList(props) {
    const instances = props.instances || []
    const subscriptions = props.subscriptions || []
    // filter subscriptions list against instances with user
    const mySubs = subscriptions.filter(sub => instances.filter(inst => {
      return inst.subscriber === account && sub.subscriptionId === inst.subscriptionId
    }).length)
    const listItems = mySubs.map((sub, i) =>
      <li key={i}>
        ID – <span title={sub.subscriptionId}>{sub.subscriptionId.substr(0, 16)}...</span><br />
        Fee – {sub.amount} {symbl}<br />
        Frequency – {sub.durationInSeconds} seconds<br />
        <Button label="Pay Term" mode="positive" size="small" onClick={() => execute(sub.subscriptionId, account)} />
        <Button label="Unsubscribe" mode="negative" size="small" onClick={() => unsubscribe(sub.subscriptionId)} />
      </li>
    )
    return (
      <ul>{listItems}</ul>
    )
  }
  // unsubscribe
  async function unsubscribe(subscriptionId) {
    console.log('unsubscribe', subscriptionId)
    return api.unsubscribe(subscriptionId).toPromise()
  }
  // execute
  async function execute(subscriptionId, subscriberAddress) {
    console.log('pay term', {subscriptionId, subscriberAddress})
    return api.execute(subscriptionId, subscriberAddress).toPromise()
  }

  // list NFTs
  function MyNFTsList(props) {
    const nfts = props.nfts || []
    const myNfts = nfts.filter(nft => nft.subscriber === account)
    myNfts.reverse()
    const listItems = myNfts.map(nft => {
      const sub = subscriptions.find(sub => sub.subscriptionId === nft.subscriptionId)
      const secToDate = sec => new Date(sec * 1000).toUTCString()
      // const expires = new Date((Number(nft.paymentTime) + Number(sub.durationInSeconds)) * 1000)
      return <li  key={nft.nftId}>
        NFT - {nft.nftId.substr(0, 10)}...<br />
        Subscription - {nft.subscriptionId.substr(0, 10)}...<br />
        Paid - {secToDate(nft.paymentTime)}<br />
        Valid Until – {secToDate(Number(nft.paymentTime) + Number(sub.durationInSeconds))}
      </li>
    })
    return (<ul>{listItems}</ul>)
  }


  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <Section>
          <Heading>Create new Membership</Heading>
          <form>
            <div>
              <Field label="Fee">
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
          <MySubscriptionsList instances={instances} subscriptions={subscriptions} />
        </Section>

        <Section>
          <Heading>Your Membership Badges (NFTs)</Heading>
          <MyNFTsList nfts={nfts} />
        </Section>

        {/* <Name>Subscriptions: {subscriptions}</Name> */}
        {/* <Name>Name: {name}</Name> */}
        {/* <Name>Symbol: {symbl}</Name> */}
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
