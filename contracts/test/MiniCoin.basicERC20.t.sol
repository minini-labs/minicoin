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

        initialize_helper(LOG_LEVEL, address(miniCoin), address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Basic ERC20 Call
    function test_MiniCoin_basicERC20_name() public {
        assertEq(miniCoin.name(), NAME);
    }

    function test_MiniCoin_basicERC20_symbol() public {
        assertEq(miniCoin.symbol(), SYMBOL);
    }

    function test_MiniCoin_basicERC20_decimals() public {
        assertEq(miniCoin.decimals(), 18);
    }

    function test_MiniCoin_basicERC20_chainId() public {
        assertEq(miniCoin.chainId(), 99);
    }

    function test_MiniCoin_ownerCanMintOnce() public {
        uint256 amount = 1_000e18;

        // Owner mints
        miniCoin.mint(address(this), amount);

        assertEq(miniCoin.totalSupply(), amount);
        assertEq(miniCoin.balanceOf(address(this)), amount);
    }

    function test_MiniCoin_ownerCannotMintTwice() public {
        uint256 amount = 1_000e18;

        // First mint is OK
        miniCoin.mint(address(this), amount);

        // Second mint should revert
        vm.expectRevert('MiniCoin: Already minted');
        miniCoin.mint(address(this), amount);
    }

    function test_MiniCoin_transferOwnership_andMintOnce() public {
        uint256 amount = 1_000e18;
        address newOwner = address(0xCAFE);

        // Transfer ownership to newOwner
        miniCoin.transferOwnership(newOwner);

        vm.prank(newOwner);
        miniCoin.mint(newOwner, amount);

        assertEq(miniCoin.balanceOf(newOwner), amount);

        vm.prank(newOwner);
        vm.expectRevert('MiniCoin: Already minted');
        miniCoin.mint(newOwner, amount);
    }

    function test_MiniCoin_mint_transferOwnership_andMintOnce() public {
        uint256 amount = 1_000e18;
        miniCoin.mint(address(this), amount);

        address newOwner = address(0xCAFE);

        // Transfer ownership to newOwner
        miniCoin.transferOwnership(newOwner);

        vm.prank(newOwner);
        assertEq(miniCoin.balanceOf(newOwner), 0);

        vm.prank(newOwner);
        vm.expectRevert('MiniCoin: Already minted');
        miniCoin.mint(newOwner, amount);
    }

    function test_MiniCoin_nonOwnerCannotMint() public {
        uint256 amount = 1_000e18;

        address attacker = address(0xBEEF);

        vm.prank(attacker);
        vm.expectRevert('Ownable: caller is not the owner');
        miniCoin.mint(attacker, amount);
    }

    function test_MiniCoin_onlyOnceEvenIfDifferentAddress() public {
        uint256 amount = 1_000e18;

        // Owner mints once
        miniCoin.mint(address(this), amount);

        // Any address should fail afterwards
        address attacker = address(0xCAFE);

        vm.prank(attacker);
        vm.expectRevert('Ownable: caller is not the owner');
        miniCoin.mint(attacker, amount);
    }

    function test_Revert_AmountTooSmall() public {
        uint256 smallAmount = 1e18 - 1; // fails by 1 wei

        vm.expectRevert('MiniCoin: amount is too small');
        miniCoin.mint(address(this), smallAmount);
    }
}
