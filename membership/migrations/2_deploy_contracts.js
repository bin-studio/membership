/* global artifacts */
var FooToken = artifacts.require('FooToken.sol')

module.exports = function(deployer) {
  deployer.deploy(FooToken, "FooToken", "FT", 0)
}
