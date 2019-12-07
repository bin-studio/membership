import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import { first } from 'rxjs/operators'

const app = new Aragon()

app.store(async (state, { event }) => {
  console.log('event trigger')
  let nextState = { ...state }
  console.log('before', {nextState})

  // Initial state
  if (state == null) {
    // const values = await new PromiseAll([
    //   await app.call('name').toPromise(),
    //   await app.call('symbol').toPromise(),
    //   await getValue()
    // ])
    nextState = {
      account: (await app.accounts().pipe(first()).toPromise())[0],
      name: await app.call('name').toPromise(),
      symbol: await app.call('symbol').toPromise(),
      subscriptions: await getValue()
    }
  }

  let account = (await app.accounts().pipe(first()).toPromise())[0]
  console.log({account})

  switch (event) {
    case 'NewSubscription':
      console.log({event})
      nextState = { ...nextState, subscriptions: await getValue() }
      break
    case events.SYNC_STATUS_SYNCING:
      nextState = { ...nextState, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      nextState = { ...nextState, isSyncing: false }
      break
    default:
        console.log('unknown event', {event})
  }

  return nextState
})

async function getValue() {
  const totalSubscriptions = await app.call('totalSubscriptions').toPromise()
  console.log({totalSubscriptions})
  return parseInt(totalSubscriptions, 10)
}
