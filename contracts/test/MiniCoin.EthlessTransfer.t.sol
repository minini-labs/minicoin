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

    // Ethless Transfer
    function test_MiniCoin_ethless_transfer() public {
        uint256 amountToTransfer = 1000;
        uint256 deadline = block.number + 100;
        miniCoin.transfer(USER1, amountToTransfer);

        eip712_transfer_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            miniCoin.nonces(USER1),
            USER3,
            USER2,
            deadline
        );
    }

    function test_MiniCoin_ethless_transfer_reuseSameNonce() public {
        uint256 amountToTransfer = 1000;
        uint256 deadline = block.number + 100;
        uint256 nonce = miniCoin.nonces(USER1);
        miniCoin.transfer(USER1, amountToTransfer);

        eip712_transfer_verified(USER1, USER1_PRIVATEKEY, amountToTransfer, nonce, USER3, USER2, deadline);
        eip712_transfer(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            nonce,
            USER3,
            USER2,
            deadline,
            'Ethless: invalid signature'
        );
    }

    function test_MiniCoin_ethless_transfer_wrongSender() public {
        uint256 amountToTransfer = 1000;
        uint256 deadline = block.number + 100;
        uint256 nonce = miniCoin.nonces(USER1);
        miniCoin.transfer(USER1, amountToTransfer);
        uint256 lowerAmountToTransfer = amountToTransfer - 18;

        (uint8 signV, bytes32 signR, bytes32 signS) = eip712_sign_transfer(
            USER2,
            USER2_PRIVATEKEY,
            USER3,
            lowerAmountToTransfer,
            nonce,
            deadline
        );

        vm.prank(USER3);
        vm.expectRevert(bytes('Ethless: invalid signature'));
        MiniCoin(_miniCoin).transferBySignature(USER1, USER3, lowerAmountToTransfer, deadline, signV, signR, signS);
        assertEq(MiniCoin(_miniCoin).balanceOf(USER1), amountToTransfer);
    }

    function test_MiniCoin_ethless_transfer_topUpInBetween() public {
        uint256 amountToTransfer = 1000 + 3;
        uint256 deadline = block.number + 100;
        miniCoin.transfer(USER1, amountToTransfer);

        eip712_transfer_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            miniCoin.nonces(USER1),
            USER3,
            USER2,
            deadline
        );

        uint256 newAmountToTransfer = 2;
        miniCoin.transfer(USER1, newAmountToTransfer);
        eip712_transfer_verified(
            USER1,
            USER1_PRIVATEKEY,
            newAmountToTransfer,
            miniCoin.nonces(USER1),
            USER3,
            USER2,
            deadline
        );
    }
}
