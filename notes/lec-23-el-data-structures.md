# Lec-23: EL Data Structures by Gary Schulle and Karim

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day23)

## Overview

This lecture focuses on EL data structures i.e. Merkle Patricia Tree implementation is different clients. The overview includes:

- Merkle Patricia Tree
- Forest v/s Bonsai
- Different EL client implementations of State Trie
- Bonsai ARchive

## Sections Timestamp


| Topic                                          | Time    |
| ---------------------------------------------- | ------- |
| Introduction                                   | 0:01    |
| Patricia Merkle Tree                           | 3:12    |
| Branch Nodes                                   | 6:46    |
| Extension Nodes                                | 7:53    |
| Leaf Nodes                                     | 8:38    |
| Anatomy of State Trie                          | 11:50   |
| Forest v/s Bonsai                              | 27:29   |
| Questions                                      | 38:50   |
| Different client implementations of State Trie | 43:30   |
| Geth                                           | 44:56   |
| Nethermind                                     | 47:47   |
| Erigon & Reth                                  | 57:13   |
| Bonsai Archive                                 | 1:03:15 |
| Questions                                      | 1:18:33 |


## Introduction

Ethereum state (Merkle patrticia tree) specification has remained largely unchanged since the whitepaper.

But, the state implementation has evolved over time with new ways to optimise over space and time.

Execution clients are quite different in terms of state implementations.

## Patricia Merkle Tree

- Patricia tries is a prefix treewhich compress the edges of a trie.
- Merkle trees are hash trees allows efficient and secure verification of the tree contents. Nodes are tagged with hashes, and are well suited for key value datastores.
- Ethereum's Patricia Merkle Tries are ***"hexary"*** (branching factor of 16).
- Putting it all together; Patricia Merkle Tries are *Hexary prefix hash trie*.

### Structure of MPT

- Trie node types:
  - Branch nodes: intermediate node which has 16 child nodes (hexary part of the trie).
  - Extension nodes: node that compresses some portion of the prefix "keyspace"
  - Leaf node: Data nodes where the data resides.
- The trie provides:
  - *succinct verification of state*
  - *allow for proofs of a subset of state*

#### Branch Nodes

Each branch node comprise of an array of size 16, hence hexary. It is used to help define the path through the trie.

#### Extension Nodes

Node that compresses the access path through the trie for relatively shorter depth of the trie. It collapses some portion of the prefix keyspace which no branches, and compresses the common prefix into a single node. It also reduces read and write amplification.

#### Leaf Nodes

The end of a path in the tree. It holds the actual data: account or storage slot value.

Leaf nodes are referenced by the hash of their value.

### Path traversal in MPT

The technique to path traversal is different for:

