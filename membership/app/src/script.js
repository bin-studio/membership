import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import { first } from 'rxjs/operators'

const app = new Aragon()

app.store(async (state, {event, returnValues}) => {
  console.log('webworker reducer called')
  console.log({event, returnValues})
  let nextState = { ...state }

  // Initial state
  if (state == null) {
    nextState = {
      account: await getAccount(),
      name: await app.call('name').toPromise(),
      symbol: await app.call('symbol').toPromise(),
      subscriptionsTotal: await getValue(),
      subscriptions: []
    }
  }

  switch (event) {
    case 'NewSubscription':
      const subs = nextState.subscriptions.slice()
      // console.log('subs', subs)
      // console.log('returnValues', typeof returnValues)
      subs.push(returnValues)
      // console.log('new subs', subs)
      nextState = { ...nextState, subscriptionsTotal: await getValue(), subscriptions: subs }
      break
    case events.SYNC_STATUS_SYNCING:
      nextState = { ...nextState, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      nextState = { ...nextState, isSyncing: false }
      break
    case events.ACCOUNTS_TRIGGER:
        nextState = { ...nextState, account: await getAccount() }
      break
    default:
        console.log('unknown event', {event})
  }

  return nextState
})

async function getAccount() {
  return (await app.accounts().pipe(first()).toPromise())[0]
}

async function getValue() {
  const totalSubscriptions = await app.call('totalSubscriptions').toPromise()
  return parseInt(totalSubscriptions, 10)
}
