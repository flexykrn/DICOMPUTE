// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/JobEscrow.sol";

contract SignatureDebugTest is Test {
    function test_SignatureRecovery() public {
        // Known private key for address(2) in Foundry
        uint256 privateKey = 2;
        address expectedAddr = vm.addr(privateKey);
        
        console.log("Expected address:", expectedAddr);
        
        bytes32 digest = keccak256(abi.encodePacked("test"));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        
        console.log("v:", v);
        console.log("r:", uint256(r));
        console.log("s:", uint256(s));
        
        address recovered = ecrecover(digest, v, r, s);
        console.log("Recovered:", recovered);
        
        assertEq(recovered, expectedAddr);
    }
}