- Transaction & Receipts Trie: RLP encoding of the transaction index for the transactions in a block is used for path traversal. In simple words, they are located by rlp encoding the index of the transactions that are in a block that is now part of the chain. [Read more](https://flow.com/engineering-blogs/ethereum-merkle-patricia-trie-explained)
- Accounts State Trie: `keccak256(account_address)`, where `account_address` is a `20 Byte` hex-string and the result is a `32 Byte` hex-string that is used for the path traversal. In simple words, they are located in the trie path by the hash of their address key, rather than their address. [Read more](https://blog.sei.io/research-scaling-the-evm-from-first-principles-reimagining-the-storage-layer/#ethereum)

*This makes the trie more balanced and less prone to a depth-attack.* At its fullest, the state tree could have a depth of $64$. If the path key to leaf nodes are not hashed then an attacker could create accounts or storage slots one leaf apart, forcing a deep branch that Ethereum nodes must traverse during transactions. If hashed, then the tree is more balanced due to hash function and hence difficult to attack as difficult to predict.

- Read [Ethereum Data Structures review paper by Kamil Jezek](https://arxiv.org/pdf/2108.05513/1000) for more info.

### Anatomy of a Trie Hash Key

Elements are stored in the trie by hash of their key, trie keys are 32 bytes hashes i.e.

```python
# vitalik.eth
str addr = 0xd8da6bf26964b000000000000000000000000000
# hash of addr i.e. keccak256(addr)
str hash_key = 0x1e1424ab9612aff0e8fd41ee0d78f525ad6963610bd017d18f96d2a37cdf402a

# Remember in order to reach
# the account leaf node of vitalik's account,
# the PATH is the hash_key
```

**A branch node stores a nibble (4 bit) at a time**. As a nibble is 4 bit hence represents upto 16 values so it is called a *hexary trie*.

Like in the above example (vitalik.eth), the path traversal goes like, $$3→d→7→f→3→2→b…3 → a → 5$$

Also remember, the internal nodes might have a combination of two node types: *Branch Node* & *Extension Node*.

Branch node has an array map of size 17 for traversing through nibbles and last slot acts as a direct storage location for the value of a key that terminates exactly at that branching point.

Extension node has a key-value store that stores common prefix to reduce the depth.

Anything and Everything that is stored in all trie (State, Transaction and Receipts) is *RLP encoded*.

- Read [Merkle Patricia Trie - HackMD](https://hackmd.io/@0xdeveloperuche/H1BJhOHylx) to understand the rust implementations and nuances.

#### Merkle commitments

Merkle commitments are a bottom-top approach in order to generate them.

The process to generate the commitment of all the data stored at each layer, calculate the hash of it and store it in the parent node.

- In case of branch node being the parent, the array slot through which the path traversal happens, the hash of the children is stored there.
- In case of extension node, it is stored in the value part (key → value).
- In case of leaf node, it generates the hash of RLP encoded information stored.

>All the information is first converted into **RLP encoded string** and *then hashed*.

Resources to learn more about RLP:
 - [Interactive guide to RLP](https://entropy.to/encode/rlp)
 - [Data structure in Ethereum | Episode 1: Recursive Length Prefix (RLP) Encoding/Decoding](https://medium.com/coinmonks/data-structure-in-ethereum-episode-1-recursive-length-prefix-rlp-encoding-decoding-d1016832f919)
 - [Ethereum Under the Hood- Part 2 (RLP Encoding)-ver 0.3](https://medium.com/coinmonks/ethereum-under-the-hood-part-2-rlp-encoding-ver-0-3-c37a69781855)
 - [Ethereum Under The Hood Part 3 (RLP Decoding)](https://medium.com/coinmonks/ethereum-under-the-hood-part-3-rlp-decoding-df236dc13e58)
 - [GitHub - ethereum/pyrlp: The python RLP serialization library](https://github.com/ethereum/pyrlp)

Now, imagine going up, each node is considering the state of its children as its hashing based on the hash it received from its children.

Refer the below example for more clarity, ![merkle-commitment](/assets/lec-23/merkle-commitment.png)

In the above example, the hash of whole leaf node 1 is stored at location $0$ of the branch node and similarly for the leaf node 2 at location index $F$. Later, the hash of the branch node is calculated and is then stored at the location index $0$ of root node. By hashing with similar pattern like before, we get the root hash.

### Extension Nodes

Extension nodes compresses common **"unbranching"** portions of the prefix "keyspace" rather than branching on each nibble potentially evading the deep traversal depths (worst case 64 layers).

### Leaf Nodes
There are two instances of leaf nodes in the Trie based on account types:
1. Externally-Owned Account
2. Smart Contract

A smart contract will have another nested trie for the contract storage (maintains storage-slot).

Whereas, EOA have empty `codeHash` and `storageRoot`.

With EIP-7702, the usage of `codeHash` in case of an EOA is repurposed. Now, an EOA can  reference a smart contract instance to inherit its properties and powers it to do more. Its a first postive step towards account abstraction. Read more: [Overview – EIP-7702](https://eip7702.io/)

#### `codeHash`

Code hash is a distinct deterministic reference to the code deployed to the contract. The contract bytecode is stored in the client database where the $key ⇒ codeHash$ and $value ⇒ \text{runtime-bytecode}$.

>Remember if the same contract gets deployed again then it the smart contract references to same `codeHash` which was previously deployed.

#### `storageRoot`

Storage is again a merkle patiricia trie that stores the storage slots for different variables, mappings, etc. that are in contract. So, whatever changes happening in the contract eventually changes the storage root that changes the leaf node's hash and so on.

Storage slots are 256 bit unsigned integers for both key and value.

## State Transitions

For a simple eth transfer the change in the account balance reflects the change in state root via,

1. The account transfering ($A$) ETH hence its balance reduced. Whereas, $B$ that receives ETH has an increase in the balance. This is an atomic transfer event (either both happens or it didn't happen). This is called atomic composibility as well.
2. Now, all leaf nodes i.e. $A$ and $B$ are hashed and its value gets stored in its parent node and so on until it reachs its root node. Rememeber, the *hashing occurs at each level*.
3. Hence, the root node reflects the changes that occurred in $A$ and $B$, so it is a state commitment which once finalised will be irreversible.

### State transition implementation in Besu

In Besu, there are two ways to manage state:

1. Forest (legacy)
2. Bonsai

#### Forest

- A hash-bash merkle trie implementation.
- Nodes are stored and accessed via their hash.
- $(\text{hash-key, value})$ node pair
- Most straight forward implementation and commonly used by lots of clients with slight optimizations.

*Disadvantages*:

1️⃣ You have to read the database multiple times in order to reach the leaf node. It impacts performance significantly.

2️⃣ Another issue is key generation. Hashing is completely random but the keys in the database are sorted. So, we don't benefit much from the block-based caching systems.

3️⃣ Even a simple ETH transfer will affect a huge number will effect a lot of changes in the trie. In mainnet, blocks are more complex, have more state modifications, and the state is larger with more intermediate nodes. Hence, *each block adds a huge number of new entries to the database*. Due to this, the database is growing exponentially. Reading the state will be a lot slower with increased number of disk accesses required.

#### Bonsai

- A location-based merkle tree implementation.
- Nodes are stored and accessed by their location.
- Flat DB

- Read [Flat db healing - HackMD](https://hackmd.io/@kt2am/ryrH0APG6) to understand Flat DB more intuitively

In flat db, we don't traverse down the trie using the address hash. Instead, just store address hash as key and the account information as value. This means that now we store values based on location (address hash never changes).

There are new entries only when there are new accounts or branches are created.

So, now simple ETH transfers leads to only two entries (state changes in account A & B).

with Bonsai, we replace the tree nodes each time, so we don't maintain history; we only have the current state i.e. the head.

###### Trie Log Mechanism

In order to keep track of history, we use Trie log mechanism. For every new block, a new trie log is created. It is a diff between two blocks (just like git).

It is again a flat representation. Hence, all the leaves are modified are added to the trielog.

Some specifics about trielog mechanism:
- In order revert to old state version, applying the diff will do.
- Intermediate nodes are not stored in the trielog because they can be regenerated via references to the changes in the leaf nodes.

- A great article explaining bonsai tries: [A Guide To Bonsai Tries in 2023](https://consensys.io/blog/bonsai-tries-guide)

#### Questions: Part-1

*Ques.* How the Bonsai trie consolidated with Merkle Patricia Trie?

*Ans.* Bonsai trie gets implicitly pruned because at any given time, only version of the trie is on disk. And trielogs are used for maintaining the history. So, there is no much need to keep track of pruned nodes (like in forest or hash-based MPT) hence the word "implicit" pruning.

Bonsai trie really helps with handling reorgs. Trie logs are block witnesses (with pre and post image of states). Although not a cryptographic commitment, but it still kind of acts as a succinct witness to all the changes that happened in a block.

- Read [Ethereum’s state trie pruning](https://medium.com/codechain/ethereums-state-trie-pruning-45ea73ed2c78) and [State Tree Pruning | EF](https://blog.ethereum.org/2015/06/26/state-tree-pruning/) to understand pruning in concept.

## Client implementations and State Schemas

Different ways execution clients implement state:
- Hash based strategy
- Path based strategy
- Trie flattening strategy
- History track strategy

### Geth's state implementation

- Originally, used to use hash based state trie implementation
- In 2020, implemented snapshots but pruning was still a challenge
- In 2023, introduced path based implementation (bonus: implicit pruning). Now very similar to Besu's Bonsai.
- Snapshots are a fixed distance behind head (for snap-sync)

- Read [Geth: Snapshot | EF](https://blog.ethereum.org/2020/07/17/ask-about-geth-snapshot-acceleration), [Geth v1.10.0](https://blog.ethereum.org/2021/03/03/geth-v1-10-0)
- Read [Geth v1.13.0](https://blog.ethereum.org/2023/09/12/geth-v1-13-0), `--state.scheme path` introduced to benefit via implicit pruning.

### Nethermind's state implementation

- Uses ***Half path*** in production.
- In current phase of developing a new state scheme: ***Paprika***.

#### Half path

- It is an evolution of hash based model. There are multiple hash trees that exist on disk.
- The keys are prefixed with a portion of the path (8 byte).
- All the keys in the DB is sorted via section and path. Hence improves data locality.
- Sections categorize the key-values into 0, 1 and 2 in order to partition different data by type and size where:
  - **0**: if state and path length $<= 5$ (hot-access part of trie)
  - **1**: if state and path length $>5$ (relatively cold-access)
  - **2**: if storage
- With sections, it is easier to distinguish account types (EOAs or Smart contracts), ![nethermind-half-path](/assets/lec-23/nethermind-half-path.png)
- Common trie path is to ensure page-locality when traversing to a particular leaf. Distinguishing them based on section type helps do pruning effectively.
- Refer half-path implementation: [Link](https://github.com/NethermindEth/nethermind/pull/6331)

#### Paprika (in developement)

- It is Nethermind's version to path based model.
- It implements its own PageDB that is ethereum-aware.
- Paprika has a branching factor of 256 (instead of 16).
- Each page represent two nibbles of path.
- With two nibbles at each branch node, reduces the read and write amplification.
- For mainnet, depth of the full state tree is at max 5 and for contract storage, max depth is 7.
- Hence, it makes the tree more shallow.
- Being commitment agnositc, it correlates and naturally adapts to the transition to Verkle (forward-compatible).
- There are different types to pages to distinguish (like sections in half path):
  - *RootPage*: master metadata about state page organization.
  - *DataPage*: page which represents some segment of the state trie.
  - *AbandonedPage*: page which is available for pruning/reuse.
  - *PrefixPage subtype*: analogous to extension nodes in the trie, but for pages.
- Read [Paprika/docs/design.md](https://github.com/NethermindEth/Paprika/blob/main/docs/design.md) to dive deeper.

### Erigon State Implementation

- Archive friendly state schema. Helpful for RPC and block explorer orgs.
- Reth is inspired by Erigon. Both have almost similar state layout schemas.
- It is known for being a lightweight archive format.
- It maintains both *plain state* (unhashed pre-image) as well as *hashed state* (in order to calculate state root).
- Erigon/Reth are only client that stores the preimage of the hashed key so they are very appropriately positioned to be the source for preimages during Verkle transition. More on this: [State tree preimages file generation - Execution Layer Research - Ethereum Research](https://ethresear.ch/t/state-tree-preimages-file-generation/21651#p-52669-context-1)
- With Erigon V3, they integrate a feature to quickly import frozen states via bit-torrent. This helps quickly sync the node.
- Erigon State Schema at high level is: ![erigon-state-schema](/assets/lec-23/erigon.png)
  - Flat tables for account & storage. Both maintains both hashed and plain flat tables
  - *Block Level Change Sets* for both accounts and storage. Helpful to query historical changes that happened at Block level.
  - *Account Level History table* for accounts & storage.
  - *Intermediate nodes* are stored in a single versioned hash tree i.e. Trie of Accounts & Storage.
- Refer Erigon State Schema in [erigon repo](https://github.com/erigontech/erigon/blob/main/erigon-lib/kv/tables.go).

## Bonsai Archive

Until now the discussion about Bonsai was to retrieve information near Head (as it creatively keeps the track of that info). But now the notion is to use Bonsai for archive nodes as well.

For Bonsai archive, there has to be few modifications to the flatDB. Naturally, flatDB are just one key-value $(accountHash → Account)$. But in order to support archive, the modification is: $keccak256(accountHash+blockNumber)$, so that the data persists across history in the same flatDB.

So, when retrieving a state at block number that is not in the flatDB, we look for the nearest block before that do exist and then apply those state transitions in order to reach the desired block state.

### Using Checkpoints

With archive nodes, it is very important to verify and validate the data that we receive i.e. to check the state root at that instance.

But, it is difficult to calculate state roots as their has to be true source of validation as we just can't save the all of history.

***Solution***: *Generate checkpoints at certain intervals ($N$ block interval).*

Higher the value of $N$,

- reduces the size of the state stored
- lead to lower performance due to high cost of rollabck to find correct state.

Vice-versa for lower the value of $N$ i.e. size increases, better performance.

How to rollback to a certain checkpoint:

1. Get closest checkpoint
2. Rollback state until reach the desired checkpoint. *THANKS to Trielogs*.

Also, Besu with bonsai is the only path-based solutions that provides with historical proof of the merkle trees.

Geth is also working on a similar archive path-based solution due to its versitality.

>The Bonsai archive implementation is still a WIP, so the implementations details might change in future.


## Questions

*Ques.* What are the challenges and key blockers from transition from MPT to Verkle trees?
*Ans.* Bonsai implementation in structure is very similar to Verkle trees. Trielogs are synonymous to witnesses in Verkle.

The verkle implementation will also be using flat database for Besu.

The main challenges are with generating the vector commitments along with scheduling and resources problems.

In accordance to Verkle, Bonsai parellelization helps to perform certain precomputations in paralel for better performance.
