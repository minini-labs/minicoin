// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './utils/console.sol';
import './utils/stdlib.sol';
import './utils/test.sol';
import { CheatCodes } from './utils/cheatcodes.sol';

import { MiniCoin } from '../MiniCoin.sol';

import './SharedHelper.t.sol';

contract MiniCoinTest is DSTest, SharedHelper {
    MiniCoin miniCoin;

    uint8 LOG_LEVEL = 0;
    uint256 ORIGIN_BLOCK_NUMBER = block.number;

    function setUp() public {
        // Deploy contracts
        miniCoin = new MiniCoin('mini', 'mini');
        miniCoin.mint(address(this), 10 * 10**24);

        initialize_helper(LOG_LEVEL, address(miniCoin), address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Complex scenario
    function test_MiniCoin_multiTxn_transferAndBurn_sameBlock() public {
        uint256 AMOUNT_TO_TRANSFER = 100 * 10**18;
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
        miniCoin.transfer(USER1, AMOUNT_TO_TRANSFER);

        vm.prank(USER1);
        miniCoin.burn(AMOUNT_TO_TRANSFER);

        assertEq(miniCoin.balanceOf(address(this)), TOTALSUPPLY - AMOUNT_TO_TRANSFER);
        assertEq(miniCoin.balanceOf(USER1), 0);
        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }

    function test_MiniCoin_multiTxn_permitAndTransferFrom_sameBlock() public {
        uint256 AMOUNT_TO_TRANSFER = 100 * 10**18;

        miniCoin.transfer(USER1, AMOUNT_TO_TRANSFER);

        uint256 deadline = block.number + 100;

        eip712_permit_verified(
            USER1,
            USER1_PRIVATEKEY,
            AMOUNT_TO_TRANSFER,
            miniCoin.nonces(USER1),
            USER3,
            USER2,
            deadline
        );

        vm.prank(USER3);

        miniCoin.transferFrom(USER1, USER2, AMOUNT_TO_TRANSFER);
        assertEq(miniCoin.balanceOf(USER2), AMOUNT_TO_TRANSFER);
        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }

    function test_MiniCoin_multiTxn_allEthless_sameNonce_sameBlock() public {
        uint256 AMOUNT_TO_TRANSFER = 100 * 10**18;
        uint256 AMOUNT_TO_RESERVE = 40 * 10**18;
        uint256 deadline = block.number + 100;
        uint256 feeToPay = 100;
        uint256 nonce = 54645;
        miniCoin.transfer(USER1, AMOUNT_TO_TRANSFER + AMOUNT_TO_RESERVE + feeToPay);

        eip712_transfer_verified(
            USER1,
            USER1_PRIVATEKEY,
            AMOUNT_TO_TRANSFER,
            miniCoin.nonces(USER1),
            USER3,
            USER2,
            deadline
        );

        eip191_reserve_verified(
            USER3,
            USER3_PRIVATEKEY,
            AMOUNT_TO_RESERVE,
            feeToPay,
            nonce,
            USER4,
            USER5,
            USER2,
            deadline,
            false
        );
        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }

    function test_MiniCoin_multiTxn_burnFromAfterTransfer_sameBlock() public {
        uint256 amountToTransfer = 1000;
        uint256 amountToBurn = 600;
        uint256 deadline = block.number + 100;
        uint256 originalBalance = amountToTransfer + amountToBurn + 1;
        miniCoin.transfer(USER1, originalBalance);

        eip712_transfer_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            miniCoin.nonces(USER1),
            USER3,
            USER2,
            deadline
        );
        eip712_permit_verified(USER1, USER1_PRIVATEKEY, amountToBurn, miniCoin.nonces(USER1), USER2, USER2, deadline);

        vm.prank(USER2);
        miniCoin.burnFrom(USER1, amountToBurn);
        assertEq(miniCoin.balanceOf(USER1), originalBalance - amountToBurn - amountToTransfer);
        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }
}
