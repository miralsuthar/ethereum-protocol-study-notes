# Lec-10: Consensus client Architecture by Paul Harris

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week8-dev)

## Overview

This lecture focuses on Besu, a consensus client developed and maintained by Consensys. The overview includes:

- Introduction
- Consensus Layer Overview
- Teku Client
- APIs
- EIP implementation process
- Performance consideration
- Getting involved
- Database Engine
- Development Challenges
- Dependency injection
- Java Features

## Sections Timestamp


| Topic                                                      | Time    |
| ---------------------------------------------------------- | ------- |
| Introduction                                               | 4:03    |
| High Level Overview of CL                                  | 7:53    |
| Rules                                                      | 9:43    |
| Teku                                                       | 10:51   |
| Question                                                   | 13:45   |
| Teku Module Layout                                         | 15:55   |
| APIs                                                       | 17:36   |
| TypeDef Example: PostAttestation                           | 23:13   |
| Question: Common library between Teku & Besu               | 29:00   |
| TypeDef Example: PostAttestation (continues)               | 32:27   |
| TypeDef Example: GetBlockRoot                              | 36:56   |
| EIP prototyping                                            | 42:41   |
| EIP-7251                                                   | 44:53   |
| Question: What Database engine does Teku use?              | 1:04:30 |
| Question: What is most challenging part of developing Teku | 1:06:41 |
| Approaching performance issues                             | 1:14:56 |
| How do I become a core dev?                                | 1:20:00 |


## Table of contents

<!-- mtoc-start -->

