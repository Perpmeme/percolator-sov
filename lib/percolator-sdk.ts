/**
 * Browser-compatible SDK wrapper around the percolator-cli logic.
 * Uses wallet adapter instead of keypair files.
 */
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  type Commitment,
} from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { WalletContextState } from "@solana/wallet-adapter-react";

// Re-export the ABI and slab parsers from the existing CLI code
import {
  encodeInitUser,
  encodeDepositCollateral,
  encodeWithdrawCollateral,
  encodeKeeperCrank,
  encodeTradeCpi,
} from "@/src/abi/instructions";
import {
  buildAccountMetas,
  ACCOUNTS_INIT_USER,
  ACCOUNTS_DEPOSIT_COLLATERAL,
  ACCOUNTS_WITHDRAW_COLLATERAL,
  ACCOUNTS_KEEPER_CRANK,
  ACCOUNTS_TRADE_CPI,
  WELL_KNOWN,
} from "@/src/abi/accounts";
import { deriveVaultAuthority, deriveLpPda } from "@/src/solana/pda";
import { parseErrorFromLogs } from "@/src/abi/errors";
import {
  fetchSlab,
  parseConfig,
  parseHeader,
  parseEngine,
  parseAccount,
  parseAllAccounts,
  parseParams,
  parseUsedIndices,
  type MarketConfig,
  type EngineState,
  type Account,
  type SlabHeader,
  type RiskParams,
  AccountKind,
} from "@/src/solana/slab";

// Devnet market config
import devnetMarket from "@/devnet-market.json";

export {
  type MarketConfig,
  type EngineState,
  type Account,
  type SlabHeader,
  type RiskParams,
  AccountKind,
};

// =============================================================================
// Constants
// =============================================================================

export const DEVNET_PROGRAM_ID = new PublicKey(devnetMarket.programId);
export const DEVNET_MATCHER_PROGRAM_ID = new PublicKey(devnetMarket.matcherProgramId);
export const DEVNET_SLAB = new PublicKey(devnetMarket.slab);
export const DEVNET_ORACLE = new PublicKey(devnetMarket.oracle);
export const DEVNET_LP_INDEX = devnetMarket.lp.index;
export const DEVNET_VAMM_LP_INDEX = devnetMarket.vammLp.index;
export const DEVNET_MATCHER_CONTEXT = new PublicKey(devnetMarket.lp.matcherContext);
export const DEVNET_VAMM_MATCHER_CONTEXT = new PublicKey(devnetMarket.vammLp.matcherContext);

const CRANK_NO_CALLER = 65535;

// =============================================================================
// Transaction result type
// =============================================================================

export interface TxResult {
  signature: string;
  slot: number;
  err: string | null;
  hint?: string;
  logs: string[];
}

// =============================================================================
// Core SDK class
// =============================================================================

export class PercolatorSDK {
  constructor(
    public connection: Connection,
    public programId: PublicKey,
    public commitment: Commitment = "confirmed"
  ) {}

  // ---------------------------------------------------------------------------
  // Read helpers
  // ---------------------------------------------------------------------------

  async fetchSlabData(slabPk: PublicKey): Promise<Buffer> {
    return fetchSlab(this.connection, slabPk);
  }

  parseMarketConfig(data: Buffer): MarketConfig {
    return parseConfig(data);
  }

  parseSlabHeader(data: Buffer): SlabHeader {
    return parseHeader(data);
  }

  parseEngineState(data: Buffer): EngineState {
    return parseEngine(data);
  }

  parseRiskParams(data: Buffer): RiskParams {
    return parseParams(data);
  }

  parseAccountAtIndex(data: Buffer, idx: number): Account {
    return parseAccount(data, idx);
  }

  parseAllAccounts(data: Buffer): { idx: number; account: Account }[] {
    return parseAllAccounts(data);
  }

  getUsedIndices(data: Buffer): number[] {
    return parseUsedIndices(data);
  }

  /**
   * Find a user's account index in the slab by owner pubkey.
   */
  findUserAccount(
    data: Buffer,
    owner: PublicKey
  ): { idx: number; account: Account } | null {
    const all = this.parseAllAccounts(data);
    return (
      all.find(
        (a) =>
          a.account.owner.toBase58() === owner.toBase58() &&
          a.account.kind === AccountKind.User
      ) ?? null
    );
  }

  // ---------------------------------------------------------------------------
  // Transaction builders (return unsigned Transaction for wallet signing)
  // ---------------------------------------------------------------------------

  async buildInitUserTx(
    wallet: PublicKey,
    slabPk: PublicKey,
    feePayment: bigint
  ): Promise<Transaction> {
    const data = await this.fetchSlabData(slabPk);
    const cfg = this.parseMarketConfig(data);
    const userAta = await getAssociatedTokenAddress(cfg.collateralMint, wallet);

    const ixData = encodeInitUser({ feePayment: feePayment.toString() });
    const keys = buildAccountMetas(ACCOUNTS_INIT_USER, [
      wallet,
      slabPk,
      userAta,
      cfg.vaultPubkey,
      WELL_KNOWN.tokenProgram,
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys,
      data: ixData,
    });

    return this.buildTransaction([ix]);
  }

