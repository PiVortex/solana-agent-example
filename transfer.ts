import { contracts, chainAdaptersm, utils } from "chainsig.js";
import { Connection as SolanaConnection } from "@solana/web3.js";
import { requestSignature } from "@neardefi/shade-agent-js";
const { uint8ArrayToHex } = utils.cryptography;

// Set up a chain signature contract instance
const MPC_CONTRACT = new contracts.ChainSignatureContract({
  networkId: `testnet`,
  contractId: `v1.signer-prod.testnet`,
});

// Set up a new solana connection
const connection = new SolanaConnection("https://api.devnet.solana.com");

// Set up a chain signatures chain adapter for the Solana network
export const Solana = new chainAdapters.solana.Solana({
  solanaConnection: connection,
  contract: MPC_CONTRACT,
}) as any;

// Derive the Solana public key which is the same as the account 
const { publicKey } = await Solana.deriveAddressAndPublicKey(
  contractId,
  "solana-1",
);

// Optionally prepare data field here if other then a transfer 

// Prepare the Solana transaction
const { transaction, hashesToSign } = await Solana.prepareTransactionForSigning({
  from: publicKey,
  to: "G58AYKiiNy7wwjPAeBAQWTM6S1kJwP3MQ3wRWWhhSJxA",
  amount: BigInt(100000),
  // data
});

// Call the agent contract to get a signature for the payload
const signRes = await requestSignature({
  path: "solana-1",
  payload: uint8ArrayToHex(hashesToSign[0]),
  keyType: "Eddsa",
});
console.log("signRes", signRes);

// Reconstruct the signed transaction
const signedTransaction = Solana.finalizeTransactionSigning({
  transaction: transaction.transaction,
  rsvSignatures: { signature: Uint8Array.from(signRes.signature) },
  senderAddress: publicKey,
});

// Broadcast the signed transaction
const txHash = await Solana.broadcastTx(signedTransaction);
