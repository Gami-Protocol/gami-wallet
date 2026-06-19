import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';

import { type ChainConfig, type ChainId, CHAIN_ORDER, CHAINS } from '@/lib/wallet/chains';
import { getAddresses, revealMnemonic } from '@/lib/wallet/wallet';

function isEvmAddress(addr: string): addr is `0x${string}` {
  return addr.startsWith('0x');
}

/**
 * Read-only balance reads + native send flow for each supported chain.
 *
 * The mnemonic is only ever touched here transiently to derive a signer at
 * send time; it is never persisted outside SecureStore.
 */

export type Balance = {
  chain: ChainId;
  symbol: string;
  /** Human-readable balance string. */
  amount: string;
  /** Numeric value for sorting / display. */
  value: number;
};

const SOLANA_PATH = "m/44'/501'/0'/0'";

async function readEvmBalance(cfg: ChainConfig, address: `0x${string}`): Promise<Balance> {
  if (!cfg.viemChain) throw new Error('Missing viem chain');
  const client = createPublicClient({ chain: cfg.viemChain, transport: http(cfg.rpc) });
  const wei = await client.getBalance({ address });
  const amount = formatEther(wei);
  return { chain: cfg.id, symbol: cfg.symbol, amount, value: Number(amount) };
}

async function readSolanaBalance(cfg: ChainConfig, address: string): Promise<Balance> {
  const conn = new Connection(cfg.rpc, 'confirmed');
  const lamports = await conn.getBalance(new PublicKey(address));
  const value = lamports / LAMPORTS_PER_SOL;
  return { chain: cfg.id, symbol: cfg.symbol, amount: value.toString(), value };
}

/** Read every chain's native balance. Failures resolve to a zero balance. */
export async function readAllBalances(): Promise<Balance[]> {
  const addrs = await getAddresses();
  if (!addrs) return [];
  const results = await Promise.all(
    CHAIN_ORDER.map(async (id) => {
      const cfg = CHAINS[id];
      try {
        if (cfg.kind === 'evm') return await readEvmBalance(cfg, addrs.evm);
        return await readSolanaBalance(cfg, addrs.solana);
      } catch {
        return { chain: id, symbol: cfg.symbol, amount: '0', value: 0 } satisfies Balance;
      }
    }),
  );
  return results;
}

export type FeeEstimate = {
  /** Estimated fee in native units. */
  fee: number;
  /** Whether the fee exceeds this chain's ceiling. */
  exceedsCeiling: boolean;
  ceiling: number;
};

export async function estimateFee(chain: ChainId): Promise<FeeEstimate> {
  const cfg = CHAINS[chain];
  let fee = 0;
  try {
    if (cfg.kind === 'evm' && cfg.viemChain) {
      const client = createPublicClient({ chain: cfg.viemChain, transport: http(cfg.rpc) });
      const gasPrice = await client.getGasPrice();
      // 21000 gas for a native transfer.
      const weiFee = gasPrice * 21000n;
      fee = Number(formatEther(weiFee));
    } else {
      const conn = new Connection(cfg.rpc, 'confirmed');
      const { feeCalculator } = await conn.getRecentBlockhash();
      fee = feeCalculator.lamportsPerSignature / LAMPORTS_PER_SOL;
    }
  } catch {
    fee = 0;
  }
  return { fee, exceedsCeiling: fee > cfg.feeCeiling, ceiling: cfg.feeCeiling };
}

export type SendResult = { hash: string };

/**
 * Submit a native-token transfer. Re-checks the fee ceiling before signing and
 * throws if exceeded. Caller MUST have completed a fresh Face ID prompt first.
 */
export async function sendNative(chain: ChainId, to: string, amount: string): Promise<SendResult> {
  const cfg = CHAINS[chain];
  const mnemonic = await revealMnemonic();
  if (!mnemonic) throw new Error('No wallet found');

  const est = await estimateFee(chain);
  if (est.exceedsCeiling) {
    throw new Error('Network fee is too high right now. Try again later.');
  }

  if (cfg.kind === 'evm' && cfg.viemChain) {
    if (!isEvmAddress(to)) throw new Error('Invalid EVM address');
    const account = mnemonicToAccount(mnemonic);
    const wallet = createWalletClient({ account, chain: cfg.viemChain, transport: http(cfg.rpc) });
    const hash = await wallet.sendTransaction({
      account,
      to,
      value: parseEther(amount),
      chain: cfg.viemChain,
    });
    return { hash };
  }

  // Solana
  const seed = mnemonicToSeedSync(mnemonic);
  const node = HDKey.fromMasterSeed(seed).derive(SOLANA_PATH);
  if (!node.privateKey) throw new Error('Failed to derive Solana key');
  const keypair = Keypair.fromSeed(node.privateKey);
  const conn = new Connection(cfg.rpc, 'confirmed');
  const { SystemProgram, Transaction, sendAndConfirmTransaction } = await import('@solana/web3.js');
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(to),
      lamports: Math.round(Number(amount) * LAMPORTS_PER_SOL),
    }),
  );
  const hash = await sendAndConfirmTransaction(conn, tx, [keypair]);
  return { hash };
}