  async buildDepositTx(
    wallet: PublicKey,
    slabPk: PublicKey,
    userIdx: number,
    amount: bigint
  ): Promise<Transaction> {
    const data = await this.fetchSlabData(slabPk);
    const cfg = this.parseMarketConfig(data);
    const userAta = await getAssociatedTokenAddress(cfg.collateralMint, wallet);

    const ixData = encodeDepositCollateral({
      userIdx,
      amount: amount.toString(),
    });
    const keys = buildAccountMetas(ACCOUNTS_DEPOSIT_COLLATERAL, [
      wallet,
      slabPk,
      userAta,
      cfg.vaultPubkey,
      WELL_KNOWN.tokenProgram,
      WELL_KNOWN.clock,
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys,
      data: ixData,
    });

    return this.buildTransaction([ix]);
  }

  async buildWithdrawTx(
    wallet: PublicKey,
    slabPk: PublicKey,
    userIdx: number,
    amount: bigint
  ): Promise<Transaction> {
    const data = await this.fetchSlabData(slabPk);
    const cfg = this.parseMarketConfig(data);
    const userAta = await getAssociatedTokenAddress(cfg.collateralMint, wallet);
    const [vaultPda] = deriveVaultAuthority(this.programId, slabPk);

    const ixData = encodeWithdrawCollateral({
      userIdx,
      amount: amount.toString(),
    });
    const keys = buildAccountMetas(ACCOUNTS_WITHDRAW_COLLATERAL, [
      wallet,
      slabPk,
      cfg.vaultPubkey,
      userAta,
      vaultPda,
      WELL_KNOWN.tokenProgram,
      WELL_KNOWN.clock,
      cfg.indexFeedId,
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys,
      data: ixData,
    });

    return this.buildTransaction([ix]);
  }

  async buildCrankTx(
    wallet: PublicKey,
    slabPk: PublicKey,
    oraclePk: PublicKey,
    computeUnits?: number
  ): Promise<Transaction> {
    const ixData = encodeKeeperCrank({
      callerIdx: CRANK_NO_CALLER,
      allowPanic: false,
    });
    const keys = buildAccountMetas(ACCOUNTS_KEEPER_CRANK, [
      wallet,
      slabPk,
      WELL_KNOWN.clock,
      oraclePk,
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys,
      data: ixData,
    });

    const ixs: TransactionInstruction[] = [];
    if (computeUnits) {
      ixs.push(
        ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits })
      );
    }
    ixs.push(ix);

    return this.buildTransaction(ixs);
  }

  async buildTradeCpiTx(
    wallet: PublicKey,
    slabPk: PublicKey,
    lpIdx: number,
    userIdx: number,
    size: bigint,
    matcherProgram: PublicKey,
    matcherContext: PublicKey
  ): Promise<Transaction> {
    const data = await this.fetchSlabData(slabPk);
    const cfg = this.parseMarketConfig(data);
    const lpAccount = this.parseAccountAtIndex(data, lpIdx);
    const [lpPda] = deriveLpPda(this.programId, slabPk, lpIdx);

    const ixData = encodeTradeCpi({
      lpIdx,
      userIdx,
      size: size.toString(),
    });
    const keys = buildAccountMetas(ACCOUNTS_TRADE_CPI, [
      wallet,
      lpAccount.owner,
      slabPk,
      WELL_KNOWN.clock,
      cfg.indexFeedId,
      matcherProgram,
      matcherContext,
      lpPda,
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys,
      data: ixData,
    });

    return this.buildTransaction([ix]);
  }

  // ---------------------------------------------------------------------------
  // Send helper
  // ---------------------------------------------------------------------------

  async sendTransaction(
    wallet: WalletContextState,
    tx: Transaction
  ): Promise<TxResult> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected");
    }

    const latestBlockhash = await this.connection.getLatestBlockhash(
      this.commitment
    );
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = wallet.publicKey;

    try {
      const signed = await wallet.signTransaction(tx);
      const rawTx = signed.serialize();
      const signature = await this.connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: this.commitment,
      });

      const confirmation = await this.connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        this.commitment
      );

      const txInfo = await this.connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      const logs = txInfo?.meta?.logMessages ?? [];
      let err: string | null = null;
      let hint: string | undefined;

      if (confirmation.value.err) {
        const parsed = parseErrorFromLogs(logs);
        if (parsed) {
          err = `${parsed.name} (0x${parsed.code.toString(16)})`;
          hint = parsed.hint;
        } else {
          err = JSON.stringify(confirmation.value.err);
        }
      }

      return {
        signature,
        slot: txInfo?.slot ?? 0,
        err,
        hint,
        logs,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        signature: "",
        slot: 0,
        err: message,
        logs: [],
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async buildTransaction(
    ixs: TransactionInstruction[]
  ): Promise<Transaction> {
    const tx = new Transaction();
    for (const ix of ixs) {
      tx.add(ix);
    }
    return tx;
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createDevnetSDK(): PercolatorSDK {
  const rpc =
    process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  return new PercolatorSDK(connection, DEVNET_PROGRAM_ID);
}
