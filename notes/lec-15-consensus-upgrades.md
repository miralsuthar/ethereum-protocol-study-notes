# Lec-15: Consensus Upgrades by Francesco D'Amato

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week10-research)

## Overview

This lecture focuses on the consensus mechanism of Eth-2.0 a.k.a beacon-chain. The overview includes:

- Introduction
- Gasper recap
- Sync Lifecycle
- Problems of LMD-GHOST (ex-ante reorgs)
- Balancing attacks
- View-Merge
- RLMD-GHOST
- Single Slot Finality
- $(Block, slot)$ Fork-choice
- Applications of $(Block, slot)$ fork-choice
- ePBS fork-choice
- PeerDAS fork-choice

## Sections Timestamp

| Topic                                           | Time    |
| ----------------------------------------------- | ------- |
| Introduction                                    | 8:00    |
| Gasper recap (LMD-GHOST)                        | 11:00   |
| Casper FFG                                      | 16:05   |
| Sync lifecycle                                  | 17:56   |
| Problems of LMD-GHOST: Ex-ante reorgs           | 22:18   |
| Balancing attacks                               | 27:48   |
| View-Merge                                      | 28:43   |
| RLMD-GHOST                                      | 35:05   |
| Single Slot Finality Protocol                   | 39:55   |
| Questions                                       | 56:00   |
| Fork-choice in the Ethereum Roadmap             | 1:00:38 |
| $(Block, slot)$ fork-choice                     | 1:02:13 |
| Applications of $(Block, slot)$ fork-choice     | 1:06:20 |
| Issue with $(Block, slot)$ fork-choice          | 1:09:40 |
| ePBS fork-choice: Two-slot ePBS                 | 1:11:46 |
| One-slot ePBS (with PTC)                        | 1:14:40 |
| RLMD-GHOST with ePBS                            | 1:16:10 |
| PeerDAS fork-choice: Data Availability Sampling | 1:17:26 |
| Questions                                       | 1:26:36 |


## Table of contents

<!-- mtoc-start -->

