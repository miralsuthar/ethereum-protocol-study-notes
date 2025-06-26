# Lec-9: Verkle Tree by EF Stateless Team

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week7-research)

## Overview

The lecture's sole focus is help us understand the importance of Verkle Trees, a replacement to Merkle Patricia Tries (MPT):

 - Introduction
 - Motivation
 - How Verkle Trees Work
 - Challenges of making ethereum stateless
 - Cryptography
 - Data structures
 - Gas Accounting changes
 - State Migration
 - Pre-image Distribution
 - Sycning with Verkle Trees
 - Elephant Mascot
 - Community Involvement
 - Post Quantum Security
 - Computational Overhead
 - Current Tasks & Roadmap
 - Contribution Opportunities
 - State Expiry
 - History Expiry
 - Verkle Implementation Timeline

*The Stateless Team:*

- Ignacio Hagopian
- Guillaume Ballet
- Josh Rudolf
- Kevaundray Wedderburn

To get more information about Verkle Trees, go to [verkle.info](https://verkle.info).


## Sections Timestamp


| Topic                                                                         | Time    |
| ----------------------------------------------------------------------------- | ------- |
| Introduction                                                                  | 4:17    |
| Intro of Stateless Team                                                       | 6:41    |
| Motivation                                                                    | 8:19    |
| TLDR                                                                          | 13:38   |
| Challenges                                                                    | 17:00   |
| Cryptography                                                                  | 17:27   |
| Merkle Patricia Trie                                                          | 19:05   |
| Vector Commitment                                                             | 20:27   |
| Bandersnatch                                                                  | 23:07   |
| Data Structure                                                                | 25:21   |
| Merkle Patricia Trie v/s Verkle Tree                                          | 30:28   |
| Storing information in the leaves of VKT                                      | 32:23   |
| How tree keys are calculated?                                                 | 36:41   |
| Question: How process of retrieval changes in Verkle trees                    | 42:10   |
| Question: Will verkle tree implementation have hiding property in commitments | 44:47   |
| Gas Accounting                                                                | 45:25   |
| State Conversion                                                              | 54:00   |
| More challenges                                                               | 1:01:11 |
| Verkle Sync                                                                   | 1:04:28 |
| Question: Will VKT make the transition to quantum safe Ethereum any easier?   | 1:09:00 |
| Question: Computational Overhead and Branching Factor                         | 1:12:06 |
| Question: Current Tasks, Challenges and Roadmap                               | 1:16:35 |
| Question: How Verkle trees benefit State Expiry                               | 1:20:00 |


## Table of contents

<!-- mtoc-start -->

* [Motivation](#motivation)
* [Overview of Verkle Trees](#overview-of-verkle-trees)
* [Challenges Of making Ethereum stateless](#challenges-of-making-ethereum-stateless)
* [Cryptography in Verkle Tree](#cryptography-in-verkle-tree)
* [Primer: Merkle Patricia Trie](#primer-merkle-patricia-trie)
* [Vector Commitments](#vector-commitments)
* [Group & Multi-proof](#group--multi-proof)
* [Data Structure](#data-structure)
* [Proving: MPT v/s VKT](#proving-mpt-vs-vkt)
  * [How to store information in leaves? (EIP-6800)](#how-to-store-information-in-leaves-eip-6800)
  * [How tree keys are calculated?](#how-tree-keys-are-calculated)
* [Questions (phase-1)](#questions-phase-1)
* [Gas accounting (EIP-4762)](#gas-accounting-eip-4762)
* [State Conversion](#state-conversion)
* [Overlay Tree](#overlay-tree)
* [More challenges](#more-challenges)
* [Verkle Sync](#verkle-sync)
* [Questions](#questions)

<!-- mtoc-end -->

## Motivation

*Problems with states in ethereum:*

- Stateful applications are complex.
- Most of the values reside in the state.
- State in system create many challenges
  - How do you access the state efficiently?
  - How do you save the state?
- State only grows with time
- For Ethereum it puts some pressure on core values
- Being able to validate blocks, you need to download all the state (which takes time) and also storing consumes somewhere takes up ~ 1 TB ± 300 GB
- Handling state is not ZK friendly, hence difficult to introduce ZK to the protocol in future.

*Solution i.e.* ***Verkle Trees***:

- Build a better **stateless** world…
- A new node joining the network doesn't have to sync all the state nor require disk storage for the EL client.
- ZK friendly L1:
  - remove complex data structure i.e. Merkle Patricia Tree
  - remove heavy use of non-zk friendly hashes i.e. Keccak256
- Reduce hardware requirements
- Easier to implement a new *stateless* EL client
- Potentially allow increasing the gas limit
- Might trigger the specialization of protocol roles i.e. different nodes might have specific roles in the protocol (interesting for nodes involved in staking).

## Overview of Verkle Trees

The unique piece of magic with Verkle Trees is **Execution Witness**.

Execution witness contains ***all the data*** that you need to *verify a block*.

Today, a client needs to download all the state in order to fetch and correct verify the upcoming blocks (query MPT to check if sender has enough balance, calldata provided successfully execute the contract call by accessing the contract code and state correctly, etc.)

With Verkle trees, the process of validation is rather seamless. The client receives a extra data along with block data, which is called witness. It contains all the state that is accessed in the block. So, to validate, only need to verify using the witness if the state queried is legit or not.

This is also possible with Merkle Patricia Trie, but the issue is to validate the witness itself which is not possible with such data structure.

In order to monitor that the witness shared is legit, we generate a cryptographic proof of the same (similar to merkle proof).

The cryptographic proof is very small hence the witness size is small enough to make this viable.

Another interesting piece of info is *witness also contains all the code that you will need to execute contracts* (currently the contract code hash is stored in the trie and the same is pointed to contract code storage).

In short, after Verkle trees, with witness, you can validate a block. No need to query balance, storage slots, contract code hash, etc. to fetch data to verify.

## Challenges Of making Ethereum stateless

- Need to introduce a new cryptography stack
- Need to change the state tree data structure
- Need to change gas accounting
- Need to migrate data from Merkle Patricia Trie to Verkle Tree.

## Cryptography in Verkle Tree

> *Cryptography works fundamentally at the lowest layer*.

- For verkle trees, the cryptography magic happens in the execution witness proof which ensures that the witness is correct.
- The reason behind the witness proof having a small size is:
  1. allows the witness to be transmitted with each block (i.e. each stateless client will need it)
  2. allows keeping the protocol trustless

Ultimately allows Ethereum to be trustless as each stateless client can verify the block without trusting any other party.

The basic ingredients of cryptography involved in the case of Verkle Trees are:
1. Vector Commitments
2. Inner Product Argument
3. Multiproofs

## Primer: Merkle Patricia Trie

Merkle Patricia Trie use keccak256 hash function to hash the information stored in the leaf nodes. There are 16 children nodes to the parent node signifying the hex values i.e. `0-F`. Traversal happens for a given hash differently for Transaction and Receipts trie (path traversal uses RLP encoding on the index of the transaction) and for State Trie (path traversal uses the keccak hash of 20-bytes account address).

*Content Addressing* is crucial concept and runs deep in the veins of blockchain.

To understand content addressable storage, watch [nf-core/bytesize: Content Addressable Data Storage - YouTube](https://www.youtube.com/watch?v=7wmaWU6-pYM) and make notes on the same. Also mark it as a  reference here.

## Vector Commitments

In verkle trees, we don't use ~~merkle trees~~, instead we use Vector Commitments.

A vector commitment looks like:
$$C = Commit([S_0, S_1, S_2, …, S_{253}, S_{254}, S_{255}])$$
where,
>$C$ = Commitment (eq. to cryptographic hash)
>$V$ = $[S_0, S_1, S_2, …, S_{253}, S_{254}, S_{255}]$ = Vector
>$S_{i}$ = Scalar Field Element

$C$ is ***binding*** to the vector $V$, i.e. if $V$ is changed then, $C$ will change as well.

> Hence, there exist no other $V'$ which has the same commitment $C$.

There are two functions which you can use to prove and verify vector commitments:
1. $Prove(V, idx) = π$
2. $verify(C, idx, res, π) = True/False$

In above two functions, while generating the proof, the *prover needs a vector* but the *verifier only needs the commitment*.

## Group & Multi-proof

The setup for the vector commitment used in Verkle Tree is:

- **EC Bandersnatch** (Banderwagon, remove cofactor): [ethresear.ch](https://ethresear.ch/t/introducing-bandersnatch-a-fast-elliptic-curve-built-over-the-bls12-381-scalar-field/9957)
- **Scalar Field** ($Fr$) = `253 bits`
- **Base Field** ($Fp$) = `255 bits`
- *No pairings* (i.e. smaller field = more efficient)
- ZK-friendly:
  - Base field ($Fp$) is the Scalar Field ($Fr$) of ***BLS12-381***.
  - Doing SNARKs using BLS12-381, then the elliptic curve operations in Bandersnatch are native field operations.
  - Doing EC operations in a circuit are native field operations (i.e. not emulating fields)
- Inner Product Argument i.e. single vector opening hence *no trusted setup*.
- Multiproof: **Aggregate** *multiple* vector openings into a *single* vector opening!
- Implementation Notes: [Understanding The Wagon - From Bandersnatch to Banderwagon - HackMD](https://hackmd.io/@kevaundray/BJBNcv9fq)


Read more about commitment schemes from [@kullervo - HackMD](https://hackmd.io/@kullervo)
Read about vector commitments: [Better_Vector_Commitments.md](https://github.com/protocol/CryptoNetLab/blob/main/open_problems/Better_Vector_Commitments.md) and [Vector Commitments - HackMD](https://hackmd.io/@kullervo/commitmentVector)

## Data Structure

The **Verkle tree** name comes from a *mix* of *vector commitment* and *Merkle tree*.

Like previously discussed, we currently have 3 trie to manage data stored on Ethereum:

1. World State Trie
2. Receipts Trie
3. Transactions Trie

![merkle-patricia-trie](/assets/lec-9/mpt.png)

Source: [Ethereum Yellow Paper Walkthrough (2/7)](https://www.lucassaldanha.com/ethereum-yellow-paper-walkthrough-2/)

This will change in future, with [EIP-6800: Ethereum state using a unified verkle tree](https://eips.ethereum.org/EIPS/eip-6800), there will be only one single trie.

Hence, *all the balances of accounts* and *all the storage slots of all contracts* are in the same trie.

The shape of trie is very different!

There are two types of nodes:
1. Internal Node
2. Extension Node

The branching factor of internal nodes is 256 (16 in MPT).

> ***Higher the branching factor, shallower the node.***

The structure looks like:

- The tree keys are 32 bytes (256 bits), same as today.
- The first 31 bytes (254 bits) define a ***stem***, which is the pathway to **extension level commitment** that further leads to suffix level commitment
- Each leaf node stores 256 values.
- Keys are grouped in groups of 256 values, and the way that we encode them in leaf nodes and perform a vector commitment of these elements.
- The reason behind having *2 commitments $C_1$ and $C_2$ (suffix level commitment)*, is scalar field has a size of 253 bits, hence cannot store 256 bit values into a single vector.

For deep dive, refer the resources provided in [Verkle tree structure | Ethereum Foundation Blog](https://blog.ethereum.org/2021/12/02/verkle-tree-structure)

## Proving: MPT v/s VKT

In MPT, despite the branching factor of 16 and the tree is quite shallow, but still to verify if the value is correct, you need to verify all the node's data to really create a proof (i.e. root hash).

In Verkle Tree, using vector commitment, we don't really need to provide all 256 values, but only one value associated with the data you want to prove.

Verify function (see above.) has 4 parameters, i.e. *commit*, *proof*, *index* (this is what is being talked about in the above paragraph) and *value*.

### How to store information in leaves? (EIP-6800)

**Leaf nodes**: *store 256 (scalar field) values*

**Account Header**: ![account-header](/assets/lec-9/account-header.png)

**More storage slots in case of smart contracts**: ![more-storage-slots](/assets/lec-9/more-slots.png)

For smart contracts, most accessible code is stored in the account headers. Storage slots that have a high probability of being accessed in a transaction.

The rest of the storage slots and code chunks (except the 128 stored in account storage) is not stored in the leaf node of the account (stored in other leaf nodes).

>Smart Contracts code is also in the tree!

Also, the smart contract code stored is ***chunked***.

*Code-chunk size*: 32-byte value

![code-chunks](/assets/lec-9/code-chunks.png)

- `Chunk[0]` = no. of bytes that are continuation of a `PUSHX` instruction of previous chunk i.e. *1 byte*
- `Chunk[1:32] = Bytecode[0:31]` i.e. *31 bytes*

This goes on until the end of the contract code.

### How tree keys are calculated?

Today, we use Keccak256 to calculate tree keys.

But with Verkle trees, we switch to using ***Pedersen hash*** (EC based Hashing function).

$$TreeKey(address, treeIndex, subIndex) = Commit(2+256^{64}, address[0:16], address[16:32], treeIndex[0:16], treeIndex[16:32])[0:31] ++ subIndex$$

For example: if you want to know your account's latest info:
$TreeKey(address, 0, [Version|Balance|Nonce|…])$
i.e.,

$address$: user account hash

$treeIndex$ = 0 (Default)

$subIndex$:
- Version = 0
- Balance = 1
- Nonce = 2
- CodeHash = 3
- CodeSize = 4

>Similarly to access the storage slots and code-chunk, pass a valid `subIndex` (refer EIP-6800).

To access the rest of *storage slots*: $pos = MAIN\_STORAGE\_OFFSET + storage\_key$

$$TreeKey(address, pos/VERKLE\_NODE\_WIDTH, pos \% VERKLE\_NODE\_WIDTH)$$

To access the rest of *code chunks*: $chunk\_id = CODE\_OFFSET + chunk\_id$

$$TreeKey(address, chunk\_id / VERKLE\_NODE\_WIDTH, chunk\_id \% VERKLE\_NODE\_WIDTH)$$

- `MAIN_STORAGE_OFFSET` is a big number values i.e. $256^{31}$, hence, the `pos/VERKLE_NODE_WIDTH` i.e. storage slots and `chunk_id/VERKLE_NODE_WIDTH` i.e. code-chunks do not *overlap*.
- With main storage offset being really big, but the code size itself is *limited*.
- Code size might increase in future, but not the extent of storage slots, hence there should never be clash in terms of `treeIndex`.
- Also, the size of `CODE_OFFSET = 128`, whereas, `VERKLE_NODE_WIDTH = 256`.

## Questions (phase-1)

*Ques.* How the process of retrieval changes from Merkle Patricia Trie to Verkle Tree? What are the benefits of calculating extra commitments?

*Ans.* Keccak hashing in CPU for merkle trees is really fast. Whereas, doing elliptic curve operations for verkle trees is much slower in comparison (can never become faster than hasing in MPT).

This is a *tradeoff* of trying to make the cryptography of Verkle trees SNARKs friendly.

---

*Ques.* Whether the Verkle tree implementation will have a hiding property as commitments?

*Ans.* It is only having binding properties, not really hiding, because hiding doesn't make sense since all the state is public anyway.

The commitment doesn't really require to avoid leaking information.

## Gas accounting (EIP-4762)

- In stateless, IO speed and state size are no longer the primary concern.
- Main concern now is to make the witness that state clients download and unpack and execute as small as possible.
- *Gas should account for increase in witness size.*
- There are three actions that increase the witness size:
  - *Reading state*: state needed to be able to execute the block (hence the state info gets added to the witness). Also reading the state means to prove that the value that you tried to read, contains the value. Hence, gas is required.
  - *Writing state*: provide how the tree looks like in `write positions`, to be able to update the tree i.e. root commitment. Pay gas for the update (changes) made to the state to prevent write data without paying for the calculation computation resources used.
  - *Executing code*: stateless client need the code to execute! Finally, gas model is changed to account for the code that gets executed as it is added to witness hence increase its size and hence the block size as well.
- Read more about it here: [EIP-4762: Statelessness gas cost changes](https://eips.ethereum.org/EIPS/eip-4762#witness-gas-costs)

Based on increase of witness size, there are *5 gas cost changes*:
1. Accessing a new tree branch → `WITNESS_BRANCH_COST (1900)`
2. Accessing a new value in a leaf → `WITNESS_CHUNK_COST (200)`
3. Write triggers updating a branch → `SUBTREE_EDIT_COST (3000)`
4. Changed value in leaf → `CHUNK_EDIT_COST (500)`
5. Wrote a leaf node which was empty → `CHUNK_FILL_COST (6200)`

**Access List** already exists in the current state model. Its task is to perform *distinction* of what has ***already been accessed*** as opposed to what has ***not been accessed***.

So, in Verkle trees as well, we use the same scheme of access list to differentiate between accessed and unaccessed branch/leaf. So once the state info has been added to the witness, it no longer grows and can be verified or traversed anytime. The hefty gas cost is a first time thing because once its added in the witness, then it can be read from memory cache.

The concept of access list, comes from cold-storage and hot-storage (this is access list). In the new system, the gas cost to access a leaf group for the *first time* is *costly* but once added to the witness then it gets cheaper in future access.

This gas cost model has been very thought through wrt to EVM as well as dApps. The overall gas cost remains same throughout.

>The idea is to get rid of all the old cold storage cost with this new model (EIP-4762).

The above accesses gas cost applies when:
- Particular opcodes are executed (e.g. `SSTORE`, `SLOAD`, `BALANCE`, `SELFDESTRUCT`, etc.)
- Indirect tree acess in transaction executions (e.g. send value `FROM` to `To`) `[Not charged!]`
- Indirect tree access in block execution (e.g. withdrawals, block rewards, blobs) `[Not charged!]`
- Contract code is executed!!

These charges only happen once per key per transaction. Any further slot access charges "warm access" cost (100) i.e. reading from memory.

## State Conversion

When we switch the bus from MPT -> VKT, state conversion would be around 200-300 GB of state info.

It is not an easy task. It requires to apply different hashing model (use Pedersen Hash instead of Keccak256) i.e. rehash all states. There are various strategies to perform this task, in both centralized and decentralized way.

The current chosen one is "**Overlay tree**" i.e. [EIP-7748: State conversion to Verkle Tree](https://eips.ethereum.org/EIPS/eip-7748).

## Overlay Tree

1. Freeze the tree at block $h_{fork} - 1$
2. At the block at which the hardfork happens i.e. $h_{fork}$, ***start with a fresh verkle root***. All the new writes are going to be added to the new verkle tree. Post hardfork, the MPT is read-only, it can be used only for reference, copying information if it does not exist in VKT.
3. Also, $N$ (iterator) leaves are converted and added from MPT to VKT every block post hardfork.
4. The process continues over to the next blocks.
5. Once previous blocks start to finalize, the internal node can be deleted from the MPT, to free lots of space.
6. Eventually, all the nodes in the MPT will be transferred to VKT. Slowly MPT can be completely deleted once all the leaves are converted and copied.

But how many leaves should be transferred to VKT, i.e. the iterator, $N$:
- $N = 1K, → 6 Months$
- $N = 5K, → 1 Month$, requires more than 20% network bandwidth
- $N = 10K, → 15 Days$

Its a tradeoff between *how many leaves copied per block* and *how much part of the network we are comfortable with losing during the transition*.

The **worst case** is to *loose more than 1/3 of the network*.

>Testing is still in progress to discover an *ideal maximum iterator* ($N$) that triggers the transition smoothly.

## More challenges

- Now the most difficult task among all is re-hashing tree keys. And to perform re-hashing, its prerequisite is *pre-images*.
- Not all EL clients are designed to store hash pre-images (Some of them do though, for example: Erigon and Reth).
- The idea is for Erigon & Reth clients to generate the file that contains the pre-image, which they will then gossip to their peers.
- Verifying if a client has all the pre-image is rather easy. Just go over your own database and verify that you've got all the pre-images. Much cheaper than converting the entire database.
- The branching problem is that you need some time to get the pre-images of the frozen Merkle tree distributed. It requires *one week* to generate pre-image and distribute them (read the hashmd below for detailed info).
- Then the sweeping starts.
- If there is problem in the pre-image distribution, there is always a possiblility of an emergency release.
- More information regarding the same here: [VKT-Preimage-generation-&-distribution](https://hackmd.io/@jsign/vkt-preimage-generation-and-distribution)
## Verkle Sync

The intention with VKT is also to simplify sync of nodes.

- You already have parts of the tree packaged in every block.
- You would start at the block you join the network at and you execute statelessly.
- As you go, you keep rebuilding trees, so you can accumulate all the leaves.
- You have the latest version of a leaf, which is always the biggest problem with the sync because you are given the latest view of the tree.
- If a leaf hasn't been touched, it means you have the latest version—it's from a previous block.
- In the background, you start downloading; you start asking full nodes around you for all the leaves that haven't been seen in the stateless view so far.
- You can verify them very easily because it's only going to be a small subset of the tree. You can recompute the root commitment very fast and verify that what you've got is the current state—at least it fits in your current view.
- It doesn't matter how long this process lasts because you can keep executing blocks statelessly until that point.

> The reason behind elephant being the *mascot for verkle trees* is they are known for destroying branches of trees, uprooting and destroying trees. Suggested by Paritosh, DevOps Team. With Verkle trees, the intention is to **uproot MPT**.

## Questions

*Ques.* Does VKT help ease the transition to something that is quantum secure?

*Ans.* All the elliptic curve cryptography (hence VKT) is not safe for quantum computers. Every cryptography used in Ethereum has an alternative to something that is quantum safe (included into the protocol only if its alternative exists).

Quantum crypography is pretty new and much slower as requires more compute and have bigger signatures. Hence its not practical to say "Just use quantum safe cryptography". As the tradeoffs become practical and approachable, the shift towards Quantum safe Ethereum will begin.

Although the switch might seem redundant but its necessary to enhance the protocol.

---

*Ques.* MPT have a branching factor of 16; whereas have 256. Are there any benchmark links or analysis on tradeoffs for bandwidth computation? And regarding the computation required for the transition on the node transitioning to the Veral tree—how much heavier machine is needed for this?

*Ans.* The magic for Verkle trees is that the branching factor doesn't have an impact on the openings we have to do on each node or on each vector.

There has to be a balance between the branching factor and the cost of doing openings for verifying openings for verifiers. Increasing the branch factor makes the tree shallower, requiring fewer elements in the proof. You have to do a multi-factor analysis on verifying time for proofs and how much that helps the depth of the tree.

For state conversion benchmarks, we feel comfortable migrating probably 10K key values per block. New benchmarks are to performed including the blobs.

---

*Ques.* What is the current roadmap, challenges and current tasks at hand?

*Ans.* The current roadmap is *sync*, *conversion*, *pre-image distribution*.

Area for contribution:
1. Help implement Verkle Trees to various clients (Nethermind, Geth, EthereumJS have quite complete implementations).
2. Building stateless clients
3. Testing how L2s, compilers and daps going to handle Verkle Tree specifications.
4. There's plenty of tooling required (no support for block explorers)

---

*Ques.* How VKT benefits State Expiry?

*Ans.* Verkle trees make state expiry more feasible or at least more practical. The proving system makes it so much more practical, but it makes it less relevant at the same time because state growth becomes less of a problem.

State expriry is less urgent now because Verkle trees make state growth less of a problem, but definitely a topic we'll need to face it sooner or later.

[A state expiry and statelessness roadmap - HackMD](https://notes.ethereum.org/@vbuterin/verkle_and_state_expiry_proposal)

[How to join the Verkle Devnet - HackMD](https://hackmd.io/@weiihann/rk5stTxSa)

Also, if we get rid of historical blocks and introducing verkle trees also helps reduce the burden on History Expiry. As history expiry is an implementation and does not require a hard fork, but it has some prerequisites that to be in place before implementing it. More regarding the same at The Purge lecture (upcoming).

