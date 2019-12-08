/* global artifacts contract beforeEach it assert */

const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { getEventArgument } = require('@aragon/test-helpers/events')
const { hash } = require('eth-ens-namehash')
const deployDAO = require('./helpers/deployDAO')

const MembershipApp = artifacts.require('MembershipApp.sol')

const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'

contract('MembershipApp', ([appManager, user]) => {
  let app

  beforeEach('deploy dao and app', async () => {
    const { dao, acl } = await deployDAO(appManager)

    // Deploy the app's base contract.
    const appBase = await MembershipApp.new()

    // Instantiate a proxy for the app, using the base contract as its logic implementation.
    const instanceReceipt = await dao.newAppInstance(
      hash('counter.aragonpm.test'), // appId - Unique identifier for each app installed in the DAO; can be any bytes32 string in the tests.
      appBase.address, // appBase - Location of the app's base implementation.
      '0x', // initializePayload - Used to instantiate and initialize the proxy in the same call (if given a non-empty bytes string).
      false, // setDefault - Whether the app proxy is the default proxy.
      { from: appManager }
    )
    app = MembershipApp.at(
      getEventArgument(instanceReceipt, 'NewAppProxy', 'proxy')
    )

    // Set up the app's permissions.
    await acl.createPermission(
      ANY_ADDRESS, // entity (who?) - The entity or address that will have the permission.
      app.address, // app (where?) - The app that holds the role involved in this permission.
      await app.INCREMENT_ROLE(), // role (what?) - The particular role that the entity is being assigned to in this permission.
      appManager, // manager - Can grant/revoke further permissions for this role.
      { from: appManager }
    )
    await acl.createPermission(
      ANY_ADDRESS,
      app.address,
      await app.DECREMENT_ROLE(),
      appManager,
      { from: appManager }
    )

    await app.initialize("Token Name", "Token Symbol")
  })

  it('should be incremented by any address', async () => {
    await app.increment(1, { from: user })
    assert.equal(await app.value(), 1)
  })

  it('should not be decremented if already 0', async () => {
    await assertRevert(app.decrement(1), 'MATH_SUB_UNDERFLOW')
  })
})