* [Gasper Recap](#gasper-recap)
  * [LMD-GHOST as a Protocol](#lmd-ghost-as-a-protocol)
  * [Casper-FFG](#casper-ffg)
* [Ethereum Today](#ethereum-today)
* [Sync lifecycle](#sync-lifecycle)
* [Problems of LMD-GHOST](#problems-of-lmd-ghost)
  * [Simple ex-ante reorg](#simple-ex-ante-reorg)
    * [Attack procedure](#attack-procedure)
    * [Solution: ***Proposer boost***](#solution-proposer-boost)
      * [<u>Attack vector no. 1 in proposer boost</u>](#uattack-vector-no-1-in-proposer-boostu)
      * [<u>Attack vector no. 2 in proposer boost</u>](#uattack-vector-no-2-in-proposer-boostu)
  * [Balancing Attacks](#balancing-attacks)
  * [Resources](#resources)
* [Designing theoretically secure available chain](#designing-theoretically-secure-available-chain)
  * [Improving proposer boost with ***View-Merge***](#improving-proposer-boost-with-view-merge)
  * [RLMD-GHOST: A potential consensus mechanism upgrade](#rlmd-ghost-a-potential-consensus-mechanism-upgrade)
* [SSF Protocol](#ssf-protocol)
  * [Add ***fast confirmation rule*** to RLMD-GHOST](#add-fast-confirmation-rule-to-rlmd-ghost)
  * [Security Guarantees](#security-guarantees)
  * [Introducing CASPER-FFG for finality in SSF protocol](#introducing-casper-ffg-for-finality-in-ssf-protocol)
* [3SF: A chained 3-slot-finality protocol](#3sf-a-chained-3-slot-finality-protocol)
* [Questions](#questions)
* [Fork-choice in the Ethereum Roadmap](#fork-choice-in-the-ethereum-roadmap)
  * [(Block, Slot) Fork-Choice: Enshrining empty slots](#block-slot-fork-choice-enshrining-empty-slots)
  * [Applications of $(Block, Slot)$ fork-choice](#applications-of-block-slot-fork-choice)
  * [Issue with $(Block, Slot)$ fork-choice](#issue-with-block-slot-fork-choice)
  * [ePBS fork-choice](#epbs-fork-choice)
    * [Two-slot ePBS](#two-slot-epbs)
      * [Ex-ante reorgs, ePBS version](#ex-ante-reorgs-epbs-version)
    * [One-slot ePBS with PTC (Payload Timeliness Committee)](#one-slot-epbs-with-ptc-payload-timeliness-committee)
    * [RLMD-GHOST with ePBS](#rlmd-ghost-with-epbs)
  * [PeerDAS Fork-choice](#peerdas-fork-choice)
    * [Fork-choice Implications](#fork-choice-implications)

<!-- mtoc-end -->

## Gasper Recap

$$\text{Gasper} = \text{LMD-GHOST} + \text{Casper-FFG}$$

***GHOST*** stands for *"Greedy Heaviest Observed Subtree"*. A fork choice algorithm that allows a validator to find the head of the chain for a given block tree, to maintain the canonical chain in case of forks.

There are two parts to the algorithm:
1. Greedy part
2. Heaviest part

*1️⃣ Greedy part* is a validator have to make a **choice whenever required**. The goal is to propagate forward.

*2️⃣ Heaviest part* is once you have made a choice at a fork, the *mandatory clause* is to  choose the ***heaviest subtree***.

![GHOST](/assets/lec-15/PoS-ghost.png)

In the above image, the reason behind selecting the green *(a forked block tree)* rather than red *(longest chain)* is that the red one could be an adversarial chain. The red one, although long but still isn't heavier (in terms of blocks) than the green.

>Green (the last chain with three green blocks) although shorter than the red has more blocks attached to it at the fork choice hence is the canonical chain.

In PoS, **votes/attestation** and **stakes** acts as *weight to decide the validity of a block.*

Whereas, in PoW, the weight to decide the validity of a block was **difficulty**.

![LMD-GHOST](/assets/lec-15/PoS-lmdghost.png)

Clouds above each block represents **attestations**.

>LMD-GHOST is an *attestation-driven* where only **most recent vote** are considered for a validator.

### LMD-GHOST as a Protocol

![LMD-GHOST Protocol](/assets/lec-15/PoS-lmdghost-protocol.png)

The lifecycle of LMD-GHOST as a protocol in a nutshell is,
1. *Propose (by proposer)*
2. *Head vote (by other validators)*
3. *Repeat*

In simple terms,

> **Block is proposed, people vote on it (ensure the chain maintains validity), and move on.**

There are also many nuances like attestation aggregation and something related to phases, but that is the topic of upcoming lectures.

### Casper-FFG

![Casper-FFG](/assets/lec-15/PoS-caperffg.png)

$$\text{The justified chain; }r ← b_1 ← b_2 ← b_3$$

Casper FFG, like any other pBFT-style protocol provides hard finality guarantees after a certain checkpoint. The flow towards a checkpoint, split into *epoch boundaries*, where the starting slot (filled) of the epoch after the last epoch leads to first justification and the after addition of another epoch, the justification is finalized and to prevent long reorganizations.

- To read: [Casper the Friendly Finality Gadget Research Paper](https://arxiv.org/pdf/1710.09437.pdf).

## Ethereum Today

- There are 32 slots in an epoch.
- There are 32 committees which are created using the pseudorandom number i.e. `RANDAO`.
- The committees are tasked to attest a given slot.
- Each slot progresses via LMD-GHOST.
- Over 32 slots (an epoch), all validators have voted, concluding one round of voting of Casper-FFG.

To better understand Gasper:

- [Combining GHOST and Casper i.e. Gasper](https://arxiv.org/pdf/2003.03052.pdf)

## Sync lifecycle

- Referenced as ebb and flow protocol.
- Network being initially partially synchronous, hence worry about the time period the network might not be synchronous.
- Look at the later situation, where once it does become synchronous.
- Hence a two part protocol phase;
  - *Network model*: partially synchronous network with GST (global stabilization time), time when synchrony begins
  - *Participation model*: dynamic until a time GAT (global awake time), where it stabilizes
- Important properties to implement a better participation model:
  - **Dynamic availability**: *available chain* to be safe and live under network synchrony and dynamic participation (GST = 0, GAT = ∞)
  - **Finality**: *finalized chain* to be always safe and live after $max(GST, GAT)$
  - **Prefix**: finalized chain is a *prefix of the available chain* (finalize is the prefix to the non-finalized chain). In simple terms, *Finalized blocks* are the **prefix** to the *non-finalized blocks*. ![finalized blocks → prefix to non-finalized blocks](/assets/lec-15/finalized-non-finalized.png)

- To ensure these properties, we need a hybrid fork-choice — Start from the latest justified checkpoint, then run LMD-GHOST ⇒ Prefix (red section in below image). ![diff-btw-lf-and-lj](/assets/lec-15/prefix-finality.png)

- Latest justified point is always followed by the latest finalized block due to supermajority. Hence, **first block** of:
  - *epoch $N$ is latest finalized*
  - *epoch $N+1$ is latest justified*

- Read [Synchrony, Asynchrony and Partial synchrony](https://decentralizedthoughts.github.io/2019-06-01-2019-5-31-models/) to better understand GST and GAT.
- Read [The Beacon Chain Ethereum 2.0 explainer you need to read first](https://ethos.dev/beacon-chain)
- [pos-evolution/pos-evolution.md](https://github.com/ethereum/pos-evolution/blob/master/pos-evolution.md)

## Problems of LMD-GHOST

### Simple ex-ante reorg

Simple yet most annoying which had huge breaking issue until resolved is ***ex-ante reorganization***.

It is a kind of reorg attack where the adversary attempts to setup a reorg beforehand.

Usually, reorg events are *an unexpected consequence* afterwards a proposer proposes. But reorgs can be used in form of attacks.

#### Attack procedure

1. The adversary withholds a block (${B_a}$) and its attestations (even a few would suffice).
2. Honest attestors don't know anything about the block (as withheld), so *votes the previous block*.
3. Now, the next proposer proposes the new block ($B_v$).
4. The adversary reveals the block $B_a$ just ahead of time when the attestations become available for the new valid block $B_v$.
5. Attestors of the new block, votes for $B_a$ as it already have a few attestations while $B_v$ has incurred none.
6. The honest attestors *unintentionally forked the chain*.

A figure below signifies unintentional fork caused due to Ex-ante reorg attack.

![unintentional ex-ante reorg](/assets/lec-15/unintential-reorg.png)

For more information related to reorgs and ex-ante reorgs, refer:

- Watch [REORG WTF](https://hackmd.io/cEw2Z-QcR1yvQ8wAeQZdnQ) to understand reorgs and its respective attack vectors.
- Read [Mitigation of ex ante reorgs - HackMD](https://notes.ethereum.org/@casparschwa/HkPjIzUQY)
- Read [Change fork choice rule to mitigate balancing and reorging attacks - Consensus - Ethereum Research](https://ethresear.ch/t/change-fork-choice-rule-to-mitigate-balancing-and-reorging-attacks/11127)

#### Solution: ***Proposer boost***

![proposer-boost](/assets/lec-15/proposer-boost.png)

The primary solution to the ex-ante reorg attack is: ***Proposer boost***. A hybrid between LMD-GHOST and GHOST.

>In principle, the idea is to *give weight to a block* for just being a block i.e. **for a particular slot it's assigned to propose at**.

The proposer boost ***lasts for a slot only***. And is only applied to the block that is to be *proposed in that respective slot*.

With the weights, the attestations to attack through ex-ante reorgs will require the threshold number of attestations more than the boost.

In practice, the boost is set at $\text{40\%}$.

##### <u>Attack vector no. 1 in proposer boost</u>

Hence, in order to attack, the adversary requires more than 40% of the attestations of the next slot (in which proposes) in order to execute the attack successfully.

##### <u>Attack vector no. 2 in proposer boost</u>

![Ex-ante reorgs with proposer boost](/assets/lec-15/ex-ante-reorgs-w-pb.png)

Another, possible attack vector is to withhold more than 1 block with some attestations to it. More the number of blocks withholder higher is the less no. of attestations are required to fork the chain.

| **No. of blocks withold** | **Attestation % required** |
| :-----------------------: | :------------------------: |
|             1             |           $40\%$           |
|             2             |           $20\%$           |
|             3             |          $13.3\%$          |
|             4             |           $10\%$           |
*and so on....*

But, *likelihood of withholding a lot of blocks is very difficult*. If an adversary has very little power, this is very much unlikely to be successful.

### Balancing Attacks

![Balancing attacks](/assets/lec-15/balancing-attacks.png)

In this attack vector, the honest attestors flip-flops between two branches created by the adversary intentionally (to fork the chain).

>Keep the both branch of chains balanced using your own attestations. If adversary has attestations than the proposer boost, then the attacks will be successful.

To understand it better,
- Read [A balancing attack on Gasper, the current candidate for Eth2's beacon chain - Proof-of-Stake / Block proposer - Ethereum Research](https://ethresear.ch/t/a-balancing-attack-on-gasper-the-current-candidate-for-eth2s-beacon-chain/8079)

### Resources

- Read resources mentioned in [Ethereum resources - HackMD](https://notes.ethereum.org/@casparschwa/HyGvlvkfK) to understand CASPER and LMD-GHOST and their limitations.
- Problems and recommended solutions in Ethereum PoS consensus are discussed in:
  - [Evolution of the Ethereum Proof-of-Stake Consensus Protocol - Part I - HackMD](https://notes.ethereum.org/@luca-zanolini/SyZAX6V8o)
  - [Evolution of the Ethereum Proof-of-Stake Consensus Protocol - Part II - HackMD](https://notes.ethereum.org/@luca-zanolini/Skf98kZ_i)
  - [Retrospective Roadmap: Navigating Through a Year of Theoretical Consensus Research—HackMD](https://notes.ethereum.org/@luca-zanolini/Byd-MjGQp)

## Designing theoretically secure available chain

### Improving proposer boost with ***View-Merge***

![proposer boost with view-merge](/assets/lec-15/pb-w-view-merge.png)

View-merge is a first step towards improving the protocol. It's not a for sure addition to the protocol in future, but rather a helpful tool to look for all the possibilities that help improve the protocol.

The idea is to introduce phases in a slot hence distributing a slot into sub-slots.
There are three phases:
1. *Propose*
2. *Vote*
3. *Freeze*

As seen in ex-ante reorg attack and balancing attack, the root cause to coordinated reorgs are potential attestations of the adversary.

This idea attempts to beat the intentional withholding of blocks and its attestations.

>A ***view*** is a total number of attestations that were received during the voting phase of a given slot.

Following is the lifecycle of this new slot:

1. Proposer proposes a new block within the given deadline to propose.
2. Once proposed, starts the new phase of voting where the attestors that are allowed to vote in that particular slot tries to attest the given block proposed.
3. Once, the voting phase finishes, the validators are said to freeze their attestations i.e. “*freeze their views*”. All the new attestations are added to the buffer and not to the block until the next round of voting starts (unless proposer says otherwise i.e. request the given buffer stored)
4. And the cycle continues in the next slot.

**Goal:** Whenever an honest proposer shows up, all honest attestors vote their proposal.

![View-merge synchronization between slots](/assets/lec-15/view-merge-sync.png)


With this mechanism, the part solved is now,

>All the honest validators, attest to the valid blocks no matter how powerful the adversary is‼️

But, ex-ante reorgs are still possible, because the adversary might control more than the required threshold of attestations and still able to intentionally fork the chain.

*The root cause behind the possibility of ex-ante reorgs is **committees** that allow for weight accumulation over multiple slots, even if LMD counts only one vote per validator.*

An adversary can accumulate these attestations over multiple slots to eventually have enough attestations to overcome the honest block attestors.

>***Solution***: get **rid** of committees altogether. Stop using committees.

Every validator in Ethereum needs to be voting every slot (instead of every epoch). Because then there will be no possibility of accumulating the attestations across multiple slots. *Consequentially, the adversary will need $40\%$ attestations of total validators (very unlikely).*

To understand more on view-merge,

- Read [View-merge as a replacement for proposer boost - Consensus - Ethereum Research](https://ethresear.ch/t/view-merge-as-a-replacement-for-proposer-boost/13739)
### RLMD-GHOST: A potential consensus mechanism upgrade

With the following additions to the LMD-GHOST;

- ***View-merge***: With this property included in the mechanism, all honest validators vote honest proposals.
- ***No committees***: If all honest validators vote for something, it stays in the canonical chain forever. Because, with view-merge, having no committees, there are no chances of attestation accumulation for an adversary.

Like discussed, together with *view-merge* and *no committees*,

***Reorg resilience***: Honest proposals are never reorged!

Vote expiry ($R$ = recent); attestation don't contribute fork-choice weight after some number of slots. Or in simple terms, don't count votes after a certain no. of slots.

With vote expiry, the chain can always recover from large portion of the validators set going offline.

For example,

![vote-expiry-rlmd](/assets/lec-15/rlmd.png)

Let's suppose, the green attestations are now offline (half of the total validators). Now the adversary could try to have a few red attestations which hence dictates the chain.

Now, if the red votes shift back to the other chain (which has offline attestations). It will reorg the chain.

So in order to counter this issue, with vote-expiry, all the old votes will lose its weight i.e. expire votes after certain slots.

To read more about RLMD-GHOST
- [Retrospective Roadmap: Navigating Through a Year of Theoretical Consensus Research - HackMD](https://notes.ethereum.org/@luca-zanolini/Byd-MjGQp#RLMD-GHOST)
- [Recent Latest Message Driven GHOST: Balancing Dynamic Availability With Asynchrony Resilience](https://arxiv.org/pdf/2302.11326)

## SSF Protocol

For Single Slot Finality; the idea is to *finalize blocks which are **already confirmed by the underlying available protocol*** (i.e. **LMD-GHOST**).

*Confirmed* means that the chain is now unlikely to reorg up to the mark of the block that has been confirmed. In Bitcoin, the confirmation rule suggests that the block that is $K$ deep in the longest chain is unlikely to reorg.

> **TLDR. Confirmed blocks, in principle, cannot reorg the chain.**

The only thing to worry is *recovery from periods of asynchrony*, i.e. attack on the protocol or something breaks in the underlying protocol.

In order to recover, there are some tricky scenarios that are to be handled.

### Add ***fast confirmation rule*** to RLMD-GHOST

![fast-confirmation-rule](/assets/lec-15/fcr-rlmd-ghost.png)

The confirmation rule used currently is similar to $K$-Deep the longest chain rule.

For SSF, we need a *fast confirmation rule* because we need to finalize fast in order to escape reorgs and in order to finalize, we require *confirmation*.

**Fast confirmation rule** could be simply described as *any block which received a $2/3$ quorum in the same slot is confirmed*. So, we add another phase to our View-merge i.e. ***Fast confirm*** to get this property.

![single-slot-finality](/assets/lec-15/ssf.png)

### Security Guarantees

- If an honest validator fast confirms a block $B$, then every honest validator sees the 2/3 quorum for B before freezing its view.
- Another important factor is that *unless, at least $1/3$ equivocations ($E$), honest validators sees Block $B$ as canonical in the next slot and vote for it.* So, in order to delay, adversary requires more than 1/3 votes for another block $B'$ (sibling) before the views freeze.
- Every honest validator votes for subtree of block $B$ in the next slot. Hence, block $B$, will forever remain in the canonical chain if there is an honest majority ($>2/3$ attestations).

### Introducing CASPER-FFG for finality in SSF protocol

![single-slot-finality-w-casper](ssf-w-casper.png)

Casper-FFG is essential to finalize the protocol.

To integrate, Casper-FFG with RLMD-GHOST, and the phase are as follows:

1. Propose (*Gossiping* starts)
2. **Head** vote (*Confirming* the quorum)
3. Fast confirm and **FFG vote** (cast an FFG-vote hence, *Justifying* the block)
4. Freeze and **Acknowledge** (acknowledge the justified block, freeze and hence, *Finalizing* the block)

>**The chain does not finalize after Head vote. The chain will only finalize the freezing and acknowledgement of FFG votes.**

- **Fork-Choice**: start from latest justified, run RLMD-GHOST.
- **FFG votes**: $source = \text{latest justified}$ and $target = \text{highest confirmed block descending from justified}$ i.e. the best security guaranteed block is latest justified.
- **Acknowledgement**:if there is a new justified checkpoint, acknowledge it, committing to start your fork-choice from it. $\text{A quorum of acks} = finality$.

In a scenario for honest slots under synchrony is going to look like:

![honest-slots-in-ssf](/assets/lec-15/honest-ssf.png)

1. Honest proposer proposes a timely proposal $B$.
2. All honest validators vote for $B$ (view-merge), forming a $2/3$ quorum of head votes.
3. All honest validators get the quorum for $B$, fast confirms $B$ and use it as their FFG target. A *supermajority link* $LJ → (B, t)$ forms.
4. All honest validators justify $(B, t)$ before freezing their view. Their fork-choice starts from $B$. They acknowledge $(B, t)$, and a *supermajority acknowledgement* of $(B, t)$ forms.
5. Everyone sees $B$ as finalized.

Read the following to know more about Single-Slot Finality Protocol:

- [Simple Single SLot Finality Protocol for Ethereum](https://eprint.iacr.org/2023/280.pdf). [Ethresear.ch post](https://ethresear.ch/t/a-simple-single-slot-finality-protocol/14920) explaining the same research paper
- [Paths toward single-slot finality - HackMD](https://notes.ethereum.org/@vbuterin/single_slot_finality) by Vitalik Buterin

## 3SF: A chained 3-slot-finality protocol

***3-Slot-Finality (3SF)***, is to *distribute multiple voting rounds* from one slot to three slots. 3 rounds of voting is a lot for a validator (considering huge validator set) that too for every slot, because the concept of epoch will be nullified (RLMD-GHOST & Casper FFG both have a lifespan of slot).

![3-slot-finality](/assets/lec-15/3sf.png)


To mitigate the overhead, with 3SF, distribute each voting period across 3 slots i.e.
- **SLOT 1**: Head vote for $B$, hence its *confirmed*
- **SLOT 2**: Everyone use $(B, t)$ as their FFG target, and it is *justified*
- **SLOT 3**: Everyone use $(B, t)$ as their FFG source and it is *finalized*

>Hence, it is 3 phase consensus protocol distribute across 3 slots where head vote confirms, FFG target justifies and FFG source finalizes.

For more information about 3-Slot-Finality:

- [3-Slot-Finality Protocol for Ethereum](https://arxiv.org/pdf/2411.00558)
- [3-Slot-Finality: SSF is not about "Single" Slot - Consensus - Ethereum Research](https://ethresear.ch/t/3-slot-finality-ssf-is-not-about-single-slot/20927)
- [Paths to SSF revisited - Proof-of-Stake / Economics - Ethereum Research](https://ethresear.ch/t/paths-to-ssf-revisited/22052)

## Questions

*Ques.* What is the count of BLS signatures and its limit per slot in SSF scenario?

*Ans.* BLS signatures are used in CL for attestations. A great feature of BLS signatures is, they can be aggregated. With aggregation, one signature can represent the whole committee. Assuming Ethereum having 1M validators, each committee will be $1M/32 ≅ 32K\quad validators$.

In the case of SSF, the concept of committee no longer exists. Hence, aggregating a million validators is quite a computational task. To compare, a Raspberry Pi takes ~36 seconds to aggregate 1M signatures for a single slot. Even when executed in parallel, it takes 1–2 seconds for it on a good machine.

Hence, it is borderline impractical to integrate SSF with current scenario of BLS signatures. But, in future, the things might change.

---

*Ques.* In proposer boost, what if during the view-merge, a proposer is dishonest?

*Ans.* A proposer cannot censor honest votes as they are independent to a proposer. A proposer might try to confuse other attestors by using late votes. Examples to be a dishonest proposer are withholding or publishing late blocks and publishing late attestations to confuse other attestors.

## Fork-choice in the Ethereum Roadmap

- SSF (or fast finality):
  - Optimally secure consensus protocol
  - Fast confirmation of high value transactions, e.g. fast deposits on exchanges
  - Faster bridging
  - Better L2 interoperability
- ePBS
- DAS

Before discussing ePBS and DAS, lets first understand **$(Block, slot)$ fork-choice** (enshrining empty slots).

### (Block, Slot) Fork-Choice: Enshrining empty slots

>**TLDR. The idea is basically to allow people to vote against blocks.**

So far, attestors are required attest each epoch and they don't get to say — "I don't want this block to be canonical".

There are various reasons that might make this property a great addition.

Let's understand this with an example to make a sensible argument:

![(block, slot) fork choice](/assets/lec-15/block-slot-fc.png)

- Block $A$ was added at slot $t$, hence $(A, t)$.
- Now, there are two scenarios, in which the attestors diverge due to delay.
- Block $B$ is proposed at slot $t+1$, but there is a delay.
- Due to the delay, attestors attest $(A, t+1)$ instead i.e. empty slot. (Any block that is already proposed in previous slots but is again attested by the validators means there might be a delay in proposal of new block or the block was never proposed.)
- With this feature, the idea is to incentivize timely proposal of new blocks or the block will never become canonical.

**Status Quo: Fork choice**
In status quo fork choice, even if block $B$ has less attestations than $A$ (delayed proposal), as it is the children subtree of $A$. The block $B$ can't be denied inclusion even if it had a delay.

A more complex example explaining

- The $(Block, slot)$ Fork choice: In this scenario, the canonical chain is $(A, t) ← (B, t+1) ← (B, t+2) ← (B, t+3)$ ![block-slot-example](/assets/lec-15/bs-example.png)
- The Status Quo Fork-choice even though block $C$ is delayed proposal (how Ethereum works today): ![block-slot-example-2](/assets/lec-15/bs-example-2.png)
### Applications of $(Block, Slot)$ fork-choice

- **Committee-enforceable properties**: If a proposal doesn't fulfil a certain property, the attesting committee votes ***"against it"*** (attests for the empty block instead).
  - Inclusion Lists satisfaction (if the block contains txns specified in the inclusion list, then vote *for* the block, or else against it i.e. empty block).
  - Bid maximization (MEV burn: proposal includes highest bids in the mempool first)
- **ePBS fork-choice**: Proposers accept bids from builders. If they don't publish them on time, the empty block wins and the builder is off the hook (lost).
- **DAS fork-choice**: If a block is unavailable, most honest validators will not vote for it, i.e., they will vote against it and vote for an empty block. Thus, no unavailable block should ever ***"look"*** canonical.

### Issue with $(Block, Slot)$ fork-choice

> **This fork-choice incentivizes timeliness.**

Higher latency halts block production. Sometimes blocks being late (reasons could be someone trying something weird attacks or timing games) hence block not able to make it in 4 seconds deadline.

![block-slot-issues](/assets/lec-15/bs-issue.png)

Everyone eventually attest to the empty block, and block production halts.

In order to counter this challenge, the protocol needs a back-off system where in such situations, we have a revert mechanism that would temporarily undo the properties provide by $(Block, slot)$ fork-choice in order to produce blocks again.

### ePBS fork-choice

#### Two-slot ePBS

![two-slot-epbs](/assets/lec-15/2-slot-epbs.png)

The Two-slot approach involves
- **Commit**: Proposal commits to a bid made by the builder by accepting the execution header in first slot
- **Reveal**: Builder reveals the execution payload in next slot.

> **This increases the security of the participants (both builders and proposers).**

There again exists a potential chance of **ex-ante reorgs**.

##### Ex-ante reorgs, ePBS version

![ex-ante reorgs, epbs version](/assets/lec-15/reorgs-epbs.png)


With two-slot approach, the adversarial power doubles because:

Now the adversary has the power to control two consecutive slots (if an adversary controls one slot, then automatically controls the next one as well),

1. *maliciously commit to a bad execution header (bid)*
2. *collude with the builder to build a malicious block.*

Hence, adversary has ***two times*** equivalent power of the normal(current) ex-ante reorgs.

#### One-slot ePBS with PTC (Payload Timeliness Committee)

Introduce **payload attestations committee (PTC)** which reviews - *if the payload was committed in time?*.

It is an area of active research.

At current stage of research, it provides ***subpar guarantees to builders***. Because *they can be forced to reveal a payload without it becoming canonical*.

Things are still unclear to solve it, but there are some proposal to solve it.

#### RLMD-GHOST with ePBS

If there exists ***no committees***, the root problem of ex-ante reorgs are solved. Because, considering the attestations of all the validators in the validator set, it is improbable for an adversary to intentionally create a reorg.

![rlmd-ghost with epbs](/assets/lec-15/rlmd-epbs.png)

### PeerDAS Fork-choice

Discussed in [Sharding and DAS](/notes/lec-07-sharding-and-das.md) lecture.

Blobs introduced in Dencun Fork, with EIP-4844 helps temporarily store data for L2s to increase the data availability security.

The concept of extended blobs helps the chance of retrieving the data more easier.

Extend blobs by introducing mathematical redundancy with concepts like erasure coding. This will allow reconstruction of full data if we have $50\%$ of it.
So we don't need to check the whole data at each node to ensure availablity instead just check for that $50\%$.

Also, like discussed before, randomly checking for 30 samples, reduces the propability of unavailability to $1/Billion$.

Another version of the same concept to verify availability involves *2D sampling*. Stacking multiple blobs in the form of a 2d matrix.

![DAS 2d sampling](/assets/lec-15/das-2d.png)

Verification involves randomly downloading a few column indexes. If half of the columns are available then the whole data in the matrix is available.

#### Fork-choice Implications

If we do enough sampling before voting, we get a great global property:

> **Only at most a small percentage Δ of the honest validators will see unavailable data as available.**

⇒ If we have $>1/2 + Δ$ honest validators, a majority always votes against unavailable blocks.

⇒ With the $(Block, slot)$ fork-choice, this means that no validator will ever see an unavailable block as canonical. (Like discussed in $(Block, slot)$ fork-choice)

The fork-choice essentially works as if we didn't have DAS at all!

Overall $(Block, slot)$ fork-choice is a really nice addition to Ethereum with a few more improvements, it will eventually maintain CR and decentralization and at the same time help scale Ethereum.

