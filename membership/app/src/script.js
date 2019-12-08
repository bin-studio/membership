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
      subscriptions: await getValue()
    }
  }

  switch (event) {
    case 'NewSubscription':
      nextState = { ...nextState, subscriptions: await getValue() }
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
