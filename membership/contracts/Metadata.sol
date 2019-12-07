pragma solidity ^0.4.18;

/**
* Metadata contract returns the tokenURI as a string with the token ID
*/

import "./helpers/strings.sol";


contract Metadata {
    using strings for *;
    function getURI(uint _tokenId) public view returns (string);

    function tokenURI( uint _tokenId) external view returns (string _infoUrl) {
        string memory base = getURI(_tokenId); // "https://example.com/token/";
        string memory id = uint2str(_tokenId);
        return base.toSlice().concat(id.toSlice());
    }
    // function uint2hexstr(uint i) internal pure returns (string) {
    //     if (i == 0) return "0";
    //     uint j = i;
    //     uint length;
    //     while (j != 0) {
    //         length++;
    //         j = j >> 4;
    //     }
    //     uint mask = 15;
    //     bytes memory bstr = new bytes(length);
    //     uint k = length - 1;
    //     while (i != 0){
    //         uint curr = (i & mask);
    //         bstr[k--] = curr > 9 ? byte(55 + curr) : byte(48 + curr); // 55 = 65 - 10
    //         i = i >> 4;
    //     }
    //     return string(bstr);
    // }

    function uint2str(uint i) internal pure returns (string memory) {
        if (i == 0) return "0";
        uint j = i;
        uint length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint k = length - 1;
        while (i != 0) {
            uint _uint = 48 + i % 10;
            bstr[k--] = toBytes(_uint)[31];
            i /= 10;
        }
        return string(bstr);
    }
    function toBytes(uint256 x) public pure returns (bytes memory b) {
        b = new bytes(32);
        assembly { mstore(add(b, 32), x) }
    }
}