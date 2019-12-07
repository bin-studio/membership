pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";


contract FooToken is ERC20, ERC20Detailed {
    constructor(string name, string symbol, uint8 decimals) ERC20Detailed(name, symbol, decimals) {
        _mint(msg.sender, 1000);
    }
}