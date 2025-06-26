# Lec-8: Execution Client Architecture by Dragan Rakita

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week7-dev)

## Overview

This lecture focuses on explaining the Ethereum client architecture, precisely Reth's architecture. The overview includes:

- Reth history and goals
- Performance
- Architecture
- Pipeline Stages
- Key components
- Database Layout
- Block building & execution
- Differences from other clients
- Engine API
- Tree Parallel Crate
- Contributing

## Sections Timestamp


| Topic                                                                                                      | Time    |
| ---------------------------------------------------------------------------------------------------------- | ------- |
| Introduction                                                                                               | 5:22    |
| History & Overview                                                                                         | 8:50    |
| Metrics                                                                                                    | 12:17   |
| Roadmap                                                                                                    | 16:12   |
| Future                                                                                                     | 18:23   |
| Reth Overview                                                                                              | 19:40   |
| Project Structure                                                                                          | 21:26   |
| Reth Component Flow                                                                                        | 23:12   |
| Reth Docs                                                                                                  | 28:12   |
| `reth_stages`                                                                                              | 29:00   |
| pipeline                                                                                                   | 30:12   |
| Historical Sync vs Snap Sync                                                                               | 34:25   |
| Staged Sync and Reth's inspiration from Erigon                                                             | 35:51   |
| pipeline (continued)                                                                                       | 39:30   |
| SenderRecoveryStage                                                                                        | 45:03   |
| ExecutionStage                                                                                             | 47:28   |
| Database                                                                                                   | 49:30   |
| Question: What drawbacks do Merkle verification checks have for every block?                               | 1:00:38 |
| Question: How the transactions are executed and parsed through the state transition function in reth?      | 1:02:28 |
| Question: How do we get accurate accounts for a particular block when you don't calculate the Merkle root? | 1:18:50 |
| Question: What is Sender Recovery in Execution Stage?                                                      | 1:20:45 |
| Question: Difference between LevelsDB, RocksDB, MDBX                                                       | 1:21:32 |
| Question: How the engine API communication and how block building is triggered by a new payload            | 1:23:10 |
| Question: Overview of Trie & Trie Parallel                                                                 | 1:29:09 |
| Advice for Rust Contributors                                                                               | 1:31:20 |


## Table of contents

<!-- mtoc-start -->

