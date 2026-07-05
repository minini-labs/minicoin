const { ethers, network } = require('hardhat');

module.exports = {
    signReserve: async function (
        domain,
        chainId,
        contractAddress,
        sourceAddress,
        sourcePrivateKey,
        targetAddress,
        executorAddress,
        amount,
        fee,
        nonce,
        expiryBlockNum
    ) {
        const wallet = new ethers.Wallet(sourcePrivateKey);

        // Construct the hash (same as in Solidity)
        const types = [
            'uint8',
            'uint256',
            'address',
            'address',
            'address',
            'address',
            'uint256',
            'uint256',
            'uint256',
            'uint256'
        ];

        const values = [
            domain,
            chainId,
            contractAddress,
            sourceAddress,
            targetAddress,
            executorAddress,
            amount,
            fee,
            nonce,
            expiryBlockNum
        ];

        const hash = ethers.utils.solidityKeccak256(types, values);

        const signature = await wallet.signMessage(ethers.utils.arrayify(hash));
        return signature;
    },
    signTransfer: async function (
        name,
        version,
        contractAddress,
        wallet,
        targetAddress,
        amount,
        nonce,
        expirationTimestamp
    ) {
        const signature = await wallet._signTypedData(
            {
                name,
                version,
                chainId: network.config.chainId,
                verifyingContract: contractAddress
            },
            {
                // Transfer(address sender,address recipient,uint256 amount,uint256 nonce,uint256 deadline)
                Transfer: [
                    {
                        name: 'sender',
                        type: 'address'
                    },
                    {
                        name: 'recipient',
                        type: 'address'
                    },
                    {
                        name: 'amount',
                        type: 'uint256'
                    },
                    {
                        name: 'nonce',
                        type: 'uint256'
                    },
                    {
                        name: 'deadline',
                        type: 'uint256'
                    }
                ]
            },
            {
                sender: wallet.address,
                recipient: targetAddress,
                amount: amount,
                nonce,
                deadline: expirationTimestamp
            }
        );
        return ethers.utils.splitSignature(signature);
    },
    signPermit: async function (
        name,
        version,
        contractAddress,
        wallet,
        targetAddress,
        amount,
        nonce,
        expirationTimestamp
    ) {
        const signature = await wallet._signTypedData(
            {
                name,
                version,
                chainId: network.config.chainId,
                verifyingContract: contractAddress
            },
            {
                // Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
                Permit: [
                    {
                        name: 'owner',
                        type: 'address'
                    },
                    {
                        name: 'spender',
                        type: 'address'
                    },
                    {
                        name: 'value',
                        type: 'uint256'
                    },
                    {
                        name: 'nonce',
                        type: 'uint256'
                    },
                    {
                        name: 'deadline',
                        type: 'uint256'
                    }
                ]
            },
            {
                owner: wallet.address,
                spender: targetAddress,
                value: amount,
                nonce,
                deadline: expirationTimestamp
            }
        );
        return ethers.utils.splitSignature(signature);
    }
};
