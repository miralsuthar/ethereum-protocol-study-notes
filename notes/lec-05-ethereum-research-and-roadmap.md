# Lec-5: Ethereum Research and Roadmap by Domothy

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week5)

## Overview

This lectures is all about the future of Ethereum. The major focus is around:

- Introduction
- The Merge (PoS)
- The Surge (Data Availability for Rollups)
- The Scourge (MEV and Staking Economics)
- The Verge (Verkle Trees and Statelessness)
- The Splurge (Miscellaneous Goodies)
- The Purge (Protocol Simplification)
- Future (Quantum Proofing, ZK EVM opcode/precompile, Scalable L1 Execution using ZK proofs)

## Sections Timestamp


| Topic                          | Time    |
| ------------------------------ | ------- |
| Introduction                   | 5:09    |
| Merge                          | 7:33    |
| Sync Committee                 | 9:04    |
| Secret Leader Election         | 10:25   |
| Single Slot Finality           | 12:30   |
| Quantum resistant Beacon Chain | 15:58   |
| Surge                          | 18:52   |
| Data Availability Sampling     | 24:18   |
| Polynomial Commitment Scheme   | 26:30   |
| EIP 4844 and Data Availability | 31:15   |
| Future                         | 34:00   |
| The Scourge: PBS               | 37:00   |
| Execution Tickets              | 41:20   |
| App-layer MEV minimization     | 42:55   |
| Preconfirmations               | 43:32   |
| Staking Economics              | 44:10   |
| Verge: Verkle Tree             | 49:08   |
| Snarkify everything            | 59:33   |
| zkEVM precompile               | 1:01:53 |
| The Purge: History Expiry      | 1:03:19 |
| Splurge: EOF                   | 1:08:30 |
| Account Abstraction            | 1:09:44 |
| Endgame EIP-1559               | 1:12:30 |
| Deep Cryptography              | 1:16:50 |
| Questions                      | 1:19:59 |
| End                            | 1:30:31 |


## Table of contents

<!-- mtoc-start -->

