# Gasper by Ben Edgington

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day16)

## Overview

This lecture explains the significance of LMD-GHOST & Casper-FFG, and both work together to form GASPER. The overview includes:

- Introduction to fork choice
- LMD-GHOST
- Casper FFG
- Gasper

## Sections Timestamp


| Topic                                                           | Time    |
| --------------------------------------------------------------- | ------- |
| Introduction to Ben Edgington                                   | 0:00    |
| Ben's Background and his contributions to Ethereum Protocol     | 1:49    |
| Agenda                                                          | 3:57    |
| Introduction: Safety & Liveness                                 | 4:19    |
| The fork-choice rule                                            | 7:32    |
| Vulnerabilities or attack vectors in Ethereum's PoS fork-choice | 10:16   |
| Fork choice struggles: Pectra Holešky upgrade Incident          | 11:20   |
| Navigating the specs                                            | 13:17   |
| The Store                                                       | 16:11   |
| Events                                                          | 17:18   |
| Questions                                                       | 19:50   |
| LMD-GHOST                                                       | 24:25   |
| Pictorial Representation of LMD-GHOST                           | 30:13   |
| get_head()                                                      | 33:23   |
| get_weight()                                                    | 35:23   |
| on_block() assertions                                           | 36:52   |
| Proposer Boost                                                  | 39:45   |
| Slashing in LMD-GHOST                                           | 44:43   |
| Questions                                                       | 47:10   |
| Casper-FFG                                                      | 49:34   |
| Checkpoints                                                     | 54:08   |
| Supermajority Links                                             | 56:39   |
| Two-phase commit                                                | 57:18   |
| Casper Commandments                                             | 1:00:24 |
| Slashing                                                        | 1:04:05 |
| GASPER                                                          | 1:05:35 |
| Issues with Gasper: Block tree filtering                        | 1:08:35 |
| Issues with Gasper:Unrealised justification and finalisation    | 1:11:03 |
| Questions                                                       | 1:13:27 |


## Table of contents

<!-- mtoc-start -->

