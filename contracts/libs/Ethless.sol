// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title Ethless
 */

import '@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol';

import './ERC20Reservable.sol';

abstract contract Ethless is ERC20Permit, ERC20Reservable {
    using ECDSA for bytes32;

    // keccak256("Transfer(address sender,address recipient,uint256 amount,uint256 nonce,uint256 deadline)")
    bytes32 private constant _TRANSFER_TYPEHASH = 0xa43cfdcd630933b29083d1c5116d122bcc478eab04dd62c15dd45c3bdc58ce85;

    enum EthlessTxnType {
        NONE, // 0, Placeholder for legacy type
        BURN, // 1, Placeholder for legacy type
        MINT, // 2, Placeholder for legacy type
        TRANSFER, // 3, Placeholder for legacy type
        RESERVE // 4
    }

    mapping(address => mapping(uint256 => mapping(EthlessTxnType => bool))) private _nonceUsed;

    function _useNonce(
        address signer_,
        uint256 nonce_,
        EthlessTxnType txnType_
    ) internal {
        require(!_nonceUsed[signer_][nonce_][txnType_], 'Ethless: nonce already used');
        _nonceUsed[signer_][nonce_][txnType_] = true;
    }

    function _validateEthlessHash(
        address signer_,
        bytes32 structHash_,
        bytes memory signature_
    ) internal pure {
        bytes32 messageHash = structHash_.toEthSignedMessageHash();
        address signer = messageHash.recover(signature_);
        require(signer == signer_, 'Ethless: invalid signature');
    }

    function transferBySignature(
        address sender,
        address recipient,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual {
        require(block.timestamp <= deadline, 'Ethless: expired deadline');

        bytes32 structHash = keccak256(
            abi.encode(_TRANSFER_TYPEHASH, sender, recipient, amount, _useNonce(sender), deadline)
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == sender, 'Ethless: invalid signature');

        _transfer(signer, recipient, amount);
    }

    function reserve(
        address signer_,
        address to_,
        address executor_,
        uint256 amount_,
        uint256 fee_,
        uint256 nonce_,
        uint256 deadline_,
        bytes calldata signature_
    ) external returns (bool succcess) {
        _useNonce(signer_, nonce_, EthlessTxnType.RESERVE);

        bytes32 structHash = keccak256(
            abi.encodePacked(
                EthlessTxnType.RESERVE,
                block.chainid,
                address(this),
                signer_,
                to_,
                executor_,
                amount_,
                fee_,
                nonce_,
                deadline_
            )
        );
        _validateEthlessHash(signer_, structHash, signature_);

        _reserve(signer_, to_, executor_, amount_, fee_, nonce_, deadline_);
        return true;
    }

    function balanceOf(address account) public view virtual override(ERC20, ERC20Reservable) returns (uint256 amount) {
        return ERC20Reservable.balanceOf(account);
    }
}
