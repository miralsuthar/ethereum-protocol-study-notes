# Lec-6: EL & CL Technical Specs by Hsiao Wei Wang and Sam Wilson

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week6-dev)

## Overview

This lecture provides an overview on:

- Ethereum Consensus Specs
- Ethereum Execution Layer Specs (EELS)

## Sections Timestamp


| Topic                                                             | Time    |
| :---------------------------------------------------------------- | :------ |
| Introduction of Hsiao Wei and to Consensus Spec                   | 2:00    |
| Executable Consensus Pyspec                                       | 4:44    |
| Adding new features                                               | 6:52    |
| Type and Values Definition                                        | 11:18   |
| SSZ Containers                                                    | 12:16   |
| Python Pure Functions to showcase functionalities                 | 13:16   |
| Other useful resources                                            | 14:10   |
| Elf                                                               | 14:36   |
| How to use Pyspec                                                 | 16:40   |
| Pyspec as the test vector generator                               | 19:18   |
| How to contribute to pyspec?                                      | 21:12   |
| Question: How CL interacts with EL to propose new blocks?         | 22:22   |
| Question: tests related to Chain Reorganizations                  | 27:02   |
| Question: Most challanging part while building consensus-specs    | 32:00   |
| Introduction of Sam Wilson and to Execution Client specs          | 34:40   |
| History: The Yellowpaper                                          | 38:25   |
| Problems with yellowpaper                                         | 41:48   |
| EELS                                                              | 43:29   |
| Questions: How was the experience to run EELS python node client? | 51:16   |
| Questions: Where to find new or upcoming hard-forks               | 52:40   |
| Questions: Missing parts of EELS (fork-choice, Engine API)        | 53:10   |
| EELS fact                                                         | 54:14   |
| Questions: Most challenging part of building EELS                 | 55:08   |
| Demo of EELS                                                      | 56:30   |
| End                                                               | 1:05:10 |


## Table of contents

<!-- mtoc-start -->

