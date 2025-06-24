# Lec-2: Ethereum Execution Overview by lightclient (Matt Garnett)

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week2)

## Overview

This lecture provides an overview of execution client.The main themes of the lecture are:

* Block Validation
* Block Building
* State Transition
* EVM
* devp2p
* Sync modes

All the topics are briefly discussed and will be discussed in detail in upcoming lectures.

## Sections Timestamp


| Topic                                                                                            | Time    |
| ------------------------------------------------------------------------------------------------ | ------- |
| Block Validation i.e. how txns get validated by execution client once shared by consensus client | 8:00    |
| Block Validation on execution client performing stf (state transition function)                  | 11:00   |
| Verify Block Headers to exclude illicit blocks                                                   | 11:30   |
| Check if each transaction is valid                                                               | 14:30   |
| `verify_and_notify_new_payload`                                                                  | 16:00   |
| Questions                                                                                        | 17:40   |
| Block Building                                                                                   | 20:30   |
| Questions                                                                                        | 30:10   |
| State Transition Function                                                                        | 38:50   |
| Questions: What are Receipts?                                                                    | 55:00   |
| Questions: Environment Context related to transactions dependency                                | 57:40   |
| EVM                                                                                              | 1:01:10 |
| Questions: How were various instructions cost determined?                                        | 1:10:00 |
| P2P                                                                                              | 1:12:45 |
| P2P: Why the node keeps healing? And why snap-sync is important?                                 | 1:27:46 |
| Questions: How to know that you are not downloading a malicious chain?                           | 1:36:30 |


## Table of content

<!-- mtoc-start -->

