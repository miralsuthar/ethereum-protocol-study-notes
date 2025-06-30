# Lec-24: Pectra and Fusaka by Marius Van Der Wijden

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day24)

## Overview

This lecture discusses and explains various EIPs introduced in Pectra and will be included in Fusaka. The overview includes:

1. Pectra EIPs
2. Fusaka EIPs

## Sections Timestamp


| Topic                                   | Time    |
| --------------------------------------- | ------- |
| Introduction                            | 0:01    |
| Pectra                                  | 0:53    |
| EIP-7549                                | 2:25    |
| EIP-7840 & EIP-7691                     | 5:56    |
| EIP-2537                                | 8:32    |
| EIP-2935                                | 11:26   |
| EIP-7623                                | 13:56   |
| EIP-7685, EIP-6110, EIP-7002 & EIP-7251 | 18:00   |
| EIP-7702                                | 24:00   |
| Questions                               | 27:29   |
| Fusaka                                  | 42:10   |
| PeerDAS                                 | 46:40   |
| EOF                                     | 51:15   |
| Minor EIPs                              | 57:27   |
| Questions                               | 1:04:10 |


## Pectra (Prague + Electra)

[EIP-7600: Hardfork Meta - Pectra](https://eips.ethereum.org/EIPS/eip-7600)

### EIP-7549: Move committee index outside attestation

#### Remove `index` from `AttestationData`

```python
class AttestationData(Container):
	slot: Slot
	index: CommitteeIndex # ⇐ 🤡
	# LMD GHOST vote
	beacon_block_root: Root
	# FFG vote
	source: Checkpoint
	target: Checkpoint
```

- For 1M active validators, there are 64 committees per slot. (Currently, Ethereum have ≥ 1M)
- *While validators attesting in different committees for that particular slot, the only changed attribute is `CommitteeIndex`*. Apart from that, an honest validator will attest to the same `slot`, `beacon_block_root`, `source` and `target`.
- Hence, the whole attestation metadata changes and hence multiple committees for that slot *can't be aggregated* because they attest to different message.
- ***Solution***: Remove `CommitteeIndex` from `AttestationData`, so that aggregation of attestation for a particular slot is efficient.

#### Reduce `MAX_ATTESTATIONS`: `128 → 8`

- Initially set to 128, `MAX_ATTESTATIONS` represents the *no. of attestations a proposer could attach to `BeaconBlock` via `BeaconBlockBody`*.
- With `CommitteeIndex` removed from `AttestationData`, now all the attestations for the same slot can be aggregated (provided everything else in `AttestationData` is same). So only $8$ `MAX_ATTESTATIONS` would suffice.
- Previously, if we think for only one slot, each committee had different `AttestationData` hence, 64 different possible aggregated attestations. Hence, considering only a single slot, the no. of attestations that could be aggregated are 64 (128 max if previous blocks attestations are also considered based on inclusion delay).
- 1 slot attestations could only consume a total of 1 aggregated Attestation.
- Hence, 128 is very huge in relation as the worst case would be 64 (i.e. current and previous epochs).
- So, to avoid increase of block size, $MAX\_ATTESTATIONS = 8$ is considered. More details: [EIP-7549: Complexity analysis](https://eips.ethereum.org/assets/eip-7549/complexity_analysis)

#### Benefits of removing `CommitteeIndex`

- *64x more efficient light-clients.*
- *More efficient packing on-chain.* Hence, reducing cpu usage for attestor nodes. Also, now can contain more attestations as they can be aggregated more concisely. In simple words, less data duplication, more efficient bit packing. With this feature, now the chain is more resilient to offline attack (80-90% offline proposers → delay finality; previously 75%). This also benefits ZK circuits proving CL blocks a pairings to verify is reduced (1366 → 22).
- *More efficient attester slashings*

#### Deprecation strategy

- We don't remove the `index` field but rather setting it to fixed 0 at all times.
- Removing `index` altogether will complicate the slashing mechanism. Slashings have to be able to be included in-chain for a very long time (1-2 years).

Reference:

- [EIP-7549: Move committee index outside Attestation](https://eips.ethereum.org/EIPS/eip-7549)
- [PEEPanEIP#131: EIP-7549: Move committee index outside Attestation with dapplion #ethereum #staking - YouTube](https://www.youtube.com/watch?v=oZfV4Ell9WQ)

### EIP-7840: Add blob schedule to EL config files

- An informational EIP that recommends to add a new object `blobSchedule` to client configuration files (EL) so that its easier to be accessed by execution clients for various activities like `eth_feeHistory` rpc method.

```json
"blobSchedule": {
	"prague": {
		"target": 6,
		"max": 9,
		"baseFeeUpdateFraction": 5007716
	}
}
```

- Blobs (0x03 type txn) are 2nd dimension to EIP-1559. Refer [vitalik's article](https://vitalik.eth.limo/general/2024/05/09/multidim.html#blobs-multi-dimensional-gas-in-dencun). Hence, blobs follow the same pattern as 0x02 type txn. So, even blobs have target/max that adjusts based on demands.

### EIP-7691: Blob throughput increase

- Increases blobs from 3/6 → 6/9 (target/max).
- With L2s being the dominant users of blobs, there will be constant upward demand for blobs for next upcoming years and this hardfork was the first step towards it.
- Although, the EIP is pretty much straightforward. But, scaling blobs sustainably w.r.t. L1 and fulfilling L2s higher demands is difficult to manage.
- Hence, the numbers have to tested rigorously keeping home stakers (ethereum's most valuable asset w.r.t. decentralization) in mind as well.
- 6/9 were decided based on the avg worst case for solo stakers:
  - who don't use MEV-Boost: $9$
  - who use MEV-Boost: $9-20$
- Go through the PEEPanEIP series for more info along with two articles by ethPandaOps:
  - [EIP-7691 Retrospective \| ethPandaOps](https://ethpandaops.io/posts/eip7691-retrospective/)
  - [Understanding the Ethereum network limits using devnets \| ethPandaOps](https://ethpandaops.io/posts/network-limit-devnets/).

Reference:

- [PEEPanEIP#143: EIP-7691 Blob throughput increase with Parithosh, Toni and Sam #blob #L2 #ethereum - YouTube](https://www.youtube.com/watch?v=Ma31xvBoySw&t=88s)
### EIP-2537: BLS Precompiles

- Consensus layer uses BLS12-381 curve and BLS signature scheme to generate and aggregate signatures.
- In general, post Blake2 precompile addition to Ethereum and it lacking adoption, it was decided in consensus to resist new precompiles, hence this EIP was delayed for very long until Pectra.
- BLS12-381 could be integrated into a smart contract but the complexity makes it expensive w.r.t. gas.
- *Main usecase is to verify signatures of validators in EVM along with some usecase related with ZK-SNARKS (it uses BLS for proof verification).*
- More info about the EIP: [PEEPanEIP#133: EIP-2537: Precompile for BLS12-381 curve operations with Alex Stokes #cryptography - YouTube](https://www.youtube.com/watch?v=Kr0WRewb_AA)

### EIP-2935: Serve historical block hashes from state

- Previously only the last 256 block hashes were available in EVM.
- With this EIP, the availability increases from $256 → 8191$
- Reason being, EVM implicitly assumes having recent block hashes (last 256) at hand. But not enough given the future being stateless clients. EVM should have better context with more block hashes where the `BLOCKHASH_SERVE_WINDOW = 8191`.
- The block hashes are stored at `SYSTEM_ADDRESS`.
- And historical block hashes can be retrieved via `HISTORY_STORAGE_ADDRESS `.
- Benefits are:
  - Rollups can benefit from the longer history window through directly querying this contract.
  - It allows building/validating proofs related to last 8191 (`HISTORY_SERVE_WINDOW`) ancestors directly against the current state.
- More about this EIP: [Peep an EIP #10: EIP-2935 with Tomasz Stanczak - YouTube](https://www.youtube.com/watch?v=QH5yuNd3B6o)

### EIP-7623: Increase call-data costs

- Increases the cost for calldata hence reduces the worst case block: $7.15MB → 2.86$ (uncompressed).
- Initially, calldata was used by L2s as well for data availability pre-4844.
- L2s using calldata will eventually blow up the storage in future. With blobs, the data availability usually lasts for approx. a month.
- For normal transactions (more to do with execution than storing data via calldata), the cost won't increase.
- But the transactions where the calldata increases will exponentially increase costs.
- *Less execution, more data → cost increases.*
- Gas limit provides the worst case upper limit to the size of the block.
- *Increasing the Gas Limit → increases the block size.* Hence, balancing gas limit and block size is important.
- More info on the EIP: [PEEPanEIP #140: EIP-7623: Increase calldata with Toni Wahrstätter #ethereum - YouTube](https://www.youtube.com/watch?v=D8UnMN2Cjw4)

### EIP-7685: General purpose execution layer requests

- Let's understand first, **"WHAT ARE REQUESTS?"** Requests are an act of *asking for an operation on the execution layer i.e. to be recognized on the consensus layer*.
- Previously, the communcation between EL and CL for such deposit requests via constant listening to specific events emitted in logs related to deposits and withdrawals.
- But with 7685, it provided a proper communication of requests via EngineAPI (refer `engine_newPayloadV4` in execution-apis repo) and [this rationale](https://eips.ethereum.org/EIPS/eip-7685#request-source-and-validity).
- There are various requests that consensus layer wants info of (from EL):
  - **Deposit request (EIP-6110)**
  - **Exit & Withdrawal requests (EIP-7002)**
  - **Validator Consolidation requests (EIP-7251)**
- *The above requests are all included in **Pectra**.*
- EIP-7685 is a very much inspired from EIP-2718 (Typed-Transaction envolope).
- It is also *an envolope but for requests* that helps ease the procedure of introducing requests a.k.a. *General Purpose EL requests*.
- All requests are distinguished based on `request_type` i.e. unique `request_type` for each new request.
- All the above requests discussed uses EIP-7685 and brings all the different requests under the same bus.
- Many more requests might be introduced in future hence, EIP-7685 does a job of providing a proper structure for new requests so that the communication between EL & CL is direct and unambiguous. Example: Rainbow-staking.
- The format of requests involve `request_type` and `request_data`.

```python
request = request_type + request_data
requests = [0x00_request_0 + 0x00_request_1 + 0x01_request_0]
requests_root = MPT(requests).root()
```

- Finally, add `requests_root` to `BlockHeader` & `requests` to `BlockBody`.
- Ordering of requests are based on *group of* `request_type` & its `request_index` (SQL reference).

Reference:

- Read more in detail about the EIP: [EIP-7685: General Purpose Execution Layer Requests](https://research.2077.xyz/eip-7685-general-purpose-execution-layer-requests)
- [PEEPanEIP#132: EIP-7685:General purpose execution layer requests with Matt Garnett \#ethereum \#pectra - YouTube](https://www.youtube.com/watch?v=3g71BGZFASE)

### EIP-6110: Deposits on chain

- Like discussed, uses EIP-7685 to help CL nodes get information on new deposits made to the deposit contract from EL.
- It is 0x00 `request_type` w.r.t. EIP-7685 encoding mechanism.

### EIP-7002: EL triggered withdrawals

- Allows smart contracts to trigger exits on the beacon chain.
- It is 0x01 `request_type` w.r.t. EIP-7685 encoding mechanism.

### EIP-7251: Max-EB

- Increases staking limits: $32 ETH → 2048 ETH \text{ per validator}$
- Allows for consolidation of multiple validators, descreasing cost for running multiple keys.
- Allows for automatically compounding stake.
- There are three types of validator post Max-EB:
  - **BLS (0x00)**: does not have withdrawals enabled, can stake 32 ETH (min-max)
  - **ETH-1 Addresses (0x01)**: have withdrawals enabled, can stake 32 ETH (min-max)
  - **Compounding (0x02)**: have withdrawals enabled, can stake between 32-2048 ETH (min-max), can use rewards for auto-compouding
- For consolidation, it can be done via `0x02: request_type` w.r.t. EIP-7685 encoding mechanism.
- Helps reduce the number of validators, when consolidated. Hence, the stake amount doesn't change.
- More on risks due to Max-EB: [MAXEB Slashing risks: expected loss and variance - HackMD](https://hackmd.io/@5wamg-wlRCCzGh0aoCqR0w/r1aYbH8x0)

### EIP-7702: Set EOA code

- Allows for EOA to act as if it was a smart contract.
- Improves the UX significantly for users.
- Allows for:
  - batching multiple operations together (ERC20 approval & transfer in a single batched txn)
  - Sponsorship (Ex: Help compromised EOAs retrieve their ENS securely)
  - Privilege de-escalation (Ex: sign sub-keys that can only access a certain % of funds of a user)
- For more info, refer [EIP-7702 Set Code for EOAs with Anders Kristiansen | PEEPanEIP#148](https://www.youtube.com/watch?v=ome47qtvuU0&pp=ygUIZWlwLTc3MDI%3D)

## Fusaka (Fulu + Osaka)

The main aim of Fusaka is ***PeerDAS*** which will help enhance the data availability landscape via sampling.

The Hardfork Meta is [EIP-7607](https://eips.ethereum.org/EIPS/eip-7607). The EIP includes all the scheduled, considered and declined EIPs w.r.t. Fusaka.

### PeerDAS

- With EIP-4844, i.e. introduction to blobs (0x03 txn type), nodes were required to download blob data for every block (if any) and keep it for month (until deadline) and forget it after.
- The problem is every node has to keep a copy of blob data for span of month and the number of blobs increase (due to demand) in future, every node downloading all data is unfortunate.
- Peer Data Availability Sampling (Peer-DAS) solves this via **KZG cell proofs** (instead of blob proofs) and **one-dimensional erasure encoding**.
- On EL:
  - New `BlobsV2` wrapper
  - `engine_GetBlobsV2`
- On CL:
  - Subscribe to multiple subnets
  - Verify random portions of blob data
- PeerDAS is a second step towards danksharding approach to rollup centric roadmap.
- The third and final step is Full DAS with 2 dimensional sampling.
- EIP for PeerDAS is [EIP-7594](https://eips.ethereum.org/EIPS/eip-7594).
- For more information on PeerDAS, read [PeerDAS from scratch by Emmanuel Nalepa](https://hackmd.io/@manunalepa/peerDAS)

### EOF

- A controversial EVM upgrade among the core devs.
- It was collectively discussed and decided that EOF will **not be included in Fusaka** and has to be reconsidered for future upgrades. (announced post-lecture recording)
- EOF provides a header format to contracts with defined code and data sections.
- Moves checks to compile time, hence,
	- no overflow checks at runtime
	- No jumpdest analysis
- No more dynamic jumps
- Removes gas and code observability
- enhances zk-proving efficiency

### EIP-7892: Blob Parameter Only Hardforks

- With introduction to BPO only hardforks, the increasing blobs will have their own hardforks and it will have nothing to with traditional hardforks like Pectra, Fusaka.
- The traditional hardforks requires a lot duplication of code. This introduces a lot of unnecessary complexity.
- The hardfork will only allow change to blob parameters i.e. `target`, `max`, `maxBlobsPerTx`, `baseFeeUpdateFraction`.
- This change will allow frequent BPO hardforks in future as per demands.
- EIP: [EIP-7892: Blob Parameter Only Hardforks](https://eips.ethereum.org/EIPS/eip-7892)

### EIP-7823 Upper bound for `modexp`

- Modexp precompile is one of the worst precompiles w.r.t. client teams due to two primary reasons:
  - There are a lot of edge cases that leads to bugs.
  - also it is currently unbounded i.e. there is no upper bound to numbers one can put.
- Solution is to increase gas cost to counter DDOS if possible.

### RIP-7212: SECP256R1 precompile

- RIP is Rollup improvement proposal.
- Adds a precompile to verify R1 signatures.
- Allows for hardware wallets in secure elements.
- Could be very beneficial for smart contract wallets to interact with hardware to produce signatures.
- Yet to be decided if it will be included in Fusaka.

