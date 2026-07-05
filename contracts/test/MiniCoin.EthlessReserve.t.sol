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

    function setUp() public {
        // Deploy contracts
        miniCoin = new MiniCoin('mini', 'mini');
        miniCoin.mint(address(this), 10 * 10**24);

        initialize_helper(LOG_LEVEL, address(miniCoin), address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Ethless Reserve
    function test_MiniCoin_ethless_reserve() public {
        uint256 amountToReserve = 1000;
        uint256 feeToPay = 100;
        uint256 nonce = 54645;
        uint256 deadline = block.number + 10;

        eip191_reserve_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToReserve,
            feeToPay,
            nonce,
            USER3,
            USER4,
            USER2,
            deadline,
            true
        );
    }

    function test_MiniCoin_ethless_reserve_reuseSameNonce() public {
        uint256 amountToReserve = 1000;
        uint256 feeToPay = 100;
        uint256 nonce = 54645;
        uint256 deadline = block.number + 10;

        eip191_reserve_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToReserve,
            feeToPay,
            nonce,
            USER3,
            USER4,
            USER2,
            deadline,
            true
        );

        bytes memory signature = eip191_sign_reserve(
            USER1,
            USER1_PRIVATEKEY,
            amountToReserve,
            feeToPay,
            nonce,
            USER3,
            USER4,
            deadline
        );

        vm.prank(USER2);
        vm.expectRevert('Ethless: nonce already used');
        MiniCoin(_miniCoin).reserve(USER1, USER3, USER4, amountToReserve, feeToPay, nonce, deadline, signature);
    }

    function test_MiniCoin_ethless_reserve_andTransferSameBlock() public {
        uint256 amountToReserve = 500;
        uint256 feeToPay = 100;
        uint256 amountToTransfer = 400;

        miniCoin.transfer(USER1, amountToReserve + feeToPay + amountToTransfer);
        assertEq(miniCoin.balanceOf(USER1), amountToReserve + feeToPay + amountToTransfer);

        uint256 nonce = 54645;
        uint256 deadline = block.number + 10;

        eip191_reserve_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToReserve,
            feeToPay,
            nonce,
            USER3,
            USER4,
            USER2,
            deadline,
            false
        );

        vm.prank(USER1);
        miniCoin.transfer(USER3, amountToTransfer);

        assertEq(miniCoin.balanceOf(USER1), 0);
        assertEq(miniCoin.balanceOf(USER3), amountToTransfer);
    }

    function test_MiniCoin_ethless_reserve_andTransferLessSameBlock() public {
        uint256 amountToReserve = 500;
        uint256 feeToPay = 100;
        uint256 amountToTransfer = 400;

        miniCoin.transfer(USER1, amountToReserve + feeToPay + amountToTransfer);
        assertEq(miniCoin.balanceOf(USER1), amountToReserve + feeToPay + amountToTransfer);

        uint256 nonce = 54645;
        uint256 deadline = block.number + 10;

        eip191_reserve_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToReserve,
            feeToPay,
            nonce,
            USER3,
            USER4,
            USER2,
            deadline,
            false
        );

        vm.prank(USER1);
        miniCoin.transfer(USER3, amountToTransfer - 1);

        assertEq(miniCoin.balanceOf(USER1), 1);
        assertEq(miniCoin.balanceOf(USER3), amountToTransfer - 1);
    }

    function test_MiniCoin_ethless_reserve_andTransferMoreSameBlock() public {
        uint256 amountToReserve = 500;
        uint256 feeToPay = 100;
        uint256 amountToTransfer = 400;

        miniCoin.transfer(USER1, amountToReserve + feeToPay + amountToTransfer);
        assertEq(miniCoin.balanceOf(USER1), amountToReserve + feeToPay + amountToTransfer);

        uint256 nonce = 54645;
        uint256 deadline = block.number + 10;

        eip191_reserve_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToReserve,
            feeToPay,
            nonce,
            USER3,
            USER4,
            USER2,
            deadline,
            false
        );

        vm.prank(USER1);
        vm.expectRevert('MiniCoin: Insufficient balance');
        miniCoin.transfer(USER3, amountToTransfer + 1);

        assertEq(miniCoin.balanceOf(USER1), amountToTransfer);
        assertEq(miniCoin.balanceOf(USER3), 0);
    }
}