* [Block Validation](#block-validation)
  * [Q&A: Block Validation](#qa-block-validation)
* [Block Building](#block-building)
  * [Q&A: Block building](#qa-block-building)
* [State Transition](#state-transition)
  * [Q&A: State Transition](#qa-state-transition)
* [EVM](#evm)
* [Devp2p](#devp2p)
  * [Responsibilities of devp2p](#responsibilities-of-devp2p)
  * [Historical data](#historical-data)
    * [`GetBlockHeaders (0x03)`](#getblockheaders-0x03)
    * [`GetBlockBodies (0x05)`](#getblockbodies-0x05)
    * [`GetReceipts (0x0f)`](#getreceipts-0x0f)
  * [Pending Transactions](#pending-transactions)
    * [`Transactions (0x02)`](#transactions-0x02)
    * [`NewPooledTransactionHashes (0x08)`](#newpooledtransactionhashes-0x08)
    * [`GetPooledTransactions (0x09)`](#getpooledtransactions-0x09)
* [Sync modes](#sync-modes)
  * [Snap sync v/s Full sync](#snap-sync-vs-full-sync)
  * [Q&A: Snap sync](#qa-snap-sync)
* [JSON RPC API](#json-rpc-api)

<!-- mtoc-end -->

## Block Validation

Block Validation from the perspective of **consensus client** is:

- `process_execution_payload` function is performed by the **Beacon Chain** where *it goes through the verification needed to verify if a block is valid and move the consensus layer forward*. Its task is to peform high-level checks to make sure that the parent hash is correct, verify the `prev_randao`, timestamp, etc. After the checks, it sends the block to execution client through `verify_and_notify_new_payload`.
- `verify_and_notfiy_new_payload` checks for `is_valid_block_hash(execution_payload, parent_beacon_block_root)` and `is_valid_versioned_hashes(new_payload_request)` to return *true*. If true `notify_new_payload` send the `new_payload_request` to **Execution Engine**.

>`is_valid_versioned_hashes(new_payload_request)` got introduced in *Deneb* through **EIP 4788**: *Beacon block root in the EVM*.
>
>It verifies if the *version hashes* computed by the blob transactions of
>```py
>new_payload_request.execution_payload ==  new_payload_request.versioned_hashes
>```


Block validation from the perspective of *execution client* (perform state transition via `stf` (state transition function)

During the `stf`,

```go
func stf(parent types.Block, block types.Block, state state.StateDB) (state.StateDB, error) {
	if err := core.VerifyHeaders(parent, block); err != nil {
		// header error detected
		return nil, err
	}
	for _, tx := range block.Transactions() {
		res, err := vm.Run(block.Header(), tx, stateDB)
		if err != nil {
			//transaction invalid, block invalid
			return nil, err
		}
		state = res
	}
	return state, nil
}

func newPayload(execPayload engine.ExecutionPayload) bool {
	if _, err := stf(...); err != nil {
		return false
	}
	return true
}
```

- Initially, a check is performed to ensure that the *block headers are valid*. If any error occurs, *no state is updated and the error is returned*.
- The best example is to check in headers is **Gas Limit**. If the `gas_limit` is increased abruptly in midst of a single block because you have exceeded the `1/1024 fraction update`. Read this [article](https://www.gate.com/learn/articles/to-pump-the-gas-or-not-analyzing-the-ethereum-gas-limit-debate/6197) in order to understand more about the fraction update.
- Other examples could be that `block number` were not in *sequence*, or the *calculation of gas* based on EIP-1559 were *incorrect*.
- Later, we check if each transaction is valid in the block. If even a *single transaction* ***fails***, then the **block is invalid**. For every valid transaction, we *update the state*. If all the transactions in the block are *valid*, then the *updated state is returned*.

The purpose of `newPayload` in the execution client is to check the validity of `execution_payload` by running the `stf`. If it *returns with an error,* it returns *false* else *true*.

It is important to note that each node have to perform the block validation on every new upcoming block in order to ensure its validity. It is to keep the proposers in check at all times.

### Q&A: Block Validation

*Ques.* Why `block.Header()` is passed to `vm.Run()`? @17:40
*Ans.* **Access to Block Context**, i.e. various parameters in Header for example, `PREVRANDAO`, `BlockHash`, etc.

*Ques.* What happens to the CL if the `stf` returns that the block is invalid? @18:50
*Ans.* A *block is rejected* **if it's invalid according to the consensus layer** (CL) because the beacon spec uses `asserts` to verify properties; *a failed assert in the `verify_and_notify_new_payload` function* (which should return true if the block is valid) *signals an invalid block, leading to its rejection*.

## Block Building

>The precursor to *block-building* is to build **Execution Payloads**.

**A payload block contains:**
- *the state*
- *the state transitions*

A validator node is given this task of creating a block which is upto the consensus layer to decide. Every epoch, the CL randomly determines the list of validators who are tasked to build roughly 32 blocks (as 32 slots).

A context is to be provided i.e. the mempool of pending transactions along with other state related context so that the state transition function mocks the transactions again to check the validity of the submitted transactions.

All the pending transactions live in a subspace which is coined as ***Mempool***. These transactions are being gossiped (later discussed in detail) among the execution client nodes via *dev-p2p*.

The technical understanding of a **valid pending transaction** is:
- *the next nonce of a given account that created the transaction has enough value to pay for the complete successful execution of the transaction*
- *the data provided in the transaction leads to a valid state transition when passed through the stf.*
- *and other factors* **which we will discuss in future.**

>```go
>GAS_LIMIT = 30_000_000
>
>func build(env Environment, pool txpool.Pool, state state.StateDB) (types.Block, state.StateDB, error) {
>	var (
>		gasUsed = 0
>		txs []types.Transaction
>	)
>	for ; gasUsed < GAS_LIMIT || !pool.Empty(); {
>		tx := pool.Pop()
>		res, gas, err := vm.Run(env, tx, state)
>		if err != nil {
>			// tx invalid
>			continue
>		}
>		gasUsed += gas
>		txs = append(txs, tx)
>		state = res
>	}
>	return core.Finalize(env, txs, state)
>}
>```

>The `TxPool.Pool` maintains the ***ordered list*** (based on the *gas price*) of transactions i.e. order by their value that helps in building the *most profitable block* for the execution client. This is a simplified summary; the actual situation is more *nuanced*.
>
 Read `go-ethereum/core/txpool.go` for more information.

**Gas Limit** is required for Ethereum to stop transactions to consume too much computation. It prevents excessive use of network resources by putting a cap on the work that can be done.

>On February 04, 2025, Ethereum increased the `gas_limit` from **30 million** (last increased in 2021) to ***36 million*** units. (Validators initiated this shift without a hard fork by tweaking node configurations)[^1]

>`Environment` discussed in the `build()` is denoted as `Context` in *go-ethereum* i.e. in `go-ethereum/core/state/snapshot/context.go`.

> Once the `gasUsed` reaches the `gas_limit`, the `core.finalize()` runs to *produce a fully assembled block*.
> The `finalize()` does some calculation before assembling the block, for example, calculating the receipts root, transaction root, withdrawals root, etc.
> Read `FinalizeAndAssemble()` in `go-ethereum/consensus/beacon/consensus.go`

The whole process of block building discussed above is very simplified and a whole lot more going on under the hood which we will discuss in future.

### Q&A: Block building

*Ques.* Is the transaction pool ordered? How do we ensure maximum profit when using `pool.pop`?
*Ans.* Transaction pool is ordered by gas price, with EIP-1559, a builder would often include transactions with higher `priority_fee`. Each `pop` retrieves the most valuable transaction per gas.

*Ques.* Does the execution layer rejects transactions before sending them to the consensus layer?
*Ans.* Transactions are rejected only if invalid. The `Tx.Pool` performs certain checks so that only possible valid transactions pass through. The only possible perspective for revert of a transaction during build process is if *it can't pay the gas*.

*Ques.* How viable are encrypted mempools? Since block transactions are ordered by gas, is gas unencrypted in such a design?
*Ans.* Most in blockchains like Ethereum, Cosmos, we have unencrypted gas because you don't know the transaction yet. The problem faced here is that the commitment to an order list without enough knowledge of gas usage. Some proposals, in order to solve this issue, leave the sender and gas unencrypted and only encrypting the data and target. But even gas leak has drawbacks which could lead enough insights regarding the transaction information. *Hence, a fully efficient encrypted mempool seems distant.*

*Ques.* Is `GAS_LIMIT` a hardcoded to 30 million. Is this a parameter?
*Ans.* The build function uses the environment to get the information related to gas limit. *A client can manipulate gas limit* up to `(GAS_LIMIT\*1025)/1024` if the target shoots above the parent's block gas limit.

## State Transition

In `Go-Ethereum`, we can look at the `NewPayload` function that beacon chain calls to interact with the EL. It is located in `Catalyst`, geth's version of engine API. The source code is in `eth/catalyst/api.go`

>`newPayload()` is the **heart** of ***block validation*** after consensus client notifies execution client regarding the arrival of new beacon block with new payload attached.

The overview of `newPayload()` is:
***`NewPayload` → `InsertBlockWithoutSetHead` → `insertChain` → `processBlock` → `Process` & `ValidateState`***

`newPayload()` in the engine-API is the function called by the beacon chain during the `notify_execution_payload` (referenced in *block validation*). `engine.ExecutableData` have very similar functionalities to a `types.Block` (in `core/types/block.go`).

`newPayload` performs a *lot of checks* to validate the effective communication between beacon chain and execution layer.

`InsertBlockWithoutSetHead(block)` gets called by `newPayload` starts to put the block into our chain by eventually calling `InsertChain()`. `InsertChain()` calls `VerifyHeaders` in `consensus/ethash/consensus.go` which performs *the header verifications based on the consensus rules*.

```go
abort, results := bc.engine.VerifyHeaders(bc, headers)
```

Header verification happens through Beacon (a consensus engine that combines the eth1 consensus i.e. ethash or clique, and proof-of-stake algorithm)

>```go
>// source: go-ethereum/consensus/beacon/consensus.go in `VerifyHeader`
>// Read `verifyHeader()` and `verifyHeaders()` (Batched version) for more information on header verification
>
>// skips the header verification for ethash i.e. ETH1.0 consensus algorithm
>if header.Difficulty.Sign() > 0 {
>	return beacon.ethone.VerifyHeader(chain, header)
>}
>// performs beacon consensus algorithm i.e. POST->MERGE
>return beacon.verifyHeader(chain, header, parent)
>```

Some example of header verification by `beacon.verifyHeaders()` are:
- In proof of stake, there is **no concept of uncle blocks (ommers)** as proposers, so `beacon.verifyHeader` checks if the `header.UncleHash != types.EmptyUncleHash`, if true, throws an error.
- Also, `beaconDifficulty` i.e. `Difficulty` post-merge, is always **0**, so if `header.Difficulty != 0`, if true, throws an error.
- `VerifyEIP1559Header` performs various checks throughout the `GasLimit`, `BaseFee`, etc. to see if the gas limit and base fee remains within allowed bounds.

And finally after going through a lot more checks and affirmations,

>An important functionality of `InsertChain()` is to able to due varied checks in the case of a *Reorganization* or *Reorg*. Read `blockchain.go` for more information related to `reorg`, `setCanonical` and `InsertBlockWithoutSetHead`.
>
>`InsertBlockWithoutSetHead` **executes** the block, runs the necessary verification upon it and then *persist the block and the associate state into the database*. The key difference between the `InsertChain` is it *won't do the canonical chain updating*. It **relies** on the additional `SetCanonical` call to *finalize the entire procedure*.

The `insertChain()` eventually runs the `process.Process` (source in `core/state_processor.go`) in  `processBlock()`.

`Process()` is responsible for the following: :
1. *Mutate the block and state according to any hard-fork specs*
2. *Pre-execution system calls*
3. *Iterate over and process the individual transactions*

***Process-function-call***

```
ApplyTransactionWithEVM
└── `ApplyMessage` which calls
	`NewStateTransition().execute()`
	├── 1. Nonce handling
	├── 2. Pre pay gas
	├── 3. Create a new state object if the
		recipient is nil
		i.e. contract creation `create`
	├── 4. Value transfer i.e. `call`
		├── 4a. Attempt to run transaction data
		└── 4b. If valid, use result as code for the new state object
	├── 5. Gas Refund according to EIP-3529
	├── 6. Update Balance in Coinbase
	└── 7. Return the execution result
```

4. *Append Receipts and Logs* returned from `ApplyTransactionWithEVM`

```go
receipts = append(receipts, receipt)
allLogs = append(allLogs, receipt.Logs...)
```

5. *Finalize the block, applying any consensus engine specific extras (e.g. block rewards)*

```go
// Finalize the block, applying any consensus engine specific extras (e.g. block rewards)
p.chain.engine.Finalize(p.chain, header, tracingStateDB, block.Body())
```

Later, `ProcessBlock()` writes the block to the chain and get the status.

```go
// Write the block to the chain and get the status.
var (
	wstart = time.Now()
	status WriteStatus
)
if !setHead {
	// Don't set the head, only insert the block
	err = bc.writeBlockWithState(block, res.Receipts, statedb)
} else {
	status, err = bc.writeBlockAndSetHead(block, res.Receipts, res.Logs, statedb, false)
}
```

And once, `ProcessBlock`, `insertChain` and eventually `InsertBlockWithoutSetHead` returns successfully without an error then `setPayload` gets returns the *updated hash* and *status* **VALID**,

```go
return engine.PayloadStatusV1{Status: engine.VALID, Witness: ow, LatestValidHash: &hash}, nil
```

This is the full block insertion pipeline starting from consensus client sending to the execution layer and finally generation of block hash and progressing the block status as valid.

### Q&A: State Transition

*Ques.* What is a receipt?
*Ans.* A receipt is an information about a transaction that can only be verified or determined after executing the transaction. For more information read `type Receipt struct` in `core/types/receipt.go`.

*Ques.* How is the environment of multiple contract (i.e. contract calling other contracts, etc.) exactly works? How is context being fetched in the EVM?
*Ans.* Go to `type EVM struct`, which has two context i.e. `BlockContext` and `TxContext`. Then just refer `type BlockContext struct` and `type TxContext struct`. Important distinguishing factor is `BlockContext` fixed for the whole block but `TxContext` changes for every new transaction.

Also, in `type EVM struct`, `EVMInterpreter` struct has a method called `Run`, has a callContext parameter which looks like,

```go
callContext = &ScopeContext{
	Memory:   mem,
	Stack:    stack,
	Contract: contract,
}
```

These variables get filled with context during the processing of `calldata` executed by `msg.sender`.

If something related to Contract, `callContext` takes care of it too.

Refer `core/vm/evm.go`, `core/vm/interpreter.go` and `core/vm/contract.go`

## EVM
Nothing much interesting. For deeper understanding, refer `go-ethereum/core/vm` & `execution-specs/src/ethereum/cancun/vm`

*Ques.* How various instruction costs were determined?
*Ans.* Long time ago, some benchmarking were done. A **target gas per second** was calculated by running the same opcode
multiple times to find the average no. of runs per second.
And then working backwards to figure out the appropriate gas to reach the target gas per second value for the same.
And with London Hard fork, as `basefee` was introduced, no benchmarking were really done to recalculate the average gas per second
for each instruction again. So, *some opcodes are overcharged*.

## Devp2p

**devp2p** is a peer-to-peer networking protocol among execution-client peers.

>The specification for devp2p: [GitHub - ethereum/devp2p: Ethereum peer-to-peer networking specifications](https://github.com/ethereum/devp2p/)

The capabilities (protocols come under) of *devp2p* are:
1. [Ethereum Wire Protocol (eth/68)](https://github.com/ethereum/devp2p/blob/master/caps/eth.md)
2. [Ethereum Snapshot Protocol (snap/1)](https://github.com/ethereum/devp2p/blob/master/caps/snap.md)
3. [Light Ethereum Subprotocol (les/4)](https://github.com/ethereum/devp2p/blob/master/caps/les.md)
4. [Parity Light Protocol (pip/1)](https://github.com/ethereum/devp2p/blob/master/caps/pip.md)
5. [Ethereum Witness Protocol (wit/0)](https://github.com/ethereum/devp2p/blob/master/caps/wit.md)

>During the pre launch or early launch, the iterations over Ethereum Wire Protocol were too quick without much documentations hence: PoC-1 -> PoC-2 ..... -> eth/68 (current). More info here: [devp2p/caps/eth.md](https://github.com/ethereum/devp2p/blob/master/caps/eth.md)

### Responsibilities of devp2p

- Historical data
	- *GetBlockHeaders*
	- *GetBlockBodies*
	- *GetReceipts*
- Pending Transactions
	- *Transactions*
	- *NewPooledTransactionHashes*
	- *GetPooledTransactions*
- State
	- snap (two faced protocol)


`BroadcastTransactions` will *propagate a batch of transactions*:
 - To a *square root of all peers* for non-blob transactions
 - And, separately, as *announcements to all peers* which are not known to already have the given transaction.

More information at `go-ethereum/eth/handler.go` in `BroadcastTransactions()`.


>`request-id`: A **64-bit integer** value *chosen* by the requesting peer. The responding peer must *mirror* the value in the `request-id` element of the response message. Introduced in `eth/66`, for more information, refer `eth66` in `devp2p/caps/eth.md`

### Historical data

All historical data exchanges among peers through devp2p as stated in responsibilities above. Some of crucial *historical context* related **Protocol Messages** exchanged among peers are:

#### `GetBlockHeaders (0x03)`

>*Parameters:* `[request-id: P, [startblock: {P, B_32}, limit: P, skip: P, reverse: {0, 1}]]`

With each `request-id`, a peer can request a certain number of blocks from the `startblock` (i.e. start from this block value), `limit` to specify consecutive number of blocks from `startblock`, and could potentially reverse (`reverse == 1`) them.

Before merge, the only way to sync a node was to request block headers from the genesis sequentially.

But post-merge, the ability sync from a checkpoint (in reverse i.e. current block → checkpoint block).

>Response: `BlockHeaders (0x04)`

#### `GetBlockBodies (0x05)`

>*Parameters:* `[request-id: P, [blockhash₁: B_32, blockhash₂: B_32, ...]]`

Once, a peer receives the requested `BlockHeaders (0x04)`, can now request for the *bodies* of a given `BlockHeader` wrt *block hash*.

>Response: `BlockBodies (0x06)`

#### `GetReceipts (0x0f)`

>*Parameters:* `[request-id: P, [blockhash₁: B_32, blockhash₂: B_32, ...]]`

Once, a peer receives the requested `BlockHeaders (0x04)`, similar to `GetBlockBodies`, can now request for the *receipts* of a given `BlockHeader` wrt *block hash*.

>Response: `Receipts (0x10)`

### Pending Transactions

#### `Transactions (0x02)`

>*Response:* `[tx₁, tx₂, ...]`

Transactions are a way for a peer to share its other *batch peers*. This is the heart of gossip of transactions in the devp2p protocol. This is an **unconditional prerequisite** to contribute as a peer node.

Transaction messages must contain **atleast one** *new* transaction. Empty transactions are discouraged and may lead to disconnection.

Nodes must not send same transaction agin to their *batch peers* in the same session or must not send them the same transaction back (from whom they received it). In practice, a *local per-peer bloom filter* takes care of already sent or received transactions.

#### `NewPooledTransactionHashes (0x08)`

>*Response:* `[txtypes: B, [txsize₁: P, txsize₂: P, ...], [txhash₁: B_32, txhash₂: B_32, ...]]`

Sends a list of transaction types, size and their hash. Remember, this message is *an **announcement** of such a transaction that exists to the other peers who are not in the batch*.

#### `GetPooledTransactions (0x09)`

>*Parameters:* `[request-id: P, [txhash₁: B_32, txhash₂: B_32, ...]]`

Once, announcement reaches other peers, they can request transactions which they have not seen before using this function from given `transaction hash` in the announcement and the peer will respond with a `PooledTransactions (0x0a)`.

>*Response:* `PooledTransactions (0x0a)

## Sync modes

The synchronization start from *leaf nodes to a certain root*.

The root changes for each block that gets added to the canonical chain.

Remember, nodes don't keep all of the historical state. They only consider to keep the information that is considered **active** and the rest is *pruned*.

Full nodes only keep a local copy of most recent *128 blocks*, allowing others to save disk space. Older data can be regenerated when its needed.

The first stage of Snap Protocol,
The process of ****contiguous state retrieval*** i.e. download all the leaf nodes.

The second stage is comparing the leaf nodes of root *R<sub>1</sub>* with the leaf nodes fo root *R<sub>n</sub>* where the leaf nodes compare themselves. Some are stale and some changed during the transition phase of **R<sub>1</sub>→R<sub>n</sub>**.

This called **Healing Phase**, where the *state heals from all the changes occurred in the leaf nodes by comparing from the root to leaf (i.e. top-bottom)*.

Number of state transitions increases between the **R<sub>1</sub>→R<sub>n</sub>**, for an increasing `n`. If the `n = 1M`, imagine the number of leaf nodes are to be compared, leading this to a slow resolve process.

The only *restraining* possibility is **"how fast a peer can do the contiguous download?"**.

The faster contiguous download a peer can do, the faster the process of *healing phase* can be compared to the precursive blocks.

The slow contiguous download (slow network bandwidth) leads to slower process of *healing phase* because as soon as the download, there are already blocks getting added to the canonical chain, leading to the never *ending game of catchup*.

*Sometimes people questions: "Why their node is stuck on healing?"* and the answer to this is *their node is trying to heal an extremely deformed state trie (i.e. loads of state changes occurred).*

The solution to this problem is:
1. Download the state database again.
2. Check bandwidth.

For more information, refer: `devp2p/caps/snap.md`

### Snap sync v/s Full sync

Snap sync and full sync are two totally different approach for synchronizing a new peer node.

In snap sync, there exists a light client assumption towards *economic majority*. Anyone who snap syncs, pick a block where majority peer nodes deem the block as *weak-subjectivity checkpoint*. In simpler terms, the sync begins from a checkpoint where majority other nodes unanimously decided a starting certain block safe point.

Whereas, in full sync, the peer does not rely on the *economic majority* and rather syncs the node from its genesis.

### Q&A: Snap sync

*Ques.* How to know that you are not downloading a malicious chain ?
*Ans.* Perform snap sync from the point of *weak subjectivity* or *economic majority*.
Following are the steps:
1. Start from the weak subjectivity checkpoint → block hash.
2. get block associated with that hash
3. Start snap sync against the given block's state

>Remember when starting from a checkpoint, we're just trusting that route is correct, and then the data that we are getting back has a witness against this root.

*Ques.* How to know that you are not downloading a malicious chain ?
*Ans.* Perform snap sync from the point of *weak subjectivity* or *economic majority*.
Following are the steps:
1. Start from the weak subjectivity checkpoint → block hash.
2. get block associated with that hash
3. Start snap sync against the given block's state

>Remember when starting from a checkpoint, we're just trusting that route is correct, and then the data that we are getting back has a witness against this root.

## JSON RPC API
JSON RPC API is not covered in this lecture.

- [ ] Read more about JSON RPC client from [ethereum/execution-apis](https://github.com/ethereum/execution-apis).

