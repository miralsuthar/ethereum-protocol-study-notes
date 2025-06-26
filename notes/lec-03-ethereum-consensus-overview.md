# Lec-3: Ethereum Consensus Overview by Alex Stokes

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week3)

## Overview

This lecture provides an overview of:

- Significance of blockchains
- How to make *digital scarcity*?
- How to remove single trusted operator?
- Byzantine Fault Tolerance
- Advent of Bitcoin
- Bitcoin consensus
- Ethereum consensus: PoS

## Sections Timestamp


| Topic                                                                           | Time    |
| ------------------------------------------------------------------------------- | ------- |
| Introduction                                                                    | 4:37    |
| Significance of blockchains                                                     | 7:50    |
| How to make digital scarcity?                                                   | 10:41   |
| Byzantine Fault Tolerance                                                       | 22:36   |
| Question: What is the upper bound for PBFT?                                     | 29:20   |
| Advent of Bitcoin                                                               | 31:00   |
| Bitcoin Consensus                                                               | 32:42   |
| Ethereum Consensus                                                              | 48:30   |
| Question: Is there any specific purpose for choosing 32 ETH for staking?        | 54:04   |
| Question: Is there any upper bound to number of validators in Ethereum?         | 55:58   |
| Proof of Stake deep dive                                                        | 57:36   |
| Slots                                                                           | 1:08:05 |
| Epoch                                                                           | 1:16:03 |
| Committee                                                                       | 1:18:20 |
| RANDAO                                                                          | 1:19:55 |
| Question: Time concept in PoS?                                                  | 1:21:55 |
| Question: How RANDAO works?                                                     | 1:23:20 |
| Justification                                                                   | 1:30:19 |
| Finality                                                                        | 1:34:54 |
| Question: Role of Gasper in context to finality and finding the canonical chain | 1:37:55 |
| Question: Motivation behind PBS                                                 | 1:42:09 |
| END                                                                             | 1:52:08 |


## Table of contents

<!-- mtoc-start -->

