import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import { first } from 'rxjs/operators'

const app = new Aragon()

app.store(async (state, {event, returnValues}) => {
  // console.log('webworker reducer called')
  console.log({event, returnValues})

  // Initial state
  if (state == null) {
    state = {
      account: await getAccount(),
      name: await app.call('name').toPromise(),
      symbol: await app.call('symbol').toPromise(),
      subscriptionsTotal: await getValue(),
      subscriptions: [],
      instances: [],
      nfts: [],
    }
  }

  let subs = state.subscriptions

  // Update state
  switch (event) {
    case 'NewSubscription':
      subs.push(returnValues)
      state = { ...state, subscriptionsTotal: await getValue(), subscriptions: subs }
      break
    case 'RemovedSubscription':
      subs = subs.filter(sub => sub.subscriptionId !== returnValues.subscriptionId)
      state = { ...state, subscriptionsTotal: await getValue(), subscriptions: subs }
      break
    case 'Subscribed':
      // TODO - way to just store instances relative to the current account?
      // or good to save all instances anyways?
      // TODO - increment subscription.active value (or do in EXECUTED ?)
      state.instances.push(returnValues)
      break
    case 'Unsubscribed':
      let insts = state.instances.filter(sub => sub.subscriber !== returnValues.subscriber && sub.subscriptionId !== returnValues.subscriptionId)
      // TODO - decrement subscription.active value
      state = { ...state, instances: insts }
      break
    case 'Executed':
      state.nfts.push(returnValues)
      break
    case events.SYNC_STATUS_SYNCING:
      state = { ...state, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      state = { ...state, isSyncing: false }
      break
    case events.ACCOUNTS_TRIGGER:
      state = { ...state, account: await getAccount() }
      break
    default:
      console.log('unknown event', {event, returnValues})
  }

  // Always return state !
  return state
})

async function getAccount() {
  return (await app.accounts().pipe(first()).toPromise())[0]
}

async function getValue() {
  const totalSubscriptions = await app.call('totalSubscriptions').toPromise()
  return parseInt(totalSubscriptions, 10)
}