* [The Merge](#the-merge)
  * [Already merged](#already-merged)
  * [Future of the Merge](#future-of-the-merge)
* [The Surge](#the-surge)
  * [Basic Rollup Scaling (with training wheels)](#basic-rollup-scaling-with-training-wheels)
  * [Data Availability Sampling (DAS)](#data-availability-sampling-das)
    * [Polynomial commitment schemes](#polynomial-commitment-schemes)
  * [First Step to DAS - EIP 4844: Protodank-sharding](#first-step-to-das---eip-4844-protodank-sharding)
  * [Future for the Surge](#future-for-the-surge)
    * [Further steps for Full DAS](#further-steps-for-full-das)
    * [Quantum Resistance](#quantum-resistance)
    * [Cross-Rollup Interoperability](#cross-rollup-interoperability)
* [The Scourge (to reduce MEV downsides)](#the-scourge-to-reduce-mev-downsides)
  * [Enshrined Proposer-Builder Separation (ePBS)](#enshrined-proposer-builder-separation-epbs)
  * [Execution Tickets](#execution-tickets)
  * [App-layer MEV minimization](#app-layer-mev-minimization)
  * [Preconfirmations](#preconfirmations)
  * [Staking Economics](#staking-economics)
  * [Explore total stake capping](#explore-total-stake-capping)
  * [Liquid Staking Centralization](#liquid-staking-centralization)
* [The Verge (Easier Verification)](#the-verge-easier-verification)
  * [Verkle Trees](#verkle-trees)
  * [Snarkify the rest](#snarkify-the-rest)
  * [zkEVM opcode/precompile](#zkevm-opcodeprecompile)
* [The Purge (Simpler protocol)](#the-purge-simpler-protocol)
  * [History Expiry (EIP-4444)](#history-expiry-eip-4444)
  * [State Expiry](#state-expiry)
  * [Various Harmonizations](#various-harmonizations)
* [The Splurge (Miscellaneous goodies)](#the-splurge-miscellaneous-goodies)
  * [EVM Object Format (EOF)](#evm-object-format-eof)
  * [Account Abstraction](#account-abstraction)
  * [Endgame EIP 1559](#endgame-eip-1559)
  * [Deep Crypto](#deep-crypto)
  * [Encrypted mempools](#encrypted-mempools)
  * [Verifiable Delay Functions (VDFs)](#verifiable-delay-functions-vdfs)
* [Questions](#questions)

<!-- mtoc-end -->

## The Merge

The main goal of Merge was the transition of Ethereum from PoW → PoS. It came to fruition at 15 Sept, 2022. Although, with the successful transition to PoS, there are few things left unfinished w.r.t. the efficiency of PoS mechanism.

### Already merged

Already rolled out features of **the Merge**
- The beacon chain intially launched in 1 Dec, 2020. The goal was to test and monitor the mainnet beacon chain in isolation. The beacon chain task is to achieve consensus as per rules with only one ammend that the execution payload was empty until Merge hardfork.
- Altair hardfork happened. Introduced penalties and sync committees (in order to accommodate light clients).
- The most await hardfork: Merge happened at 15 Sept, 2022. Once, Bellatrix was activated i.e. 31 August. And on certain TTD, the Paris upgrade happened. More on this: [Overview of Merge upgrade](https://www.galaxy.com/insights/research/overview-ethereums-merge-upgrade-associated-risks)
### Future of the Merge

- **Secret Leader Election** ([EIP-7441](https://eips.ethereum.org/EIPS/eip-7441), Low Priority 🔻): Currently, a leader or proposer is *revealed ahead of time* to the public. With this revealed information, attacker can perform Denial of Service attacks on the proposer, hence delaying the additions of blocks, which leads to empty slots eventually (not able to submit a block before deadline). It is a low priority endeavour unless *these type of attacks start to happen often*.
- **Single Slot Finality**: As of now, finality takes around 12.6 minutes (*~2 epochs*). The goal with this feature is to reduce it to 12 seconds i.e. finality occurs the same block as the block is submitted. Cosmos is one of the prime example that inherits SSF through Tendermint BFT consensus. The possible solution paths forward are:
  - Fewer validators (MaxEB: EIP 7251)
  - Fewer active validators
  - Way fewer validators ($8192$ or $2^{13}$ no. of validators) + Distributed Validators Tech (DVT)
  - Better signature aggregation schemes.
- **Quantum-proof Beacon Chain**: Current ECDSA (ETH 1) and BLS (ETH 2) are not quantum resistent. Hence there is a need for the solution with ***Stark aggregation*** (signature). For more information, read [Stark Aggregation](https://hackmd.io/@vbuterin/stark_aggregation)

>***Note***: Vitalik has proposed **Stark aggregation** because **Starks**, for those who don't know, are succinct **zero-knowledge proofs** that rely entirely on hashes. *Quantum computers can't mess with hashes*. If you aggregate things with these proofs, someone signed, we can have a quantum-proof Beacon chain.

## The Surge

The Surge is all about scaling L2s and in order to scale them, we need data availability. This roadmap plays a vital role in the Ethereum's rollup centric roadmap.

- Scaling L1 execution is hard.
- Safely scaling L1 data is easier.
- Rollups convert L1 data into L2 execution (with 1-of-N trust assumption!)
- All rollup data must be available on L1 at all times in order to force L2 txn inclusion.

### Basic Rollup Scaling (with training wheels)

- There is still a lot of risks involved on rollups today. Most of the features for an ideal rollup are still far fetched for the majority.
- There are various reasons behind it.
- It is not easy to build an ideal rollup at present due to a lot of shortcomings of L1 itself and some are the part of active research.
- [L2 Beat](https://l2beat.com) covers the full lifecycle of a rollup from its advent to its journey of becoming a Stage 2 rollup, i.e. completing the journey of becoming an independent rollup which does not any training wheels to run.
- The 3 basic requirements for an ideal rollup are:
  - Upgradability / mutability
  - Multisig / governance
  - Permissioned elements
- [L2Beat: L2 Recategorization update](https://x.com/l2beat/status/1935615549809054043): With this new recent update to the changes in the standards by L2Beat which increases the barrier for L2s to be qualified for a rollup or validium. Now, Stage 2 is a prerequisite than an achievement.
- Like Vitalik said in this [article](https://vitalik.eth.limo/general/2024/03/28/blobs.html) (read *Continue improving security*), there has to be stricter standards in order to maintain the security standards. L2s have excel at these standards, participation won't cut it.

### Data Availability Sampling (DAS)

- Downloading all the data in clients effectively make the data available throughout, but is *not a generous approach towards scaling*.
- Sampling the same data by *distributing it throughout the peers* hence reducing the overhead to download everything.
- The tl;dr of the concept is:
  - convert the data into a polynomial equation,
  - extend it by evaluating the equation at more points, i.e. erasure encoding.
  - Then, use a polynomial commitment scheme.
  - With this, you can now do random sampling.
- Example: data (1, 3, 2, 2) is extended into a cubic equation. Evaluating it at four more points gives (7, 21, 48, 92). With these eight points, any four suffice to reconstruct the original polynomial and recover the original data (1, 3, 2, 2).
- *This reveals a key insight: 50% of the extended data is enough to recover 100% of the original data.*

#### Polynomial commitment schemes

In practice, $P(x)$ has thousands of coefficients.

$C = commit(P)$

![polynomial-commitment-schemes](/assets/lec-5/polynomial-commitment-schemes.png)

where `C` is a few bytes (like a hash) known to all nodes.
- Ask for random data point
- Receive a value along with proof π
- Verify π against `C`, is satisfied that `P(3) = 2`.
- At most 50% odss of *being fooled*.
- Now, repeat the process of asking another random data point, hence reducing the chance by *(1/2)<sup>30</sup>* where the no. of samples = 30.
- This reduces the parameter of *being fooled to **~1 in a billion***.
- *This demonstrates the efficiency of data availability sampling: 30 samples are sufficient to verify data availability without downloading the entire dataset.*
- Note: These 30 samples are *independent of the data-size*.

More on polynomial commitment schemes: [KZG polynomial commitments](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html) and [workshop](https://youtu.be/uGeIDNEwHjs?t=725).

For in-depth understanding of polynomial commitments, go through 3 part series on the same by Justin Drake:
- [ZK Study Club: Part1 Polynomial Commitments with Justin Drakes - YouTube](https://www.youtube.com/watch?v=bz16BURH_u8)
- [ZkStudyClub: Part 2 Polynomial Commitments with Justin Drake - YouTube](https://www.youtube.com/watch?v=BfV7HBHXfC0)
- [ZkStudyClub: Part 3 Polynomial Commitments with Justin Drake - YouTube](https://www.youtube.com/watch?v=TbNauD5wgXM)

### First Step to DAS - EIP 4844: Protodank-sharding

- Introduced to Ethereum mainnet in Dencun (Deneb-Cancun) hardfork in March 2024.
- First checkpoint towards Full 2D DAS.
- Nothing fancy yet, every node download all blobs (128 kb) which costs:

$$\text{1 wei per blob gas} * 2^{17}\text{ blob gas} = 0.000131\text{ gwei per blob}$$

- Conservative initial values: Target of 3 Blobs, will increase to 6 with maximum 6 to maximum 9 in Pectra.
- Sets the stage for DAS (using KZG commitment scheme).
- The *blob fee is burnt*. Hence, ~5 gwei is burnt by rollups.

### Future for the Surge

#### Further steps for Full DAS
- With PeerDAS (scheduled for Fusaka), the aim is to introduce 1D-DAS.
- This wil help store blobs efficiently among the nodes and scale them in future hardforks. And, with addition of Blob Parameters only (BPO) hardforks (EIP-7892), it will be rather easier to scale blobs.
- And in long term, the aim is to enhance the capibility of the sampling from 1D → 2D.

#### Quantum Resistance

- KZG drawbacks requires trusted setup hence the problem of 1-of-N, hence are not quanum proof.
- Eventually hot-swap KZG for something based on *STARKs or Lattices*.

#### Cross-Rollup Interoperability

- Establish standards between rollups
- Based rollups, preconfirmations, shared sequencing

## The Scourge (to reduce MEV downsides)

The Scourge is still an area of active research as MEV has a vital impact on the economics of Ethereum. MEV will exist forever in a blockchainlike Ethereum. Hence, the main aim is to not censor MEV extraction but enshrine it to reduce its impacts and mitigate via isolation of responsibilities.

##### Enshrined Proposer-Builder Separation (ePBS)

- MEV is inevitable, untamed MEV markets hurt solo stakers.
- **Goal**: Minimize the choices validators have to make (reduce incentivization to specialize).
- **Solution**: Introduce *Builders*, who specialize in MEV extraction & optimization.
- Various proposers use ***MEV-BOOST*** in order to build to get maximum profits when they get to propose a block. This ensures that they make hefty share of profits through MEV. For more information: read [MEV-Boost in a Nutshell](https://boost.flashbots.net/)
- The major reason behind current exploitation is: **Relayers** (trusted brokers).
- **Enshrined PBS (ePBS)** *removes* relays, allow MEV burning to smooth the staking yield.
- **Inclusion lists** enables solo-stakers to force builders to include specific transactions, reducing censorship. refer:
- Refer [Endgame](https://vitalik.eth.limo/general/2021/12/06/endgame.html) to get more information about Vitalik's thoughts on future of block production.

### Execution Tickets

- A relatively recent idea from Justin Drake, offer an elegant solution to *MEV* and *distorted yield* for solo stakers.
- It involves ***selling the right to propose a block ahead of time***, similar to a *lottery*.
- This separates attesting to a block's inclusion in the chain from proposing a block.
- It keeps the MEV lottery permissionless, a feature solo stakers appreciate, while mitigating the negative incentives of spiky MEV.
- For more information : [Execution Tickets - Proof-of-Stake / Economics - Ethereum Research](https://ethresear.ch/t/execution-tickets/17944)
### App-layer MEV minimization

 Lesser concern of core protocol, but important from the pov of smart contracts and dapp developers. Techniques used by CoW Swap to prevent sandwiching.

### Preconfirmations

- Receive next-block inclusion guarantee from builder
- Pairs well with execution tickets and restaking schemes.

### Staking Economics

Raise max effective balance (EIP 7251: Increase MaxEB), (*gets added in Pectra*)

### Explore total stake capping

Changing issuance curve (possibly negative) for increased amount of staked ETH. A bit confusing topic, so refer [Vitalik's blog on the Scourge](https://vitalik.eth.limo/general/2024/10/20/futures3.html#fixing-staking-economics).

### Liquid Staking Centralization

- The idea is to enshrine liquid staking tokens directly into the protocol.
- Hence, creating a zero fee Liquid Staking Token (LST).
- Active research to think of ideas that could save liquid stakers from slashing penalties with bonds.

## The Verge (Easier Verification)

The Verge roadmap is all about Verkle Trees and snarkifying Ethereum. With these integrations, verifying things

### Verkle Trees

- The next big thing in the journey of Ethereum and to be introduced in **Glamsterdam** (Gloas-Amsterdam).
- The concept of state vesus history is straightforward; a blockchain has current block `n`, referencing block `n-1`, and so on.
- Past blocks are history, showing transactions.
- Computing these transactions yields the current state.
- Currently sycing the chain requires syncing history, computing the state, and then validating transactions.
- But with Verkle trees, every node is a polynomial commitment over its children.
- With verkle trees, we only need *the path, intermediary nodes, and a polynomial proof*. These polynomial proofs which then *can be merged with batch opening with **polynomial commitments***.
- Verkle trees enables **statelessness validators** in the blockchain.
- This makes vertical proofs shorter, allowing wider trees.
- *Light clients will be more reliant as they only need to query the light client protocol and verkle proofs to check balances.* This leads to **instant sync** and reduces the *burden of storing the entire state*.
- Light clients become *lighter*, *only needs* **Sync Committee** and **Verkle Proofs**.
- Increase the no. of children from 16 (in merkle tree) to **256**.
- Developers currently rely on centralized indexers like The Graph, Infura, Alchemy to fetch blockchain information. But with enhanced light clients, there will be no need.
- With statelessness, even cheaper L1 fees.
- For more information: [Verkle Trees for Statelessness](https://verkle.info/)

### Snarkify the rest
- *Enhance light client protocol* by making them even lighter along with verkle trees with **ZKP validating sync committee transitions**.
- With *ZK-Snark validating all Beacon Chain transitions* i.e. signatures, balance changes, etc., would render the light client protocol obsolete.
- Using ZK-Snark to generate Verkle State access proofs making it faster to verify block witnesses.
- Eventually enshrine all EVM execution with a SNARK proof. Potential endgame for ZK-EVM.

### zkEVM opcode/precompile

Verify EVM execution proof inside the EVM (or inside an EVM execution proof).

## The Purge (Simpler protocol)

With Purge, the aim is to introduce history & state expiry, some of the most complex tasks to execute.

### History Expiry (EIP-4444)

- autoprune history older than 1 year
- The basic idea behind it is: *older the block (finalized obviously), higher are the chances that nodes will definitely agree if the same block is part of the canonical chain*.
- No disagreements on history, especially finalized blocks.
- Simplifies client codebases (no need to support earlier forks)
- Alleviate node storage requirements
- History must reliably be accessible by other means (Portal network, torrents, block explorers, etc.)
- More information about [Portal network](https://ethportal.net/).

### State Expiry

- Very low priority as of now
- Dependency on PBS and statelessness
- Requires many breaking changes (e.g. address length)

### Various Harmonizations

- Serialization: as of now, RLP (execution layer) and SSZ (consensus layer), both are used in Ethereum protocol. But the final shift would be towards SSZ completely.
- Slowly phase out old transaction type i.e. Pre-EIP1559 legacy type.

## The Splurge (Miscellaneous goodies)

### EVM Object Format (EOF)

- Series of EIPs to restructure aspects of EVM, makes future upgrades easier.
- For more information: [Everything about the EVM Object Format (EOF) - HackMD](https://notes.ethereum.org/@ipsilon/evm-object-format-overview)

### Account Abstraction

- UX around EOA is bad, so improve it and make it seamless.
- EIP-3074 to delegate control of EOAs to smart contract
- ERC-4337 for smart wallet standards across EVM chains/rollups (potential eventual enshrinement)
- For more information, read [Ethereum wallets today and tomorrow — EIP-3074 vs ERC-4337](https://readmedium.com/en/https:/medium.com/nethermind-eth/ethereum-wallets-today-and-tomorrow-eip-3074-vs-erc-4337-a7732b81efc8)

### Endgame EIP 1559

- The goal of gas fee should work like an **AMM curve**.
- Track access gas instead of previous block's gas usage.
- Another benefit of an AMM curve type gas tracker might help lead to higher censorship cost (entire fee vs just priority fee)
- **Multidimensional EIP-1559**: like gas vs blobs today, but for more resources: call data, state reads/writes, block size, witnesses, etc.
- More efficient pricing
- **Time-aware base fee calculation (EIP-4396)**: avoid treating missed slots as sudden spike in demand. If a slot miss occurs then in the next block, the demand doubles from protocol's perspective, but in reality, it's a supply shortage. So, there has to be time inclusion in base-fee calculation to overcome this issue.

### Deep Crypto

FHE, One-shot signatures are an active area of research in the field of cryptography.
As new revelations happen, Ethereum will also participate in the research to consider if it is beneficial for the protocol.

One-shot signature is a great value addition. With it, you can have signatures that destroy themselves after signing a message. With quantum computers (far future), there will be no need for slashing.

### Encrypted mempools

Toxic MEV disappears completely. Non-toxic MEV (arbitrage and liquidation) would still exists.

### Verifiable Delay Functions (VDFs)

>"Non-parallelizable proof of work"
- Slow computation in one direction, fast verification after the fact
- would enhance beacon chain randomness (not yet full random)
- Again a great value addition.

## Questions

*Ques)* What is the highest priority topic on the roadmap according to you?
*Ans)* Verkle tree and increase in the blob space would really help move forward and should be implemented in the next hard-fork.

*Ques)* Which topic still need a lot of research or figuring out?
*Ans)* ePBS has a lot of tradeoffs. It is a very typical problem to solve especially keeping various concepts in mind. For example, Inclusion lists with stateless validators don't mesh well. That's another area of active research. The main point to fear is if the core-devs decide to settle for the least bad design because PBS is a super cool concept.

*Ques)* Which one single feature that simplifies all the complexity that resides in ethereum currently?
*Ans)* All the features introduced in Ethereum roadmap are all well thought through and carefully meddled. I'd be surprised if something comes up that solves everything in a much simpler way, but welcome it for sure.

*Ques)* What time till ossification?
*Ans)* The roadmap itself is mostly oifiable
at this point. There's general agreement that we'll do **Verkle trees**, even though it's super complex and risky in terms of transitioning. It's something we know we have to do. In 10-15 years, when all this is done, it will be much harder to propose changes on the same level of risk as the stuff we're about to undertake.

There's always a possibility that something happens and things might change, but there has to be a good reason. I'd rather see that door stay open a bit, even though it's an uphill battle that's becoming harder at each forge. *Ossification is the process of hardening the protocol, making upgrades more challenging.*