* [Significance of blockchain](#significance-of-blockchain)
  * [Double spend](#double-spend)
  * [Digital scarcity](#digital-scarcity)
* [How to make an asset digital scarce?](#how-to-make-an-asset-digital-scarce)
* [Byzantine Fault Tolerance](#byzantine-fault-tolerance)
* [Bitcoin](#bitcoin)
* [Proof of Stake (PoS) Ethereum](#proof-of-stake-pos-ethereum)
  * [Proof of Stake Basics](#proof-of-stake-basics)
  * [Slots & Epochs](#slots--epochs)
  * [Justification & Finalization](#justification--finalization)
  * [Gasper (LMG-Ghost & Casper FFG)](#gasper-lmg-ghost--casper-ffg)
  * [Ethereum consensus roadmap](#ethereum-consensus-roadmap)
  * [Motivation behind ePBS](#motivation-behind-epbs)

<!-- mtoc-end -->

## Significance of blockchain

Why do we care about blockchains in the first place?
- Solve the problem of [double spend](https://en.wikipedia.org/wiki/Double-spending)
- Ability to generate *digital scarcity*

### Double spend

**Good money** is *verifiably scarce* where a unit of value can only be spent once. Double spend is the unauthorized production and spending of money.

**Blockchain** i.e. a decentralized system eradicates the prerequisite to trusted third parties. Many servers must store identical public transaction ledgers using *state machine replications* (to be discussed later).

Introducing consensus algorithms in blockchains, solves the problem of synchronization of the servers. Some examples are: Proof of Work, Proof of Stake.

Bitcoin was the first successful implementation of a distributed proof-of-work public ledger blockchain where miners required to build a block on top of the heaviest chain by solving a computationally difficult puzzle called mining. The difficult puzzle is to find a **partial hash collision**, i.e. find a *nonce* which converts a hash of block headers to a certain leading zeros based on the difficulty. And the only way to find such a nonce is through *brute force*.

The reason behind is, the *probability of finding leading zeroes* is a computationally intensive problem. `SHA256` is a unique hash function, and it is computationally infeasible to find a *full collision*. A slight change in the input, completely changes the digest hash. With this mechanism it was particularly difficult to *double spend*. A fellow miner has to have more than **51% of computation hash power** in order to take over the chain eventually by building a separate heavier chain faster than the canonical chain.

>In 2014, mining pool [GHash.io](https://en.wikipedia.org/wiki/GHash.io) obtained 51% hashing power in Bitcoin which raised significant controversies about the safety of the network. The pool voluntarily capped their hashing power at 39.99% and requested other pools to follow in order to restore trust in the network.

### Digital scarcity

>The scarcity comes from the *inherent or imposed limitations* on the **availability**, **access**, or **creation** of digital resources, assets, or information, relative to the *demand* for them."

- The key strength of bitcoin is the total computational hash power it has garnered over the years. This is what makes it **scarce**.
- A new block is relatively less scarce as Bitcoin follows probablistic finality, which means, the probability of a block reaching finality increases with number of blocks getting added on top of it. Hence, older the block, higher the chance of it being the part of the canonical chain.
- Similarly, different blockchains have different economical strategies to make their digital asset look scarce hence valuable from an economic standpoint.

>Blockchains and decentralized autonomous ledgers creates value by enabling ***provable scarcity***.

## How to make an asset digital scarce?

- The ability to make a digital entity scarce leads to emulation of money, tokens, property rights, etc. *digitally*.
- **Scarcity** means: *there exists only N coins at a time, hence a user can't spend more than the amount they have.*
- **Trust** is a critical requirement for digital scarcity. The *huge bottleneck* is when trust is towards a single operator saying: **TRUST ME!!**
- Scarcity means *incentive to attack!*
- Solution: Don't have a single trusted operator, but *distribute the trust among multiple operators*, hence **make a digital system without a single “leader”**.
- Hence, distributed computation across many nodes hosted by peers all around the world is a solution.

## Byzantine Fault Tolerance

- How do these peers manage consensus? Via **[state machine replication](https://en.wikipedia.org/wiki/State_machine_replication)**.
- As no. of nodes *increases*, the system becomes *harder to attack*.
- More nodes more secure, so N should be very high (assume everybody on the internet).
- But even in distributed setting, things can go awry
	- missed messages
	- bugs in implementation
	- hardware failure
	- active attacks
- All these above problems faced by a node could be described as **Byzantine Fault**.
- The purpose of distributed nodes is to be tolerant of *Byzantine faults*, so that the overall system remains safe and secured.
- BFT aims to solve the [Byzantine General's Problem](https://lamport.azurewebsites.net/pubs/byz.pdf). Here's an article explaining it in simpler terms: [article 1](https://medium.com/@ayogun/byzantine-generals-problem-a47b33ef87fc) & [article 2](https://www.baeldung.com/cs/distributed-systems-the-byzantine-generals-problem)
- So how do nodes come to consensus even some nodes are corrupted? Answer: **[Two Phase Commit](https://en.wikipedia.org/wiki/Two-phase_commit_protocol)**.
- Practical Byzantine Fault Tolerance is a practical application of BFT. (research more)
- Message passing in PBFT is $N^2$. So, as the node count increases, the message passing increases exponentially. Hence, the system reaches consensus delays. More nodes, more messages, more overhead, more delay.

## Bitcoin
- Satoshi solves Byzantine General's Problem with ***Bitcoin***.
- Bitcoin implements *PoW* with the combination of heaviest chain approach.
- **Nakamoto Consensus i.e. Heaviest Chain Approach**: Chain with the ***highest** computation hash power (total difficulty)* is **canonical**. The miner gets *rewarded* to add a correct block apparently in less time with more computation (difficulty increases as competition to mint increases).

## Proof of Stake (PoS) Ethereum

- Ethereum uses a Proof-of-Stake (previously PoW until September 2022) mechanism to incentivize the peers (stakers) to keep the chain consistent and secure at all times.
- Ethereum uses *endogenous signal* (stake) rather than *exogenous signal* (energy) for Sybil protection.
- With proof of stake,
	- even *penalties* can exist, not just *rewards*
	- reduce *attack surface*
- PoS Ethereum is an implementation of a traditional BFT style consensus protocols.
- BFT majority i.e. 67% is required to determine unique state of the chain.
- Byzantine faults can be monitored by the protocol and the bad actors can be slashed.
- Less resource intensive, more secure!

### Proof of Stake Basics

- A validator validates if the chain is secured and in its true state of consensus.
- There exists a deposit contract on Ethereum, where the validator who wants to participate in the consensus can stake their 32 ETH.
- What is an Attestation? *It is state of the chain at slot `S`.*
- To simplify, each validator gets to *attest* (a.k.a. sign a cryptographic signature) *every epoch* (i.e. 32 slots).
- More attestations for a given block gets attached to the canonical chain.

### Slots & Epochs

- A slot takes *12 seconds*, hence an epoch completes every *6 minutes 24 seconds*.
- A slot is the smallest unit of time in Ethereum PoS. It is the **heartbeat** of the protocol. A validator is required to *add a block every slot* (i.e. 12 seconds).
- A slot might be **empty**, if the *proposer is not able to submit a block in given threshold.*
- 1 proposer per slot who appends a new valid block, gets relatively higher rewards (in comparison to attestors).
- Once every epoch concludes, i.e. after every 32 slots, along with the normal processing, the information regarding the *penalties, rewards, and withdrawals* are also to be shared in order to update the consensus state at the end of this boundary of an epoch.
- Every epoch, validators are *randomly shuffled* into **32 committees** and *allotted a slot number to attest to*.
- Validator adds local randomness along with the block (while proposing). These 32 random numbers when mixed makes a `RANDAO` which helps in shuffling of the validators into committees for the next epoch.
- Why 12 seconds for a slot? Answer: Inspired by PoW block time which was approx. 14 second. Smaller slot times makes it harder to follow the chain. Some people are suggesting to shorten the slot times while some are suggesting to lengthen the same for the upcoming future upgrades.
- How RANDAO works? Answer: Every proposer adds a pseudo random value `R` (i.e. a signature) which adds up on the previous random value added by the former. (Read more about this)
- *Every slot has a block, block have attestations, and attestations confirms the notion of finality.*
- The first block in an epoch is the representative of that epoch.
- Primarily, attestors attest a block proposed.  Apparently, they are attesting to the starting block of the epoch.
- So, there is a cryptographical linkage via the parent. Hence, all the validators of the protocol apparently have attested to the starting block of the epoch.
- With this, a link can be generated among epochs.

### Justification & Finalization

- ***Justification*** (BFT concept) is **atleast 2/3** validators must attest a given block.
- Justification chains from validators attesting a given block to attesting indirect relation among epochs.
- If attestors justify a justified block, i.e. there exist a block A, B and C, where,
$A \text{(finalized)} ← B \text{(justify)} ← C (attest)$.
- So if block C gets attested by more than 2/3 validators then, block B gets justified hence A gets finalized.
- This is the ***notion of finality***.
- Also, attesting a conflicting chain is a slashable offence.

### Gasper (LMG-Ghost & Casper FFG)

- Gasper is combined fork-choice algorithm for Ethereum PoS protocol. There are two layers of progression:
	1. Epoch Level View (Casper FFG)
	2. Slot level view (LMD GHOST)
- Ethereum has a feature of *dynamic availability*. The essence is that the proposer can propose the head of the chain in its perspective and attestors attest in theirs. Hence, as the slots progress per epoch and validators of that specific committee attests for their respective previous slots. (More on this in future lectures)

### Ethereum consensus roadmap

- Single Slot Finality (SSF).
- Single Secret Leader Election (SSLE)
- MAX EB (accomplished in Pectra)
- Enshrined Proposer Builder Separation (ePBS) (enroute in Glamsterdam)

### Motivation behind ePBS

- Currently, proposer use builders to make sophisticated blocks (i.e. ordering of transactions) where they attempt to maximally extract value in order to make more money.
- PBS kind of solve this. With PBS, the EL gets separated from CL, hence the payload coming from EL to CL is coming from another entity i.e. builder and proposer attaches the execution payload to the beacon block and proposes it and makes profit but not centralize the system.