* [Speaker's background](#speakers-background)
* [Reth Roadmap (Three tracks)](#reth-roadmap-three-tracks)
* [Long term Future](#long-term-future)
* [Reth Overview](#reth-overview)
* [Project Structure](#project-structure)
  * [Crates directory](#crates-directory)
  * [Reth: Staged Sync (Inspiration from Erigon)](#reth-staged-sync-inspiration-from-erigon)
* [`reth_stages`](#reth_stages)
  * [How Staged Sync in Reth v/s Erigon](#how-staged-sync-in-reth-vs-erigon)
  * [`Pipeline`](#pipeline)
* [Databases](#databases)
* [Questions](#questions)

<!-- mtoc-end -->

## Speaker's background

[Dragan Rakita](https://x.com/rakitadragan) before building revm, was part of Open Ethereum and work on one of their rust client (now deprecated).

Later, He created [revm](https://github.com/bluealloy/revm), later used by Foundry. With the success and increasing adoption of Foundry, Georgios Konstantopoulos (CTO, Paradigm) showed interest into creating a client of revm, i.e. **Reth**. Reth was introduced in December 2022 and initial release in June 2023 when the client was able to successfully sync from Genesis to the head of the chain. Finally in June 2024, Reth team made their final release v1.0. And hence the first rust production ready execution client of Ethereum.

Reth uses `MDBX` (first adopted by Erigon) as the key-value database. Akula, the fastest archive node written in rust (now deprecated), created the rust bindings for `MDBX` which reth uses.

Some famous benchmarking tools built by Paradigm are:

- Flood: Load testing tool for benchmarking EVM nodes over RPC
- Cryo: easiest way to extract blockchain data to parquet, CSV, JSON or a python dataframe

These were used to benchmark the storage requirements, sync time, etc.

> Reth was audited by Sigma Prime (the creators of Lighthouse).

## Reth Roadmap (Three tracks)

1. Core Development: Ethereum resilience
2. Performance: Commoditize the giga gas per second and beyond
3. Kernel: Commoditize customizing chains and building rollups

Some related articles are:
- [Ress: Scaling Ethereum with Stateless Reth Nodes](https://www.paradigm.xyz/2025/03/stateless-reth-nodes)
- [What comes after Ethereum’s Pectra hard fork? - Paradigm](https://www.paradigm.xyz/2025/02/what-comes-after-ethereums-pectra-hard-fork)
- [Ethereum Acceleration - Paradigm](https://www.paradigm.xyz/2025/01/ethereum-acceleration-1)
- [Reth’s path to 1 gigagas per second, and beyond - Paradigm](https://www.paradigm.xyz/2024/04/reth-perf)

Check out [Paradigm: writing](https://paradigm.xyz/writing) for more such articles on Reth's roadmap.

> Here are the [examples](https://github.com/paradigmxyz/reth/tree/main/examples) to demonstrate the main features of some of Reth's crates and how to use them.

## Long term Future

- BigQuery/Amazon Aurora moment for L2s i.e. "*Disaggregated compute and storage*"
- **Multi-rollup node**: rollup as post-execution hook. Each rollup requires adding 2 services to run i.e. op-node eq. + op-reth eq.
  - Today: `reth node --chain=mainnet`
  - Future: `reth node --chains=mainnet,base-mainnet, …`
- Multi-tenant node architecture
  - Based on Actor model
  - Built for cloud usage
  - separate compute from storage

- Multi-rollup + multi-tenant → low DevOps cost while scaling up → TRUE elastic scalability

## Reth Overview

Paradigm has quite a catalogue of projects. Here's the list: [Paradigmxyz: Github profile README.md](https://github.com/paradigmxyz/.github/blob/e1f85d4b9b441fc9fba15400d3caf1a7308767c2/profile/README.md)

- Alloy provides necessary dependencies or primitives required by Reth client.
- Reth client also uses revm (evm implementation in rust).

## Project Structure

The project is divided in:

- `bin/reth`: encapsulating everything from the crates into one crate (commands).
- `crates`: This is where the whole reth client codebase exists.

### Crates directory

`crates` contains list of crates. The docs for the crates is [Reth Crates Docs](https://reth.rs/docs/).

![component-flow](/assets/lec-8/component-flow.png)

Reth has two sync modes executed by `Engine/pipeline` (sync in stages):

1. **Historical sync**: blocks that are already proposed, all the known and all the verified blocks. It's re-executing them from Genesis to the head or close to the head.
2. **Snap Sync**: syncing the blocks that come from the consensus layer — those are the next blocks that are going to be proposed by the consensus layer. It's getting the for-choice data from the consensus layer.

### Reth: Staged Sync (Inspiration from Erigon)

Reth uses an enhanced and optimized version of historical sync i.e. **Staged Sync**. It's pioneered from Erigon execution client (initial implementation of staged sync).

*Blockchain Tree*: When we are close to the tip of the chain, we switch to blockchain tree. Blockchain tree is another way that we sync to basically near the tip where state truth validation execution happens everything inside memory only. When the block gets canonicalized, it gets basically moved to the database.

*Provider*: The provider is an abstraction over the database that has some helper functions so that we don't need to directly use key-value.

*Downloader*: The downloader is used by both the pipeline for its first two stages or by the engine if it needs to close the gap to the tip. It's used to download blocks and headers from the P2P network.

*P2P*: From P2P, when we are close to the tip,
we push those new transactions that we read to the transaction pool.

*TxPool*: The transaction pool is basically Ethereum's DoS protection. It has a number of transactions or by the gas price that users want to pay.

*PayloadBuilder*: Payload builder basically takes transactions, builds the new payload that's needed for the engine.

*Pruner*: The additional component is missing; it's the ***pruner*** (helps prune data that is finalized).

## `reth_stages`

Docs: [Stage in reth\_stages - Rust](https://reth.rs/docs/reth_stages/trait.Stage.html)

Stages must have a unique ID and implement a way to “roll forwards” `Stage::execute` and a way to “roll back” `Stage::unwind` (in case of reorgs).

> Stages are executed as part of a pipeline where they are executed serially.

### How Staged Sync in Reth v/s Erigon

Staged sync depends on static files. Database used in Reth has Binary Tree inside. All the immutable data i.e. transactions, blocks, and receipts are stored in binary file format. With this, we get a lot more smart database and even faster sync time.

For example, everything that is related to the block sync to the head with the blockchain tree (data that is not verified yet), is *stored in memory*. Hence, that allows to not store junk in database and handle everything inside the memory.

So, now wrt Erigon v/s Reth. Erigon is written in Golang and Reth is written in rust. Along with that to reduce the database size, reth performed a lot of optimizations like compressing the data with their custom encoding to encode everything which shrinks the size a lot.

Another difference, while in the pipeline, if the staged sync is valid, *merkle verification is not done every block*. While previous generation clients like geth do perform verification for every block.

### `Pipeline`

Docs: [Pipeline in reth\_stages - Rust](https://reth.rs/docs/reth_stages/struct.Pipeline.html)

Pipeline consists of multiple stages. It is CLI tool to unwind/execute a particular stage to debug during the development phase or do something particular in production.

The list of stages: [DefaultStages](https://reth.rs/docs/reth_stages/sets/struct.DefaultStages.html)

List of stages:

1. `HeaderStage`: Network stage that fetches headers. [Read more](https://reth.rs/docs/reth_stages/stages/struct.HeaderStage.html)
2. `BodyStage`: Network stage that fetches body. [Read more](https://reth.rs/docs/reth_stages/stages/struct.BodyStage.html)
3. `SenderRecoveryStage`: Recovers the transaction signer & stores them in `reth_db_api::tables::TransactionSenders` table.
4. `ExecutionStage`:
	- executes all transactions and update history indexes i.e. gather headers and transactions, and execute them inside revm.
	- Again the checks are similar to geth, gas is the same and variety of other checks. Then create receipts and change sets (reth::revm::db::states).
	- Create one *hashmap* of all the n transactions in the `ChangeSet`.
5. `PruneSenderRecoveryStage`: Inserts a lot of data into the database that’s only needed for the Execution stage. Pruner will clean up the unneeded recovered senders. [Link](https://reth.rs/docs/reth_stages/stages/struct.PruneStage.html)
6. `MerkleStage (unwind)`: When run in unwind mode, it’s going to be executed BEFORE the hashing stages, so that it unwinds the intermediate hashes based on the unwound hashed state from the hashing stages.
7. `AccountHashingStage`: Hashes plain account.
8. `StorageHashingStage`: Hashes plain storage.
9. `MerkleStage (execute)`: Uses previous two stages to gather hashes and in this stage, the state root is generated. The state is verified if it's correct.
10. `TransactionLookupStage`: This stage walks over existing transactions, and sets the transaction hash of each transaction in a block to the corresponding `BlockNumber` at each block.
11. `IndexStorageHistoryStage`: Index the storage history generated in the `ExecutionStage`, to be precise, `tables::StorageChangeSets`.
12. `IndexAccountHistoryStage`: Similar to the previous Stage, index the account history generated in the `ExecutionStage`, to be precise, `tables::AccountChangeSets`.
13. `PruneStage (execute)`: Runs the pruner with the provided prune modes. Two modes are available: `PruneSenderRecoveryStage` and `Pruning during Live (snap) Sync`. [Link](https://reth.rs/docs/reth_stages/stages/struct.PruneStage.html)
14. `FinishStage`: This stage does not write anything; its checkpoint is used to denote the highest fully synced block. After this stage, we can again start getting new updates from consensus layer.

A few important piece of info to understand winding (while exection) & unwinding (in case of error):

- **Change sets** are the *changes that happen between accounts in one block*, so it's block-level change sets.
- **Execution** happens from *top to bottom*, but if there occurs any *errors*, then process of **unwinding** begins from *bottom to top*.
- The **unwind variant** should be added to the pipeline *before* the **execution variant**. The *order* of these two variants is *important*.
- `AccountHashingStage` and `StorageHashingStage` is preparation before generating intermediate hashes and calculating Merkle tree root.

## Databases

`Abstraction`: Abstraction that allows us to abstract away the database. Currently, we just have MDBX, but the idea was to replace it or have the ability to switch databases.

`Codecs`([link](https://reth.rs/docs/reth_db/tables/codecs/index.html)): Keys are to be encoded, while for the values are to be compressed. (Integers cannot be compressed as it looses greater-than ability).

`Database`([link](https://reth.rs/docs/reth_db/trait.Database.html)): This implementation is a basic abstraction over very low-level database access where you have transactional mutable transactions that give you write access.

`Cursor`([link](https://reth.rs/docs/reth_db/cursor/index.html)): Allows to iterate over the values in the database. It is a much faster way to fetch transactions for a block or calculate a Merkle root when needed because consecutively accessing values is a lot faster than randomly seeking them. This is also true for writes; if you want to write `n` amount of data, it's a lot faster if you can sort them and write them in sorted order.

`db`: It is the low-level key-value database.

`Tables`([link](https://reth.rs/docs/reth_db/tables/index.html)): It contains key-value storage for all kinds of the tables required as parameters. ***Read every attribute of the table*** in the above link to get in-depth understanding.

> Pruning technically means to remove the change sets after a certain recent blocks i.e. 128 blocks.

## Questions


*Ques.* What drawback do merkle verification checks have on every block?

*Ans.* We don't have proof of the history. Geth and Nethermind, basically, had the ability to fetch the Merkle proof of every storage and account at every point in time. This is removed; we only have a Merkle proof at one point in time. We need to be aware when we do a reorg at the tip to unwind the Merkle tree and update the Merkle tree. Maybe one drawback could be increased complexity, but in general, Merkle and everything around that is very complex because in the end you get just one hash, and verification depends on that hash.

---

*Ques.* How the transactions are executed and parsed through the state transition function in reth (lightclient (Matt) explained it wrt geth in lecture-1). So how Reth do this differently, and where are the EVM precompiles in reth?

*Ans.*

- Inside the stage: refer `execute_inner()` in `crates/stages/src/stages/execution.rs` and rabbithole through.
- For transaction pre-verification source code: refer `transact_preverified_inner` `revm/src/evm.rs`.
- For payload transactions execution: refer `execute_transactions()` in `crates/revm/src/processor.rs`
- For appending to the canonical blockchain: refer `AppendableChain` in `crates/blockchain-tree/src/chain.rs` which calls `executor.execute_and_verify_receipt()`. Very important. *Do read*.
- Also in `crates/payload/src/lib.rs`, `default_ethereum_payload_builder` contracts ethereum transactions payload. Very important. *Do read*.

---

*Ques.* How do we get accurate accounts for a particular block when you don't calculate the Merkle root?

*Ans.* The assumption is that for historical blocks, we need to check it only once; we don't need to check every previous state. If we check just the present state at the head, we know we have the correct state. After that, we incrementally check the Merkle state root, which is a much faster algorithm.

---

*Ques.* What is Sender Recovery in Execution Stage?

*Ans.* When a transaction is sent, you only have the payload and signature. From the signature, you recover the sender. This can be very CPU-intensive, so we have a separate stage for it. We save that value inside the database, so it's faster to fetch it from the database than to recalculate it in the execution stage.

*Ques.* Main differences between LevelDB, RocksDB, MDBX?

*Ans.* MDBX allows atomic fetches from the hard disk level, allowing you to open new processes and read the database in read-only mode. It's a B-tree-like database, fast on reads, so it's more useful for execution. We are investigating replacements; I don't think this is something we'll stay with long-term, but for now, it's working.

*Ques.* How the engine API communication and how block building is triggered by a new payload?

*Ans.* The engine api codebase exists in `crates/consensus/beacon/src/engine/mod.rs`. It has

`struct BeaconConsensusEngine` → `fn forkchoice_updated()` → (`self.blockchain.make_canonical` → `CanonicalOutcome::AlreadyCanonical` → `CanonicalOutcome::Committed` → `ensure_consistent_state`) → `fn on_forkchoice_updated()` → `fn poll()`

It handles synchronization between the pipeline, BlockchainTree, Builder, Pruner (everything around it).

Better understanding of Engine API might help as consensus client notifies the execution client via `engine_forkchoiceUpdated` and this method triggers the payload building and it returns `payload_id` as well in order for consensus client to request the payload via `engine_getPayload`.

---


*Ques.* Overview of Trie and Trie Parallel?

*Ans.* There are 2 more crates i.e. `trie` and `trie-parallel`. We have a very optimized way to calculate merkle root from the plain state, basically after we finish the pipeline.

But what we noticed is that same calculation was not good enough for the tip. For the tip, basically, we need a better way to do it; it's to do the calculation in parallel.
