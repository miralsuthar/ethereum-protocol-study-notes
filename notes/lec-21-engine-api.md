# Lec-21: Engine API by Mikail Kalinin

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day21)

## Overview

This lecture is about Engine API: the communication bridge between EL & CL. The overview includes:

- Design Rationale & Origin
- Core concepts and methods
- Payload & Beacon Block Relations
- Block Processing Scenarios
- Syncing
- EL State Management Approaches
- API Principles & Features
- Improvments & Enhancements
- Tools for exploration

## Sections Timestamp


| Topic                    | Time    |
| ------------------------ | ------- |
| Introduction             | 0:00    |
| Historical context       | 1:58    |
| Core Engine API          | 6:45    |
| engine_newPayload        | 11:23   |
| engine_forkchoiceUpdated | 16:07   |
| Beacon blocks & payloads | 18:23   |
| Block processing         | 20:24   |
| Handling reorgs          | 23:32   |
| Payload building         | 25:34   |
| Sync Process             | 33:34   |
| Questions                | 45:08   |
| EL State management      | 52:36   |
| Summary                  | 1:04:12 |
| Improvements             | 1:08:15 |
| Questions                | 1:11:50 |


## Table of contents

<!-- mtoc-start -->

* [Early Days: Historical context](#early-days-historical-context)
  * [First Execution Engine: Catalyst](#first-execution-engine-catalyst)
* [Engine API: Core](#engine-api-core)
  * [***New Block***](#new-block)
  * [***Update Head***](#update-head)
  * [Build Block](#build-block)
* [`engine_newPayload`](#engine_newpayload)
  * [***Task for the execution layer***](#task-for-the-execution-layer)
* [`engine_forkchoiceUpdated`](#engine_forkchoiceupdated)
* [Beacon blocks and payloads](#beacon-blocks-and-payloads)
* [Block processing](#block-processing)
* [Handling reorgs](#handling-reorgs)
* [Payload building](#payload-building)
* [Sync](#sync)
  * [State management](#state-management)
  * [How forks in different versioned execution clients are handled?](#how-forks-in-different-versioned-execution-clients-are-handled)
    * [MULTI-VERSIONED](#multi-versioned)
    * [SINGLE-VERSIONED](#single-versioned)
* [Summary](#summary)
* [What to learn next](#what-to-learn-next)
* [Improvements](#improvements)
* [Kurtosis for Engine API visualization](#kurtosis-for-engine-api-visualization)
* [More references](#more-references)
* [Notes on Engine API: A Visual Guide](#notes-on-engine-api-a-visual-guide)

<!-- mtoc-end -->

## Early Days: Historical context

The introduction to the concept of EngineAPI was coined in April 2020, by Danny Ryan in an ethresearch post: [Eth1+eth2 client relationship - The Merge - Ethereum Research](https://ethresear.ch/t/eth1-eth2-client-relationship/7248)

Danny proposed that eth2 client would be responsible for consensus protocol i.e produce the block, process the beacon chain and run the consensus.

But the question was regarding the relation between the execution (i.e. eth1) and consensus (i.e. eth2). Because eth1 provides with features like EVM, world state, transactions pool, etc.

Eth1 has the responsibility to build the payload (potential blocks). The execution client has execution-api (JSON RPC API) to accept transactions into the mempool and devp2p to gossip those transactions (via ethereum wire protocol).

So a similar JSON RPC API was proposed that would help communicate between eth1 and eth2 client and coined as Engine API.

So, in summary,
- ***Execution API*** - *execution clients ↔ users*
- ***Beacon API*** - *consensus clients ↔ validator clients ↔ builders*
- ***Engine API*** - *consensus clients ↔ execution clients*

The Engine API has two parts: EL and CL.

Catalyst was an implementation on the EL section. Hence the term, Execution engine.

### First Execution Engine: Catalyst

Catalyst, geth-based execution engine, developed @gballet (Guillaume) had the following API:

- `eth2_insertBlock`
- `eth2_setHead`
- `eth2_produceBlock`

A lot of the things have changed since but these 3 core apis still exists.

The name ***Engine*** was proposed by *Protolambda*. A perfect name for an API whose sole purpose is to facilitate both the core clients that makes ethereum.


## Engine API: Core

The Ethereum client in principle is an event driven system. Both CL and EL clients are event driven.

The core blockchain events happening during the block propagation is:

### ***New Block***

1️⃣ Proposer (alotted) via consensus client will first call the `engine_forkchoiceUpdated` method on the execution client side.

**IMPORTANT**: Nodes execute the FCU method request at the start of every slot. FCU has two purposes:
- *Set the new head of the chain* (all the nodes have to do this).
- *Start the new paylaod build process* (only the proposer do this).

2️⃣ The execution client then creates the payload and checks if it is valid from the point of execution i.e. block hash, included transactions and state root are all valid.

3️⃣ If built successfully and passes all the checks, EL returns the payload when CL requests via `engine_getPayload`.

4️⃣ The other validators (attestors) validatest the execution payload via `engine_newPayload` (the execution built and published by proposer).

### ***Update Head***

Whenever the consensus protocol comes to a point where the head of the canonical chain is updated for example, new attestations, new block arrival; it sends this information to the execution client and uses the `engine_forkchoiceUpdated` method to propagate this information.

`engine_forkchoiceUpdated`  has additional
semantics: *to start the payload build process*.

*Update head can happen without any new block arriving.* With new attestations in favor of one block, the consensus layer can decide to switch the head to that block. It just sends the `engine_forkchoiceUpdated` message signifying what the current head is.

### Build Block

Building blocks is primary functionality to keep building our blockchain and keep including transactions into blocks. The execution layer is responsible for building a payload (eventually a block). The payload build process is triggered by `engine_forkchoiceUpdated` and consensus layer fetches the payload via `engine_getPayload`.


## `engine_newPayload`

For request parameters and response, refer  [engine_newPayloadV4](https://github.com/ethereum/execution-apis/tree/main/src/engine/prague.md#engine_newpayloadv4).

The main purpose for this api is to validate the execution payload attached to the beacon block proposed by the proposer and published to libp2p.

### ***Task for the execution layer***

While processing the request to if the block hash is valid as well as the payload is valid, it is expected by the API to:

- validate `payload.blockHash` computation including `executionRequests` commitment, parse transactions and validate `expectedBlobVersionedHashes`.
- validate payload execution.

***Why CL can't verify the block hashes? Why execution client provides the payload status via engine api?***

Both CL and EL have to affirm that the block hash computed by the EL matches with the CL when it receives the payload via `engine_getPayloadV4`. `engine_newPayload` does the job of validating if the block hash computation and migration was indeed valid.

Because CL is unaware of the computation mechanism used to compute the block hash i.e. Keccak256 and RLP. And, to validate the blob version hashes, the consensus layer would need to parse transactions, so it would need to learn execution layer-specific things, like transaction encoding.

Hence, The consensus layer defers all these responsibilities to the execution layer. This is where we see the separation of concerns in practice in terms encoding and cryptographic primitives. After all the validations executed by EL, the payload is executed, and the corresponding status is returned.

***What is the significance of `parentBeaconBlockRoot`?***

The parent beacon block root is used in the execution. Consensus layer propagates it to execution layer, and this parent beacon block root is kept in a system smart contract. There's a history of parent beacon block roots that reside in a system smart contract on the execution layer for easier accessibility inside EVM.


## `engine_forkchoiceUpdated`

[engine_forkchoiceUpdatedV3](https://github.com/ethereum/execution-apis/tree/main/src/engine/cancun.md#engine_forkchoiceupdatedv3)

The crucial info shared in the request parameter is `forkchoiceState`. It includes `headBlock`, `finalizedBlock`, `safeBlock`.

The `finalizedBlock` is exposed in the JSON-RPC API to consumers of the JSON-RPC API.

Payload attributes (optional) also go along with `forkchoiceState` in the request parameter. It contains info regarding `timestamp`, `prevRandao`, `suggestedFeeRecipient`, `withdrawals`, and `parentBeaconBlockRoot`.

The response is again a `payloadStatus` (VALID | INVALID | SYNCING) along with a `payload_id` to obtain the payload later.

The implementation is quite complex and involves a lot of nuances.

## Beacon blocks and payloads

The payload in a beacon block can be empty itself i.e. it can have zero transactions but every beacon block has a payload.

The payloads also form a blockchain. Every payload has its parent (like beacon blocks). Payloads and beacon blocks have 1-to-1 relation i.e. one payload can only be attached to one beacon block and vice versa.

TLDR; we have two tightly coupled blockchains: execution (payload) chain & beacon chain.

## Block processing

Let's consider an example to better understand block processing (happy case, seamless addition of block C that fulfils the consensus and eventually becomes the head of the chain).

![From payload to new head block](/assets/lec-21/payload-to-head-example.png)

Below is a foregoing perspective (happy case) before a new block $C$ is received i.e. a new slot $S$ starts:

The consensus layer and execution layer have validated Block $B$ and Block $B$'s payload (via `engine_newPayload`) in slot $S-1$. The consensus layer, after executing the consensus protocol, in the starting of the next slot i.e. $S$, decided that $B$ is the head (via `engine_forkchoiceUpdated`), and the execution layer also knows that the payload of $B$ is new head of the chain.

1. At the start of every new slot, after building the beacon block $C$, `engine_forkchoiceUpdated` method gets called by CL client to update the new head of the chain on the EL side. The method also *triggers* the execution client to start the *execution payload building process* and in response returns two things: `PayloadStatus` & `PayloadId`.
2. With `engine_getPayload(PayloadId)`, the CL can get the `ExecutionPayload`. Only one `ExecutionPayload` can get attached to a `BeaconBlock`.
3. Hence now, block $C$ has `ExecutionPayload`. Now, consensus layer starts to validate the beacon block; it finds that Block $C$ is the child of $B$.
4. During validation, the ***CL checks everything related to consensus and communicates with the execution regarding the validity of the execution payload via `engine_newPayload(C)` method***. This is done synchronously. The response of `newPayload` method is wrt `PayloadStatusV1`. A status `VALID` signifies that block $C$ is considered valid by execution layer.
5. After all the successful checks, the block $C$ is deemed valid but is still not the head of the chain yet.
6. So, in order for block $C$ to be the head of the chain, `forkchoiceUpdated()` method runs at the start of every new slot, with `ForkchoiceState` (includes `headBlockHash`, `safeBlockHash` and `finalizedBlockHash`) and `PayloadAttributes` (to trigger the creation of execution payload). The response is an object with `PayloadStatusV1` (the `ForkchoiceState` provided in parameters is valid or not) and `payloadId` (for the next build process). Note that, with this method call, ***EL will update its head and the status signifies if the new block becomes the head or not.*** Status `VALID` means block $C$ is now the new head.
7. And the cycle continues.

## Handling reorgs

There could be scenarios when more than one beacon block points to the same parent block. This leads to a situation of reorganization aka reorgs. Reorgs are handled by consensus layer which takes care of all the scenarios that might lead to a reorg and also solutions to choose a forkchoice based on principles to settle them.

>But the execution layer should not be bothered with reorgs as long as they receive the correct head block to point to.

Consensus layer keeps the execution layer aware of the latest head via `engine_forkchoiceUpdated()` method. The execution has to just trust consensus as it is ignorant to the decisions made by the consensus layer.

## Payload building

As discussed in [[#Block processing]], once the `engine_forkchoiceUpdated(forkchoiceState, payloadAttributes)` request method gets sent by CL to EL, it shares the current head of the chain with EL and prompts EL to build a payload for its child beacon block.

The response by EL is `PayloadStatus` (if the current head shared by CL is valid or invalid acc. to EL) and `payloadId` for the execution payload that the EL is building.

EL clients need to know the latest head to the chain because only then they can run the build process. ***EL can only build a payload on top of the head of the canonical chain.***

`engine_forkchoiceUpdated` does two things on the EL side:

- Update the new head of the chain
- Start the payload building process for the new beacon block.

Both these tasks are *atomic in nature* i.e. one depends on anther (either both happens or none).

After, a short span, when the payload building process completes, the CL again requests the payload via `engine_getPayload(payloadId)` method. The response is an *execution payload* wrt to the beacon block of that slot.


CL builds **the initial version of the payload which has an empty transaction set.** [Refer 2nd point in Payload Building](https://github.com/ethereum/execution-apis/tree/main/src/engine/paris.md#payload-building). The reason is simple — If EL is not responding, CL could just *propose a beacon block with an empty payload* and would craft this empty payload by themselves, just not to miss the proposal. A beacon block must have a payload, but the payload can be empty.

*Ques.* Why EL needs to know what the head of the chain is?

*Ans.* EL needs this for its inner purposes to manage the state and do state pruning. Also, it needs this information for syncing. EL is unaware of the head and without that info, it can't pull data from the p2p network.

The JSON-RPC API is very important for blockchain data consumers to know what the head is.

EL needs to know about the finalized block because blockchain data consumers need assurance if their transaction was really included and is now persistant and will never change.

## Sync

The sync process of CL and EL are quite different in nature. Both the clients can't have the same syncing process. The main reason behind is EL clients support state sync that needs the constant update on the current head of the canonical chain in order to verify the state sync. Refer [optimisitc sync design rationale](https://github.com/ethereum/consensus-specs/tree/master/sync/optimistic.md#design-decision-rationale) to understand the reason behind the decisions.

EL could be out-of-sync for various reasons;

- newly joined node
- outage (offline for several minutes/hours)
- client upgrade

In all these potential scenarios, one thing stand common is that EL has no clue regarding the current head and its ancestors. Let's take an example:

![sync](/assets/lec-21/sync-ex1.png)

In this case,
1. According to CL, block $C$ is the head of the beacon chain but EL has no clue of $C$ and its parent $B$ as it is out-of-sync. Hence, the execution payload of beacon block $B, C$ is not yet validated by EL. So, it can't validate the block $D$ yet.
2. While EL is syncing, CL can not propose a block or vote because the information required to perform validation duties is not there yet. It can't vote on this payload unless it is fully validated by EL. ![sync-1](/assets/lec-21/sync-ex2.png)
3. So, in this case, the EL client responds to the `engine_newPayload` and `engine_forkchoiceUpdated` request with a `SYNCING` payload status until it syncs up to the head asynchronously (getting information via devp2p). Remember, EL can only validate via `engine_newPayload`, if it has the information of the latest head of the chain.
4. Once EL catches up, pulled off all these blocks from the network, and is able to validate block $D$, it validates it and responds with a valid status. ![sync-2](/assets/lec-21/sync-ex3.png)
5. Now, from this point, CL knows that EL has all the information to keep up with the blockchain and to keep processing and validating blocks.

But there is a nuance to how EL will be able to let the CL know if it received an invalid payload while syncing. Refer [Geth/Catalyst:CheckInvalidAncestors()](https://github.com/ethereum/go-ethereum/tree/master/eth/catalyst/api.go) to understand the detailed flow. The general flow is to look for the last valid payload and return its hash and let the CL know via;

```go
lastValid := &invalid.ParentHash

return {
	status: "INVALID",
	LatestValidHash: lastValid,
	ValidationError: "links to previously rejected block"
}
```

![sync-3](/assets/lec-21/sync-ex4.png)

In the above example, EL will share the invalid status with the `latestValidHash: A`, and CL will see that the last valid hash is A, hence the chain derails from B. It will invalidate all consensus layer blocks, all Beacon blocks, starting from Block B.

***TLDR***;

Syncing status from Engine API perspecitve, simply means that CL does not have enough information to say whether this payload is valid or not. There is not enough data on EL side to give any concrete verdicts on the validity of the upcoming payloads. CL will keep feeding payloads to E, and E will resolve its lack of data. This is called Optimistic Sync.

More on this: [optimistic sync](https://github.com/ethereum/consensus-specs/tree/master/sync/optimistic.md).


#### State management
Execution requires information in order to validate payloads. Hence, managing state is very crucial part for execution clients as that is how that information is maintained.

There are two ways to approach state management and different clients have adopted either one based on their preferences:

1. Multi-versioned
2. Single-versioned


| ***Multi-versioned***                                                                        | ***Single-versioned***                                                                        |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Keep multiple versions of an EL state, *up to a certain depth of a block in the block tree*. | Keep only one version of the state, the *post-state of the head of the canonical chain*.      |
| Instantly execute blocks on any fork of the block tree.                                      | Execute blocks on a chain only when it become canonical.                                      |
| The response of such clients once synced (SYNCING during sync) are VALID or INVALID.         | The responses are varied based on situation: ACCEPTED (new fork), VALID, INVALID and SYNCING. |
| Less space efficient                                                                         | High space efficient                                                                          |
| Example: Geth, Nethermind, Besu                                                              | Example: Erigon, Reth                                                                         |


### How forks in different versioned execution clients are handled?

#### MULTI-VERSIONED

![multi-versioned-clients](/assets/lec-21/multi-versioned.png)

In multi-versioned execution clients, the client will execute every new payload it receives. So as, $D$ arrived after $C$, but both have the same parent, hence a fork has been created. But the execution client will fulfil the `engine_newPayload` request of the CL client for block $C$ first and then $D$ with response as `VALID`. In our case initially, $C$ is the head, but later after successful processing of the payload $D$ and following the consensus rule, CL updated the head to $D$.

***TLDR;***

Multi-versioned execution clients have block tree, so they can just directly execute the payload and validate them instantly even in fork situations.

#### SINGLE-VERSIONED

![single-versioned-clients](/assets/lec-21/single-versioned.png)

As client is single-versioned, with the arrival of block $D$ and at this point, $C$ is the current head.

But, block $D$'s parent is $B$. But we don't have the post state of $B$, hence we cannot execute the payload of $D$.

So, this leads to a new edge case with status `ACCEPTED` where CL doesn't have enough clue to move forward. The CL sees an accepted block $D$, but doesn't know if it's safe to switch to this block as the head of the canonical chain. So it let the EL generate post-state of $B$ (upto EL clients to generate them) via `engine_forkchoiceUpdated()`.

In the case of Erigon, it use reverse state diffs to obtain block $B$'s post-state and apply payload $D$ on top of it. The fork is updated with the payload validation status. If the payload is valid, the CL will switch the head; otherwise, it will invalidate block $D$ and switch back to block $C$.

`ACCEPTED` is an optimistic scenario similar to `SYNCING` (CL optimistically awaits `latest_valid_hash`) where CL accepts the payload which could be `VALID` or `INVALID` but at the moment is `UNKNOWN` provided the payload's parent is known.

***Nuance!!!***

![single-versioned-nuance](/assets/lec-21/single-versioned-nuance.png)

There is a nuance to `SYNCING` in case of `ACCEPTED` during `engine_forkchoiceUpdated()` if there is a long chain of `ACCEPTED` status blocks.

***TLDR;***
The semantics for `ACCEPTED` status are:

- Payload's parent is known
- Payload's `blockHash`, `expectedVersionedHashes`, `executionRequests`, etc. are valid.
- Payload execution status is unknown.

- More on state DB differences between Erigon and Geth: [Protocol Berg: Igor Mandrigin - Blockchain node DB designs: from Geth to Erigon - YouTube](https://www.youtube.com/watch?v=e9S1aPDfYgw)

## Summary

- Engine-API allows for the separation of concerns between CL and EL.
- EL takes care of:
  - `keccak256` and other EL specific validation.
  - transaction execution.
  - EL state sync and block building, etc.
- Focus is towards simplicity and minimalism (add new things only if necessary).
- Support two different state management approaches.

## What to learn next

- Versioning - every method has an own version.
- Security - use JWT for authentication.
- Auxiliary methods:
  - `engine_exchangeCapabilities`
  - `engine_getPayloadBodiesBy(Hash|Range)`
  - `engine_getBlobs`
  - `engine_getClientVersion`

## Improvements

- Some CL clients run `blockHash` and other preliminary validations. They communicate with EL only to validate transaction execution.
- Nimbus has a prototype client which doesn't need `SYNCING` status.
- Get rid of EL blockchain data (JSON-RPC API) and use EL for state management, transaction execution and payload building. (very difficult to implement)

## Kurtosis for Engine API visualization

- [Kurtosis: A Deep Dive to Local Devnets \| ethPandaOps](https://ethpandaops.io/posts/kurtosis-deep-dive/)
- [GitHub - ethpandaops/rpc-snooper](https://github.com/ethpandaops/rpc-snooper)

## More references

- [Eth1+eth2 client relationship - The Merge - Ethereum Research](https://ethresear.ch/t/eth1-eth2-client-relationship/7248/1)
- [Architecture of a geth-based eth1 engine - The Merge - Ethereum Research](https://ethresear.ch/t/architecture-of-a-geth-based-eth1-engine/7574)
- [Engine API: A Visual Guide - HackMD](https://hackmd.io/@danielrachi/engine_api)

## Notes on [Engine API: A Visual Guide](https://hackmd.io/@danielrachi/engine_api)

- [Functions-tldr](https://hackmd.io/@danielrachi/engine_api#Functions-tldr) pretty much clarifies any confusion regarding the method calls that are in Engine API.
- In all scenarios, if you see it carefully, the EL always responds to the request sent by the CL to EL. It is always in all scenarios a one way interaction, in accordance to traditional API definition, **CL is a CLIENT and EL is a server**.
- In `engine_forkchoiceUpdated(ForkchoiceState, PayloadAttributes)`, if `PayloadAttributes == NULL`, then it means CL only wants to confirm if the `ForkchoiceState` is valid or not, and EL responds with `{payloadStatus: {status: VALID, ...}, payloadId: null}`.
- And if EL is syncing, then the status will be `SYNCING`.

***Block Building***

- A successful block building involves:
	- CL request for an execution payload via `engine_forkchoiceUpdated` request call.
	- For a valid `ForkchoiceState` and `PayloadAttributes`, EL starts building an execution-payload and returns the forkchoice request with `payloadId` and `payloadStatus`.
	- After a short span, CL again sends a request via `engine_getPayload(payloadId)`, providing the same `payloadId` it received previously.
	- EL returns the request via a response which contains `{executionPayload, blockValue}`. Note: `blockValue`: The expected value to be received by the `feeRecipient` (in WEI).
	- Later CL do a few things:
		- Attaches the execution payload to the beacon block.
		- Computes the state root. To understand the building process of beacon block, refer `BuildBlockParallel` (in `prysm/beacon-chain/rpc/prysm/v1alpha1/validator/proposer.go`).
		- Then, propagate the beacon-block.
- There are various reasons, block building could fail, the two primary scenarios involve:
	- `engine_forkchoiceUpdated` fails ❌. The reasons could be:
		- invalid payload reference by `forkchoiceState.headBlockHash`.
		- invalid `PayloadAttributes`.
		- Wrong `PayloadAttributes` version. (There are three versions. V1: paris, V2: shanghai and V3: cancun)
		- `ForkchoiceState` is invalid.
		- EL is syncing.
	- `getPayload` Fails ❌

***Block validation***

- Prerequisite to block validation is `engine_forkchoiceUpdated` method.
- Because, through `engine_forkchoiceUpdated`, the nodes updates its new head every slot.
- Block validation is another important task performed by EL on behalf of CL.
- The block validation request method is `engine_newPayload`.
- Via `engine_newPayload`, node determines if a block is `VALID`, `INVALID`, `SYNCING` or `ACCEPTED`.
- NewPayload method on the side of EL perform validation checks.
- Validation checks involves this [list](https://github.com/ethereum/execution-apis/tree/master/src/engine/paris.md#payload-validation).
- In case of `invalidBlockHash`, the status returned is `INVALID`, with the last valid block hash in `latestValidHash`.
- Regarding the status `ACCEPTED`, it is in the case of single-versioned clients (Shallow state clients). These type of clients only have "**one version of the state**": post state of the new canonical head block. So, in the case where the client receives a non-canonical block, then its status is `ACCEPTED`.
- Also, another important info, in order for execution payload to be valid, the versioning must be valid (i.e. follow the version based on particular hardforks).