* [Consensus Specs](#consensus-specs)
  * [Adding new feature patch](#adding-new-feature-patch)
  * [Python is a readable language](#python-is-a-readable-language)
  * [Reading the Spec](#reading-the-spec)
    * [`_feature`](#_feature)
    * [Hardforks folder](#hardforks-folder)
  * [SSZ Containers](#ssz-containers)
  * [Elf](#elf)
  * [How to use Pyspec?](#how-to-use-pyspec)
    * [Pyspec as the test vector generator](#pyspec-as-the-test-vector-generator)
    * [How to contribute to pyspec?](#how-to-contribute-to-pyspec)
  * [How reorgs are handled by CL? (How to effectively use specs to learn or for reference)](#how-reorgs-are-handled-by-cl-how-to-effectively-use-specs-to-learn-or-for-reference)
* [Ethereum Execution Layer Specs (EELS)](#ethereum-execution-layer-specs-eels)

<!-- mtoc-end -->

## Consensus Specs

Repo: [ethereum/consensus-specs](https://github.com/ethereum/consensus-specs)

Consensus specs has a license CC0-1.0 license, open source python project.

There are *three core* importance of the consensus spec repository:
1. It's a collection of ethereum core *consensus specifications*
2. It's *executable* and *verifiable*
3. It's *test vector generator*

### Adding new feature patch

1. Implement new feature in Pyspec markdown files. For example: Pre-deneb upgrade, there exists a feature folder for EIP-6110 with files inside (includes spec information, test vectors, etc.).

2. Release new pyspec with test vector suite. Also, the test vectors are generated with the spec program. It helps find basic bugs before the next step of client implementation.

3. CL clients implement and test against test vectors.

### Python is a readable language

Hence, used for pseudo code. Simple pseudo code is simple to understand and readable. Python is the best template for pseudocodes (potentially executable).


### Reading the Spec

**Folder structure**:

#### `_feature`

*Work in progress* (WIP) research projects.

#### Hardforks folder

Specs of already launched hard-forks and the changes they induce to the protocol.

Let's understand `Phase0` (genesis of beacon chain) which has mostly all the initial specifications of Beacon chain:
- `beacon-chain.md`: **Entry point to Beacon chain consensus** (read this from head to toe)
- `deposit-contract.md`
- `fork-choice.md`
- `p2p-interface.md`
- `validator.md`
- `weak-subjectivity.md`

Future hard-forks will have more components than the ones mentioned above.

>While reading `beacon-chain.md`, refer *types and values definitions* first, in order to familiarize with various coefficients and variables. Some of the headers involve: `Notation`, `Preset`, `Constants` and `Configuration`.

### SSZ Containers

SSZ is the serializes the data that is on the Beacon chain. It relies on a schema that must be known in advance. More information:

1. [Simple serialize](https://ethereum.org/en/developers/docs/data-structures-and-encoding/ssz/)
2. [consensus-specs/ssz/simple-serialize.md](https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md)

`BeaconBlock` use `BeaconBlockBody` in the `block` field. The classes are SSZ containers that use the serialization schema for the consensus objects.

Other useful resources to understand CL:
1. [Vitalik Buterin's Annotated Spec](https://github.com/ethereum/annotated-spec)
2. [Ben Edgington's Eth2 Book](https://eth2book.info)

### Elf

Although the specs are markdown files, there exists some magic that help convert *python source code into markdown files*. The tool is **Spec Elf**.

Also, the specs are built on top of previous hardforks. For example:

>*phase0* (the base of spec) -> *altair* (upgrade & enhnancements included in the new spec file)

### How to use Pyspec?

Install from source i.e.

1. `git clone https://github.com/ethereum/consensus-specs`

2. `make install_test && make pyspec`

#### Pyspec as the test vector generator

The power of pyspec lies in it being used to generate tests and [test vectors](https://en.wikipedia.org/wiki/Test_vector).

The process to generate test vectors is to use the magical phrase `yield`. With `yield`, the spec will output a file with `.ssz` i.e. ssz-encoded data.

For example, `test_empty_block_transition(spec, state)` has:
>- `yield 'pre', state`: create a test vector for pre-state
>- `yield 'blocks', [signed_block]`: create a test vector for signed blocks.
>- `yield 'post', state`: create a test vector for post-state

All the test vectors are synced to `ethereum/consensus-spec-tests`

#### How to contribute to pyspec?

1. Look through the specifications files to learn about the specifications logic and help review it
2. Help refactor the codebase
3. Try to hack some new edge test cases
4. Submit to [bug bounty](https://ethereum.org/en/bug-bounty)

### How reorgs are handled by CL? (How to effectively use specs to learn or for reference)

The fork-choice handles the behavior of addtion to new valid blocks, new attestations, reorgs, etc.

Before understanding reorgs lets understand the lifecycle of fork-choice;
1. `Store`
2. `store.justified_checkpoint`
3. `update_checkpoint`
4. `get_head` fetches `store.justified_checkpoint`

## Ethereum Execution Layer Specs (EELS)

Repo: [ethereum/execution-specs](https://github.com/ethereum/execution-specs)

Yellowpaper is the first specifications written by Gavin Wood and Vitalik Buterin. It is the mantra to the internal working of ethereum for clients.

Ethereum Execution Layer Specs (EELS) focuses on
> state transition function (new block valid, what is new state)

EELS is written in python, executable, optimised for readability.

A great playground for prototyping new EIPs.

>Research <------EELS-----EEST-------> Client Implementation

([EEST](https://ethereum.github.io/execution-spec-tests/pr-929-preview/library/cli/))

**Another important point to note:**

1. Every hardfork has its own source code. Hence, there will be a lot of duplications of code with an upside to better readibility.

2. EELS also provide git-like diffs to showcase the changes made across each hardfork. View it [here](https://ethereum.github.io/execution-specs/diffs/index.html)

3. It uses t8n tool (Geth) to execute transactions for a provided pre-state that generates a post-state (as there is no python implementation of ethereum).

4. [Network-upgrades](https://github.com/ethereum/execution-specs/tree/master/network-upgrades) folder provides all the EL clients (geth, nethermind, besu, etc.) implementation PRs for every EIP.

EELS is pretty much straightforward repository to understand EL via pseudocode and test cases.

