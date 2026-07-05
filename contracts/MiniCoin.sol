// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MiniCoin
 */

import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import './libs/Ethless.sol';

/// @dev we don't use Ownable2Step because the owner only has limited right for one-time minting
contract MiniCoin is Ethless, ERC20Burnable, Ownable {
    bool public minted;

    /// The contract is intended to be deployed as non-upgradeable
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) ERC20Permit(name_) {}

    function mint(address to, uint256 totalSupply_) external onlyOwner {
        require(totalSupply_ >= 1e18, 'MiniCoin: amount is too small');
        require(!minted, 'MiniCoin: Already minted');
        minted = true;
        _mint(to, totalSupply_);
    }

    function chainId() public view returns (uint256) {
        return block.chainid;
    }

    function version() public pure returns (string memory) {
        return '1';
    }

    function balanceOf(address account) public view override(ERC20, Ethless) returns (uint256 amount) {
        return Ethless.balanceOf(account);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20) {
        require(from == address(0) || balanceOf(from) >= amount, 'MiniCoin: Insufficient balance');
        ERC20._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20) {
        ERC20._afterTokenTransfer(from, to, amount);
    }
}