* [At High Level](#at-high-level)
  * [Rules](#rules)
* [Overview of Teku](#overview-of-teku)
* [Teku Module Layout](#teku-module-layout)
* [APIs](#apis)
* [`Post Attestation` Example](#post-attestation-example)
* [`GetBlockRoot` Example](#getblockroot-example)
* [EIP prototyping](#eip-prototyping)
  * [Example: EIP-7251](#example-eip-7251)
* [Planning and Ownership of features (EIP implementation)](#planning-and-ownership-of-features-eip-implementation)

<!-- mtoc-end -->

## At High Level

A Consensus client has no. of driving components:
- Consensus specs
- Execution API - interface to Execution Layer
- Standard REST APIs
  - Beacon API (produce blocks, submit blocks, etc.)
  - Keymanager-API (create & manage validator keys)
  - Builder API (building blocks; builders extract MEV and use this API to communicate with proposers)
  - Teku currently doesn't implement light client

### Rules

- Consensus and Execution, both layers define open specifications. The interactions are fairly well-defined. There are rules but there are grey areas as well.
- CL uses tests that are written for the specs and can be run on all implementations to test if they abide by all the rules.

## Overview of Teku

- Written in Java
- Client of choice for institutional stakers
- Fairly extensive metrics w/ Prometheus & Grafana
- Focus on testing (unit, integration, system)
- Relatively clear logging
- Maintain 1 code-stream generally aka (master dev) & release frequently
- well documented, open source
- Consensys uses Teku (Node operators).


*Ques.* What is the reason Teku doesn't implement the light client API?

*Ans.* It's been an issue with not having many resources since journey of Teku began. Initially there were 2 developers, so there was just no capacity. Now, there are seven, which is enough to keep up but not enough to go leaps and bounds over. The aim is stick to the business statements we aim for, but it would be nice to be spec complete as well.

## Teku Module Layout

![module-layout](/assets/lec-10/module-layout.png)

*The upper layer can consume all the bottom ones* but the vice versa is false.

## APIs

![api](/assets/lec-10/api.png)

## `Post Attestation` Example

`PostAttestation` — submit a signed attestation to the beacon-node.

The implementation for the same exists in `teku/beaconrestapi/handlers/v1/beacon/PostAttestation.java`, where the `handleRequest()` after requesting attestations, sends an asynchronous response with `provider.submitAttestation()`.

Test for the same is at the same location: `PostAttestationTest.java`.

Definition Tests exists at `teku/beacon/restapi/beacon/paths/_eth_v1_beacon_pool_attestations.json`. The definition is
really important to get right hence the test. Using JSON schema so that tests can reference that JSON schema to be able to validate that we haven't changed things or at least show us when we have changed things. Simple & effective.

The response is 200, 400 & 500, based on if the test passed, failed (along with reasons).

*Ques.* Are there any common libraries among Besu and Teku?

*Ans.* The main one is around Prometheus. Base libraries are shared among both the clients.

## `GetBlockRoot` Example

Get the root of a block, plus some other attributes.

Source code: `teku/beaconrestapi/handlers/v1/beacon/GetBlockRoot.java`
Test:
`GetBlockRootTest.java`
Definition Test: `teku/beaconrestapi/beacon/paths/_eth_v1_beacon_blocks_{block_id}_root.java`

> The documentation for the BeaconAPI: [Docs](https://consensys.github.io/teku/#tag/Beacon/operation/getBlockRoot)

> [Teku Beacon API Docs](https://consensys.github.io/teku)

## EIP prototyping

Prototyping is a crucial component to improvements to ethereum protocol.

Making an EIP actually fit into the spec is a very difficult endeavour. Explicitly define actual EL/CL interactions.

### Example: EIP-7251

[EIP-7251: Increase the MAX\_EFFECTIVE\_BALANCE](https://eips.ethereum.org/EIPS/eip-7251)

There was a desire to reduce initial penalty. Once max balance scales up, initial penalty would be 64 ETH.

$$\begin{align} 1~ ETH~penalty \quad : \quad 32~ETH~staked \\ 64~ ETH~penalty \quad : \quad 2048~ETH~staked \end{align}$$

It's *linear scaling*, so in some world, you could argue that that's fair.

But the reality is, if a node operator were to have 64 validators on a box and one of them gets an `addStation` slashing, the rest could be perfectly fine for a period of time, depending on which slot they're attesting to.

We could turn that node off, and I would have only been slashed for one validator or a few validators. In the case of consolidating all of that into a single validator, I would have incurred 100% of the penalty when previously I would have only incurred a small percentage.

Another interesting case of whistleblower reward, is when someone gets slashed, the reporter (could be proposer or third party) gets rewarded with 4 ETH for reporting evidence of wrong doings. But another problem arises, you are minting 4 ETH for every wrong doings happening. Refer `slash_validator()` in consensus-specs.

```python
whistleblower_reward = Gwei(validator.effective_balance // WHISTLEBLOWER_REWARD_QUOTIENT)
# 4 ETH = 2048 // 512 (Post Max-EB)
```

We don't want to mint ETH and disturb the crypto-economics of mint-burn pattern. More on this on [ultrasound.money](https://ultrasound.money/)

Alternative solution: reward to be covered by the initial penalty.

>Implementations of new EIPs go to `_features` folder in [ethereum/consensus-specs](https://github.com/ethereum/consensus-specs).

- `is_eligible_for_activation_queue`: a function that's having a look at a validator object and determining whether it
is able go into the activation queue to become an active validator.
- `getMaxEffectiveValidatorMaxEffectiveBalance`:  check the withdrawal credential prefix.

*Ques.* What is the database engine that TEU uses currently?

*Ans.* When started at genesis, using *RocksDB* only. Later switched to **LevelDB** due to issues upgrading RocksDB. Now, *LevelDB* is not being actively maintained, hence considering switching back to RocksDB.

*Ques.* What is the most challenging part of developing Teku?

*Ans.* Storage. The database storage doesn't change very often, so what you get with that is basically the tests aren't heavily—heavily
understood.

## Planning and Ownership of features (EIP implementation)

- From a team perspective, we allocate a project (feature/eip) to an owner
- Break the project down into chunks (create github issues)
- Present an overview to the team
- Keep up with developments and testnets
- May or may not implement the whole feature depending on size