* [Ben's Ethereum contributions](#bens-ethereum-contributions)
* [Recap](#recap)
  * [Gist of CAP Theorem](#gist-of-cap-theorem)
* [The fork-choice rule](#the-fork-choice-rule)
* [Historical issues with Ethereum's PoS fork choice](#historical-issues-with-ethereums-pos-fork-choice)
* [Fork choice struggles: Pectra Holešky Testnet Incident](#fork-choice-struggles-pectra-holeky-testnet-incident)
* [Navigating the specs](#navigating-the-specs)
  * [The Store](#the-store)
  * [Events](#events)
* [Questions: Part-1](#questions-part-1)
* [LMD-GHOST](#lmd-ghost)
  * [Basic Overview](#basic-overview)
  * [Pictorial Representation](#pictorial-representation)
  * [Checks to ignore undesirable blocks](#checks-to-ignore-undesirable-blocks)
  * [Proposer Boost](#proposer-boost)
  * [***Slashing*** in LMD-GHOST](#slashing-in-lmd-ghost)
* [Questions: Part-2](#questions-part-2)
* [Casper-FFG](#casper-ffg)
  * [Basic Overview of Casper-FFG](#basic-overview-of-casper-ffg)
  * [Checkpoints](#checkpoints)
  * [Supermajority Links](#supermajority-links)
  * [Two-phase commit](#two-phase-commit)
  * [Casper Commandments](#casper-commandments)
  * [Slashing](#slashing)
* [GASPER](#gasper)
  * [Modified LMD-GHOST fork choice](#modified-lmd-ghost-fork-choice)
* [Gasper in reality](#gasper-in-reality)
  * [Questions: Part-3](#questions-part-3)

<!-- mtoc-end -->

## Ben's Ethereum contributions

Ben Edgington's contributions to Ethereum Ecosystem:

![ben-contribution](/assets/lec-16/ben-contributions.png)

## Recap

- [Safety](https://eth2book.info/capella/part2/consensus/preliminaries/#safety) - "Nothing bad ever happens".
- [Liveness](https://eth2book.info/capella/part2/consensus/preliminaries/#liveness) - "Something good eventually happens".
- [CAP Theorem](https://eth2book.info/capella/part2/consensus/preliminaries/#you-cant-have-both) - "You can't have both on a real network".
- [Ethereum prioritizes liveness](https://eth2book.info/capella/part2/consensus/preliminaries/#ethereum-prioritises-liveness) with **LMD-GHOST** with *best efforts* of safety ([finality](https://eth2book.info/capella/part2/consensus/preliminaries/#finality)) with **Casper-FFG**. Hence, ***GASPER***.


### Gist of CAP Theorem

We have to choose whether we're going to *favour consistency*, so our system is always in a well-defined state and every node agrees with every other node, or we're going to *choose availability*, which means that our system can continue working even in the presence of partitions, like as happens on the internet.

## The fork-choice rule

- The challenging part about networks that prioritize liveness is they could be *"forkful"*. They sometimes build trees rather than chains. The reasons could be late messages or attacker feeding different messages to different nodes, or faulty software client.
- Forks occur due to different nodes having different view of the network at any given time. Hence, we need certain rules to mitigate and tackle certain edge cases where the different views might lead to a fork. The primary question to ask: **What should follow the canonical chain and why?**
- And to answer this, there exists **Fork-choice rule**.
- Fork choice rule is the method by which the network converges on a single branch, and therefore a single, shared history. Block tree → Blockchain.
- Later, we *prune* the siblings or uncle blocks that were not considered into the canonical chain.
- ***Heuristic***: Build on the branch that is most likely to be built on (least likely to be orphaned) by other nodes, based on whatever information we have received.
- In the below image, ![forkchoice-rule](/assets/lec-16/fork-choice.png)
  - Chain-flow: $A → B → D → F
  - Orphaned blocks: Block $C$ & $E$
  - Block $F$ is the head of the canonical chain.

## Historical issues with Ethereum's PoS fork choice

Historical issues with Ethereum’s PoS fork choice:

- August 2019, [decoy flip-flop attack](https://ethresear.ch/t/decoy-flip-flop-attack-on-lmd-ghost/6001?u=benjaminion) (temporary finality delay)
- September 2019, [bouncing attack](https://ethresear.ch/t/analysis-of-bouncing-attack-on-ffg/6113?u=benjaminion) (indefinite finality delay)
- November 2019, [finality liveness failure](https://notes.ethereum.org/Fj-gVkOSTpOyUx-zkWjuwg?view) (unable to finalize new checkpoints)
- October 2020, [balancing attack](https://ethresear.ch/t/a-balancing-attack-on-gasper-the-current-candidate-for-eth2s-beacon-chain/8079?u=benjaminion) (long forks, indefinite finality delay)
- July 2021, [inconsistent finalised and justified](https://notes.ethereum.org/@hww/fork-choice-store-inconsistency)
- November 2021, [non-atomic finalisation and justification](https://notes.ethereum.org/@djrtwo/S1ZGAXhwK)
- January 2022, [a new balancing attack](https://ethresear.ch/t/balancing-attack-lmd-edition/11853?u=benjaminion)
- May 2022, [unrealised justification reorgs](https://notes.ethereum.org/@adiasg/unrealized-justification) (proposers can induce long reorgs)
- June 2022, [justification withholding attacks](https://hackmd.io/o9tGPQL2Q4iH3Mg7Mma9wQ) (ditto)

Also, eth2 book covers the same: [Upgrading Ethereum | 3.7 Fork Choice | History](https://eth2book.info/capella/part3/forkchoice/#history)


## Fork choice struggles: Pectra Holešky Testnet Incident

Discussion link: [Interop: Discord Link](https://discord.com/channels/595666850260713488/892088344438255616/1343705082499174492)
Github link: [pm/Pectra/holesky-postmortem.md](https://github.com/ethereum/pm/blob/master/Pectra/holesky-postmortem.md)

40 hours of chaos during the launch of Pectra Hard fork at Holešky testnet. There were quite a lot of issues faced during the fork test.

The network faced a lot of issues related to:
- Faulty clients
- P2P meltdown
- Slashing protection
- Low block production
- Snap sync
- Checkpoint sync
- Optimistic sync
- Client instability (OOM)
- and much more…

>This Holešky incident is very educational.

- Read this discussion in detail to get better understanding about fork choice and beacon chain and what caused a lot of chaos in Holešky testnet.

## Navigating the specs

```python
class AttestationData(Container):
	slot: Slot
	index: CommitteeIndex
	# LMD GHOST vote
	beacon_block_root: Root
	# FFG vote
	source: Checkpoint
	target: Checkpoint
```

- Each validator broadcasts its view of the network via an attestation once per epoch:
  - Broadcast via P2P gossip
  - Packed into blocks by proposers
- `CommitteeIndex` is going to deprecate post-Electra (ref. [EIP-7549](https://eips.ethereum.org/EIPS/eip-7549)) and will always fulfil `index == 0`.
- *LMD GHOST largely depends on attestations received via gossip.* Attestations are  for `beacon_block_root`. Handling it is part of fork choice: `consensus-specs/fork-choice.md`
- *Casper-FFG solely depends on attestations in blocks.* Therefore, handling is part of block and epoch processing: `consensus-specs/beacon-chain.md`

### The Store

The store is the ***node's view*** of the network in the terms of classical consensus theory. It contains *all the information* that a node needs to *know about the state* of the network.

### Events

The LMD-GHOST fork choice is ***event driven***. All the fork choice handlers are specified in the specs: [specs/phase0/fork-choice.md](https://github.com/ethereum/consensus-specs/tree/dev/specs/phase0/fork-choice.md#handlers).

Also read about [handlers](https://eth2book.info/capella/part3/forkchoice/phase0/#handlers) in Upgrading Ethereum book.

LMD-GHOST fork choice performs certain tasks on any triggered event. There are 4 event handlers:

- `on_tick()`: A tick is regular call that client makes atleast twice in a slot (might differ for each client). It is to get regular updates about the current time and perform some light housekeeping.
- `on_block()`: Adds new blocks to the `Store` as the node receives them.
- `on_attestation()`: Updates validators' latest messages, whether received in blocks or via P2P.
- `on_attester_slashing()`: Ensure that slashed validators' votes are not counted, and so avoids some equivocation attacks.

Fork choice, being event-driven, is always ready to output the best head block via a call to [`get_head()`](https://github.com/ethereum/consensus-specs/tree/dev/specs/phase0/fork-choice.md#get_head). More info on the function: read [Upgrading Ethereum | 3.7.1 Phase 0 Fork Choice](https://eth2book.info/capella/part3/forkchoice/phase0/#get_head).


## Questions: Part-1

*Ques.* What are the incentives or punishments for proposers to perform collection of attestations and packing them into blocks?

*Ans.* If 100% of attestations get on chain, I get a full reward. If only half of attestations get on chain, I only get half an attestation reward, and so does everybody else. So if I want to make sure I maximize my attestation reward, then I need to make sure that as many attestations as possible get on chain, which is my sort of indirect incentive to pack attestations into blocks.

---

*Ques.* What are the validators exactly voting on in a slot: is it the previous block on which the validators attest to?
*Ans.* There is a deadline for the proposer to propose and broadcast the block in the first 4 seconds of the slot. The next 4 seconds are for the attestors to either attest the new block proposed or the previous block provided the attestor saw the new block or not.

==Slot lifecycle==

| Time (in seconds) | Description                                                                                                       |
| :---------------: | :---------------------------------------------------------------------------------------------------------------- |
|         0         | Proposer have to publish the block to the network                                                                 |
|        0-4        | Deadline for the block to propagate                                                                               |
|        4-8        | Validators attest to the block and broadcast the attestation                                                      |
|       8-12        | Aggregators aggregate the attestations and get it ready for the proposer to include in the next block (next slot) |


---

*Ques.* What is the optimal way for validators to send the latest messages: in a block or via P2P?

*Ans.* Attestations need to be broadcast by P2P because they not likely to be the proposer of the next block, so they need to broadcast to all their peers on the network.


## LMD-GHOST

[LMD](https://eth2book.info/capella/part2/consensus/lmd_ghost/#lmd)

- *Message Driven*
	- Relies only on attestations
	- Validators attest to what they believe to be the best head in the current slot
- *Latest*
	- Only the most recent attestation from each validator counts
	- IMD-GHOST (Immediate), FMD-GHOST (Fresh), RLMD-GHOST (recent latest)

[GHOST](https://eth2book.info/capella/part2/consensus/lmd_ghost/#ghost)

- **Greedy Heaviest-Observed Sub-Tree** algorithm
- From a 2013 paper by Sompolinsky and Zohar about how to safely improve transaction throughput on Bitcoin.
- There were attempts to introduce it into Ethereum PoW but got later introduced in Ethereum PoS, in Beacon chain.

### Basic Overview

→ *Slot-based*: ***12s*** i.e. make decision every slot interval about the current head of the chain.

→ *Goal*:

- Used by the *block proposer* to decide on which branch to build its block
- Used by the *attestor* to choose which branch to attest to ⇒ **convergence**.

→ *Heuristic*: Attestors collectively decide on which branch is least likely to be orphaned in future?

→ *Based on*:

- Attestations received are **weighted** according to the effective balance of each validator.
- Supposing 1M validators, in an epoch, each slot comprise of approx $1M/32 ~ 31250$ i.e. $3.125\%$ validator attestations that are "fresh". Each slot we only see the view of $3\%$ validators and quite possible that other $97\%$ might have a different view on them. Quite a dilemma.

→ *Properties*:

- **Liveness**: It will always output a viable head block on which to build ([proof under synchrony](https://docs.google.com/document/d/1riyJxPPCuTwxmpKWqUD9noGMPB5FtvUW81JN9kaUQBo/edit?tab=t.0))
- **Safety**: no useful safety guarantees (however, see the [confirmation rule](https://eth2book.info/capella/part2/consensus/lmd_ghost/#confirmation-rule), the $<33\%$ adversary assumption)

### Pictorial Representation

Let's take the below figure, ![lmd-ghost](/assets/lec-16/ghost.png)

There are *7 blocks proposed* overall, i.e. $A, B, C, D, E, F, G$.

Let's consider,
$A$ is first block of a new epoch (genesis block in pure LMD-GHOST).

In the next slot, block $B$ is proposed and its build on $A$. And it receives $20$ votes.

Now, $C$ gets proposed but instead of building on $B$, it again builds on $A$. There could be following reasons behind it:

- Proposer who proposed $C$, didn't hear about $B$ in time. At the time of proposal, the latest head according to it was $A$.
- The proposer of $C$ knows that $B$ is invalid (in its own view).
- The proposer found juicy MEV in $B$ block, and wants to maximally extract to gain personal benefits along with the block proposal rewards.

Similarly, for various other scenarios, other blocks branched off.

Each block has votes attached to it. Remember, these votes are stake-weighted i.e. are weighted according to the E.B of each validator attesting.

The updated figure, explains the concept of vote aggregation.
![](/assets/lec-16/ghost-2.png)

<u>**Calculating the Heaviest-Subtree**</u>

To calculate the heaviest sub-tree, *the votes of each block in the subtree is added* and the sub-tree with the *most votes* is considered **canonical**.

*This process continues until we reach the head block (traverse until a block has no children).*

Also, GHOST algorithm is different than the longest chain algorithm. From the above example, head block according to: **GHOST:** $E$, **Longest chain:** $G$

Code implementation that explains the algorithm is in `get_head()` at [phase0/fork-choice.md](https://github.com/ethereum/consensus-specs/tree/dev/specs/phase0/fork-choice.md#get_head).

And to gather weights for each eligible validator (active and unslashed) according to their effective balance is in `get_weight()` at [phase0/fork-choice.md](https://github.com/ethereum/consensus-specs/tree/dev/specs/phase0/fork-choice.md#get_weight).

***The vote is for a block that descends from the root of the chain.***

When at the Genesis, *the weight is every block in the tree.* Going along the branches, it's just the weight of the subtree — *the weight of all the blocks for which the root block is the ancestor*.

[Go implementation by protolambda](https://github.com/protolambda/lmd-ghost)

### Checks to ignore undesirable blocks

Some of the questions that are to be answered and checked every slot:

- Was it correctly signed by the expected proposer? *Actually checked upstream of fork choice i.e. GOSSIP LAYER*
- Are all its ancestor blocks valid?
- Is the block's post-state hash correct? *Does the block respect the STF*
- Is its data available? Have we seen or can we get its attached blobs? (New in Deneb)
Future Questions:
- Is the block non-censoring? *Fork-choice enforced Inclusion Lists (FOCIL)*
- More sophisticated data availability? *with PeerDAS*

All checks are asserted in `on_block`, [deneb/fork-choice.md](https://github.com/ethereum/consensus-specs/tree/dev/specs/deneb/fork-choice.md#on_block)

`on_block` filters out the undesirable blocks before they even get into the store, so we don't have to filter them later.
Unavailable data is held back and queued again later when it becomes valid (when resubmitted)

### Proposer Boost

In 2020, a ***balancing attack was identified***,

Under some extreme circumstances, a very small number of validators could fork the chain into two equally weighted branches and balance the votes for them, maintaining this split indefinitely. Hence, the chain will never finalize.

>**Proposer Boost** is the fix for this problem.

In fundamentals, this is how Proposer boost works:

- Blocks received in a timely way (i.e. within 4 seconds of slot start) are assigned a huge extra weight in the `get_weight()` calculation.
- The extra weight almost certainly makes the timely block the head of the chain. Ex-ante reorgs are the possible attack vector though (Read more on this in [consensus-upgrade lecture](/notes/lec-15-consensus-upgrades.md)).
- This makes honest proposers almost sure to build on a timely block that they received.
- *"A block that is timely should not expect to be reorged".*

More info in [eth2book](https://eth2book.info/capella/part3/forkchoice/phase0/#proposer-boost).

![proposer-boost](/assets/lec-16/proposer-boost.png)


Why $40\%$? [Answer](https://eth2book.info/capella/part3/forkchoice/phase0/#configuration)

The proposer boost logic resides in multiple functions in the [phase0/fork-choice.md](https://github.com/ethereum/consensus-specs/tree/dev/specs/phase0/fork-choice.md):

- `get_proposer_score` (used in `get_weight`)
- `on_block`
- `on_tick_per_slot`

Read the above functions to better understand proposer boost.

Proposer boost also helps the fork choice algorithm as it strongly discourages late block production.

- An honest proposer should publish a block by *4s* to allow time for attestations to be made and to be collected by the network.
- However, the spec allows a block received as late as 12s to be built upon by the next proposer.
- Block builders (MEV searchers) took advantage of this to publish later with low risk of being orphaned.
- This destabilises the network as such late blocks gather few attestations, and it penalises timely attestors (who attest to an empty slot)

Proposer boost allows an honest proposer to build on the parent of a late block, its block becoming the head (since its timely). Thus, late block is orphaned / re-orged out of the chain. For more info related to it: refer [`get_proposer_head()`](https://github.com/ethereum/consensus-specs/tree/dev/specs/phase0/fork-choice.md#get_proposer_head)

### ***Slashing*** in LMD-GHOST

Slashing solves the ***nothing at stake*** problem with PoS.

The motive is to slash/punish equivocating proposers and attestors.

Vitalik proposed Slasher in 2014, which had a similar idea to slash stakers in terms of punishment for bad behaviour and to keep them accountable. [Slasher: A Punitive Proof-of-Stake Algorithm | Ethereum Foundation Blog](https://blog.ethereum.org/2014/01/15/slasher-a-punitive-proof-of-stake-algorithm)

## Questions: Part-2

*Ques.* Is the confirmation rule discussed (look for safety and liveness property above) for LMD-GHOST somewhat similar to CBC Casper (proposed by Vlad and Vitalik)

*Ans.* CBC Casper is very different than the confirmation rule. But the gist is So if we make some simple assumptions, we ought to be able to do better than waiting 12 minutes for finality.
- An off-topic but a good resource to get the pov around CBC Casper from both Vlad & Vitalik: [Casper: Vlad Zamfir and Vitalik Buterin discuss the CBC Casper Framework at Stanford University - YouTube](https://www.youtube.com/watch?v=VrIk3OAt_bw)
- A peer review on CBC Casper: [Peer Review: CBC Casper](https://medium.com/@muneeb/peer-review-cbc-casper-30840a98c89a)
- An article by Vitalik: [A CBC Casper Tutorial](https://vitalik.eth.limo/general/2018/12/05/cbc_casper.html)


## Casper-FFG

***Casper***

- Influenced by Vlad Zamfir's Casper protocol that uses GHOST.
- Named after *Casper, the friendly ghost*
- But Casper FFG has very little similarities to Zamfir's protocol (see above question) and it doesn't use GHOST

***FFG*** (Friendly Finality Gadget)

- A *gadget* (coined by Vitalik) is a self-contained enhancement to another process.
- Casper FFG adds finality to an existing blockchain consensus mechanism.
- It was originally planned to add finality to Ethereum PoW ([EIP-1011](https://eips.ethereum.org/EIPS/eip-1011))
- Later adopted for PoS transition and work in coordination with LMD-GHOST to help finalise the chain.
- Paper: [Casper the Friendly Finality Gadget](https://arxiv.org/abs/1710.09437)

### Basic Overview of Casper-FFG

→ **Epoch-based**: *32 slots / 6.4 mins / 384s*

→ **Goal**: Confer ***finality*** on the chain: a checkpoint that will never be reverted (except at enormous cost)

→ **Heuristic**: Two-phase commit based on agreement among validator having at least $2/3$ of the stake.

→ *Dependent on **weighing** the source and target votes received in attestations contained in blocks.*

→ **Properties**:

- ***Plausible Liveness***: cannot get into a stuck state that is unable to finalise anything.
- ***Accountable Safety***: finalising conflicting checkpoints comes at enormous cost i.e. Economic Finality.
- Refer [eth2book](https://eth2book.info/capella/part2/consensus/casper_ffg/#the-guarantees-of-casper-ffg) for more info on guarantees.

### Checkpoints

- Casper FFG relies on checkpoints.
- It relies on seeing votes from the whole validator set.
- The whole validator set voting every slot is very expensive. Hence, the votes are accumulated across an epoch (32 slots) i.e.

$$\begin{gather} 1/32 = 0.03125 \\ \text{i.e. } 3.125\% \text{ validators per slot.}\end{gather}$$

- After adding up all the votes, we try to figure out the *justified and finalized checkpoints*.
- A **checkpoint** is the *first block or first filled slot* in an epoch. Each epoch has atleast one checkpoint (multiple if the chain branches).
- Validators vote for a source and target checkpoint (See. `AttestationData` in `consensus-specs`): ![checkpoints](/assets/lec-16/checkpoint.png)
  - **Source**: the highest justified checkpoint I know of.
  - **Target**: the checkpoint I see in the current epoch.

### Supermajority Links

>A validator task is *to vote for the **transition from source to target** at the end of each epoch*.

***A Casper-FFG vote is a link between source and target checkpoints.***

If $>2/3$ of validators (by stake) vote for the ***same** transition from source to target* is called ***supermajority link***.

### Two-phase commit

The two-phase commit contains as the phrase says two phases:

![two-phase-commit](/assets/lec-16/two-phase-commit.png)

**1. Justification**
When more than $2/3$ of validators agree on the same link of source → target i.e. all have same votes, then the *target checkpoint is considered justified*.

**2. Finalisation**
When more than $2/3$ of validators agree on the same justification of the same link of source → target, then the *source is consider finalised*.

So, it's not just agreement on the same justification link that finalizes the source. If the source $S$ is justified, and then a new link from that justified source $S$ to a target $T$ also achieves supermajority agreement, thereby justifying $T$. This two-step process S is justified, then T is justified with $S$ as its source leads to the finalization of $S$.

- Read [eth2book](https://eth2book.info/capella/part2/consensus/casper_ffg/#casper-ffg-vs-pbft) for more info on two-phase commit

### Casper Commandments

- **No double vote**: A validator must not publish distinct votes, $s_1 → t_1$ and $s_2 → t_2$ such that $h(t_1) = h(t_2)$. A validator must make at most one vote for any target epoch (even in the case of forks, make a commitment to one vote i.e. source → target link). ![casper-commandments](/assets/lec-16/casper-commandments.png)
- **No surround vote**: A validator must not publish distinct votes $s_1 → t_1$ and $s_2 → t_2$ such that $h(s_1) < h(s_2) < h(t_1) < h(t_2)$. A validator must not make a vote such that it link either surrounds, or is surrounded by, a previous link it voted for. (Recent Holešky Testnet incident is a perfect example) ![casper-commandments-2](/assets/lec-16/casper-commandments-2.png)

- More on the same in the [eth2 book](https://eth2book.info/capella/part2/consensus/casper_ffg/#the-casper-commandments).

The above two commandments eventually provides support to prove the two properties of Casper-FFG:

- [Acountable Safety](https://eth2book.info/capella/part2/consensus/casper_ffg/#proof-of-accountable-safety)
- [Plausible Liveness](https://eth2book.info/capella/part2/consensus/casper_ffg/#plausible-liveness)

A checkpoint can only finalised if its direct child is a justified checkpoint. More in detail, in [eth2 book](https://eth2book.info/capella/part2/consensus/casper_ffg/#k-finality)

### Slashing

Slashing delivers ***Economic Finality***. The protocol slashes validators that break a commandment.

If $< 1/3$ of validators are adversarial, safety is guaranteed (as with pBFT).

If $>1/3$ of validators acts so as to finalise conflicting checkpoints:

- At least $1/3$ of validators must have broken a commandment.
- The protocol detects the conflict and prove the conflict onchain. Read [this](https://eth2book.info/capella/part3/helper/predicates/#is_slashable_attestation_data)
- The aggregate cost to the attacker would be at $1/3$ of the total staked ETH.
- Thus, we have *economic finality* — a quantifiable cost to messing with finality, even if the attacker has $> 1/3$  of the validators.

Classical BFT algorithms makes no guarantees if $> 1/3$ of replicas are adversarial. It will also halt if $> 1/3$ replicas are offline.

> **Whereas Casper-FFG continuesly tries to justify checkpoints.**

- More about Slashing: read [eth2 book](https://eth2book.info/capella/part2/consensus/casper_ffg/#economic-finality)

## GASPER

GASPER is a combination of the *Finality Gadget, Casper* with the *consensus mechanism, LMD-GHOST*.

So, the coordination between them works as follows: ![](/assets/lec-16/gasper.png)

- LMD-GHOST operates from the finalised checkpoint to the recent two epochs.
- Anything that is behind the finalised checkpoint is *finalised* with Casper and all the branches of the canonical chain can be pruned.

### Modified LMD-GHOST fork choice

Combining both Casper and LMD-GHOST, we do the following;

We apply Casper-FFG's fork choice where ***"we follow the chain containing the justified checkpoint of the great height."***

![modified-ghost](/assets/lec-16/modified-ghost.png)

***The root (genesis) of LMD-GHOST is the highest justified checkpoint decided by Casper-FFG fork choice.***

Although, earlier written that LMD-GHOST operates from the finalised checkpoint. As now finalised was previously justified checkpoint, that means, there is already a commitment to the source → target and hence has commited to never revert the finalised checkpoint.

In `get_head()`, we have a line;

```python
head = store.justified_checkpoint.root
#                     ⬆
#         Apply Casper-FFG fork choice
# And from here the LMD-GHOST fork choice starts to act on...
```

## Gasper in reality
The reality is that the way, LMD-GHOST and Casper-FFG are actually bolted together is ugly.

More on this by Vitalik here: [Paths toward single-slot finality - HackMD](https://notes.ethereum.org/@vbuterin/single_slot_finality#So-why-change-it)

The following issues are:

**Issue 1. Block tree filtering**

`filter_block_tree()` removes any branches with non-viable heads from fork choice consideration.

>**What is a Non-viable Block?**
>
>*A block is non-viable when it's associated state does not agree with `Store` about the current justified and finalised checkpoints.*

The block is associated with state and transitions to the post-state when you run the block. And, it assumes a certain justified and finalized checkpoint.

The issue is — *It may be that that state associated with that block doesn't agree with the state that the view I have of the world* —and so we have to filter it out of the LMD-Ghost Fork Choice, and this leads to **finalization deadlock issue** causing the failure of plausible liveness property of Casper-FFG.

To resolve the conflict, we solve it by removal of blacks with non-viable blocks.

**Issue 2: Unrealised justification and finalisation**

Justification and finalisation accounting is done at the end of each epoch.

However, by slot $21$ ($2/3$ of the way through the epoch), we might have seen enough votes to form a supermajority link: unrealised justification (Because we just accumulated $2/3$ set of validators). Read [link-1](https://eth2book.info/capella/part2/consensus/issues/#unrealised-justification) and [link-2](https://eth2book.info/capella/part3/forkchoice/phase0/#unrealised-justification).


Unrealised justification could be defined as:

1. Justification is updated in the beacon state only at the end of an epoch
2. Filter block tree was too aggressive because it did not account for "unrealised justification".

To simplify,

- Blocks that would match my checkpoints if they had gone through epoch processing.
- Marked as non-viable, while actually being viable, and being removed from the fork choice leading to reorgs.


With the possibility of unrealised justification, there could be possible attacks:

- Unrealised justification reorg attack
- Justification withholding attack

More on these attacks below:

- Read [Available Attestation: Towards a Reorg-Resilient Solution for Ethereum Proof-of-Stake](https://eprint.iacr.org/2025/097.pdf)
- Read [Unrealised justification reorgs](https://eth2book.info/capella/part3/forkchoice/phase0/#unrealised-justification-reorg)
- Read [Justification withholding attack](https://eth2book.info/capella/part3/forkchoice/phase0/#unrealised-justification-deadlock)


#### Questions: Part-3

*Ques.* In single slot finality, how the protocol executes consensus fork?

*Ans.* I don't think we've really thought
through the mechanics of it yet. I suspect that it will get punted to Justin Drake's effort on what used to be called the Beam chain. It is really the next upgrade in
the consensus layer—next massive upgrade—and uses a lot of ZK proofs and so on. So rather than upgrading the live consensus mechanism, we would kind of lift and shift the execution layer again.

---

*Ques.* Do Gasper requires hard fork to make the changes in the protocol?

*Ans.* you don't have to upgrade through a hard fork generally because it doesn't affect the state transition. So you can more or less roll out changes whenever you like.

For example, when we implemented proposer boost, for example, clients rolled it out kind of when they were ready, and just generally, you know, within a few weeks of each other. It did actually lead to a very long reorg because some clients were using proposer boost and some weren't, which doesn't technically break the chain; it's not a hard fork, but caused a certain amount of chaos because long reorgs are not desirable.

So, in principle we *can do uncoordinated upgrades* for Fork Choice and other networking related stuff, but in practice, we try to coordinate them, not as hard forks, but as, you know, ***very tightly coordinated upgrades between the clients*** just so we don't risk having another long reorg.

Phase0 fork choice spec keeps getting updated all the time, as its more or less the current fork choice.

---

*Ques.* If is checkpoint $N$ is justified and later $N+2$ is justified, then what happens to $N+1$? Is it also justified or was left unjustified?

*Ans.* It just doesn't matter. It just sits there. The chain moves on, and we try to justify new epochs, and eventually we'll finalize something, and everything prior is marked as finalized because we're always dealing with the highest justified checkpoint. *Our source vote always comes from the highest justified epoch that we know about*. So we don't care if the previous epoch was justified or not justified; it's just irrelevant to us.

---

*Ques.* Based rollups versus Sequencer-based rollups? Which one you prefer and why?

*Ans.* I'm too fresh for my optimism experience to be objective about this; I need to spend more time looking into the whole base rollups and native rollups and all of that scenario, so I'm going to dodge that question.

*Ques.* There are many implementations of the consensus client, but what they differ mainly is the language that they're implemented in. So is there any other difference in them?

*Ans.* The behaviors cannot differ in any meaningful way from between Prism, Teku, Lighthouse, Lodestar because otherwise it would be a *fork*. They tend to differentiate on things like, amount of disk space used and various other hardware and network optimisations. For example, Teku works really hard on the RPC interfaces so that it could be used by Infura and other RPC solutions so they are super responsive. But base product, **the state transition function**, **the gossip** and all of those things basically remains identical between the clients.

More info on distinct features of each client: [CL clients](https://epf.wiki/#/wiki/CL/cl-clients).

---

*Ques.* Could you share some resource about two-phase commit?

*Ans.* You could refer *pBFT* and *eth2 book*.

It's really, really hard to come up with an example where justification is not the same as finalization. In reality, justification and finalization are almost always going to be equivalent unless you're in an extremely hostile network.

But, in order to guarantee finality, you do need to do this two phases; you need to hear from everybody and broadcast that, then you need to hear from everybody that they heard what you said, and double-check everything.

You can look up [Byzantine Generals Problem](https://lamport.azurewebsites.net/pubs/byz.pdf), the original work by Leslie Lamport.

Also, think about [Blue Eyes Problem](https://xkcd.com/blue_eyes.html): The hardest logic puzzle in the world.

