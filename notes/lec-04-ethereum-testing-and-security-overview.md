# Lec-4: Ethereum Testing & Security Overview by Mario Vega

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/week4)

## Overview

This lecture is all about various testing strategies, libraries, and tools used to help scale and upgrade ethereum sustainably w.r.t security. This lecture is all about:

- Importance of testing
- EVM testing
- Consensus Layer testing
- Cross-layer interoperability testing
- Execution API testing
- Ethereum Security
- Live Test Networks


## Sections Timestamp

| Topic                                       | Time    |
| ------------------------------------------- | ------- |
| Introduction                                | 5:30    |
| EVM testing                                 | 11:33   |
| Characteristics of a test                   | 12:40   |
| Tests Filling                               | 21:00   |
| State Testing                               | 23:50   |
| Fuzzing                                     | 27:28   |
| Blockchain Testing                          | 29:22   |
| Ethereum Testing Libraries                  | 36:00   |
| Execution Spec Tests                        | 40:30   |
| Execution Test Demo                         | 50:17   |
| Fuzzy Differential Testing                  | 1:06:33 |
| Execution API Testing                       | 1:07:22 |
| Consensus Layer Testing                     | 1:08:28 |
| Cross-Layer (Execution + Consensus) Testing | 1:10:40 |
| Hive                                        | 1:12:44 |
| Hive: Demo                                  | 1:21:03 |
| Questions                                   | 1:28:43 |
| Live Testnets                               | 1:38:14 |
| Ethereum Security                           | 1:41:30 |
| Ends                                        | 1:50:48 |


## Table of contents

<!-- mtoc-start -->

* [EVM Testing](#evm-testing)
  * [Characteristics of a test](#characteristics-of-a-test)
  * [Test Filling](#test-filling)
  * [State testing](#state-testing)
  * [Fuzzy Differential State testing](#fuzzy-differential-state-testing)
  * [Blockchain testing v1](#blockchain-testing-v1)
  * [Blockchain testing v2: Negative testing](#blockchain-testing-v2-negative-testing)
* [Testing Frameworks](#testing-frameworks)
* [Execution Layer Tests](#execution-layer-tests)
  * [Testing framework for EELS](#testing-framework-for-eels)
    * [EVM t8n](#evm-t8n)
    * [Solc](#solc)
    * [EIPs](#eips)
  * [Ethereum Test of Execution Demo](#ethereum-test-of-execution-demo)
  * [Fuzzy Differential testing](#fuzzy-differential-testing)
  * [Execution API testing](#execution-api-testing)
* [Consensus Layer testing](#consensus-layer-testing)
* [End-to-end (Cross layer) testing](#end-to-end-cross-layer-testing)
  * [Hive](#hive)
* [Live Testnets](#live-testnets)
* [Most common issues to consider when testing](#most-common-issues-to-consider-when-testing)
* [Bug Bounties](#bug-bounties)
* [Public Disclosures](#public-disclosures)

<!-- mtoc-end -->

## EVM Testing

>**Main purpose to TESTING**: ***Verify** if every Ethereum Execution Client and Consensus Client **adheres to the specification**.*

It is extremely important for clients to **return same exact output** given the *same environment, pre-state and hard-fork activation rules* provided its diversity. For more info on client diversity: refer [clientdiversity.org](https://clientdiversity.org)

A different output means a *potential fork* in the chain.

### Characteristics of a test

There are 4 primary components that collectively helps conduct a successful test:

- **Pre-State**: Ethereum represents world state (where everything lives). One can't test the entire Mainnet because it is enormous; the contracts have massive storage & key-value pairs. The focus of testing is on a small-slice of EVM execution. A *“Pre-State”* i.e. a known state before transaction execution is generated & stored to setup testing.
- **Environment**: Txns are surrounded by other txns and an environment i.e. the block. The block contains a lot of information that affects txn outcome. Some examples are: timestamp, `prev-randao`, block number, previous block hashes, gas limit, base fee and hard-fork activation times.
- **Transactions**: Every smart contract creation and execution starts with a transaction. Using pre-state and environment, setting up an interesting transaction to test increasing scenarios for specific EVM executions. Tests with one transaction and multiple transactions to test *specific EVM executions* and *block level functionality testing*.
- **Post-State**: Post executing transaction with a certain pre-state in an environment, the state transition function returns a *Post-State*. It lists accounts and storage values that changed post transaction execution.

Knowing the expected is crucial for writing good tests. These four characteristics encompass the setup and verification process.

>Important considerations while testing:
> - Testing *hard-fork activation times* is extremely important.
> - *Any feature that gets added in a hard fork should only exist after the hard-fork activation time.*
> - For example, blobs should only exist after the `slot`: **14237696** at time 11 March 2024, 18:30:20 UTC.
> - So for testing, for future fork activation times, send a transaction, and verify that the block is correctly rejected by execution clients.

### Test Filling

- It is a crucial process of transforming abstract EVM test definitions into concrete, executable test cases that can be used by all Ethereum clients.
- It bridges the gap between human-readable test descriptions and the machine-executable format required for consistent verification.
- Test source code is written in either JSON or Python depending on the repository. But the output is always JSON.
- Ethereum clients use unit testing to test their execution and consensus clients. Hence, it is crucial it is necessary to make sure that a `filled test` can be consumed by any client.
- Also, unit tests are to be same for every client, because different writing units tests for every client, would lead to different results.
- Hence when filling a test & creating fixtures, *it is important to make sure that execution clients consume the same test to ensure consensus across all clients*.

### State testing

![single-state-test-for-evm-testing](/assets/lec-4/single-state-test-for-evm-testing.png)

- State root is used for verification i.e. $\text{expected state-root 2} == \text{resultant state-root 2}$.
- To simplify, for a given **pre-state** having `state-root 1` and the same transaction, we *expect* the **same** `new state-root 2` from all the clients.
- If any two clients give different state roots, it means one of them or the test itself, is incorrect.

### Fuzzy Differential State testing

![fuzzy-differential-state-testing](/assets/lec-4/fuzzy-differential-state-testing.png)

- Fuzzy testing package for testing EVM implementations: [MariusVanDerWijden/FuzzyVM](https://github.com/MariusVanDerWijden/FuzzyVM)
- Fuzzing tests various scenarios to test the **extremes** of any implementations, *in our case its valid state transitions*.
- It is a variance of Single State testing (last section) with a Fuzzed Smart Contract Code *(which varies)*.
- Since the outcome is now unknown, because it's fuzzed, and its behaviour is stochastic or random.
- The test is to verify if *different clients returns the same state root* with the execution of same transaction to the same fuzzed contract in the same pre-state.
- If it returns different state roots, there is a *problem* in the implementation of *either or both clients*.
- Examining the execution trace helps pinpoint the issue and find bugs.

### Blockchain testing v1

![blockchain-testing-v1](/assets/lec-4/blockchain-testing-v1.png)

- This testing focuses on testing the whole lifecycle, i.e. from *genesis* to *each block propagation*.
- Initially, the setup is:
	- pre-state smart contract balances, code, and storage
	- instantiate the pre-state from genesis block.
	- Feed future blocks with transactions, header values and other required information.
- If every block is correctly validated, and the execution client consumes all blocks, then the *chain head is expected to match* across other clients for the test to be successful.
- The basic idea is *all blocks were consumed because the client is correct*.

### Blockchain testing v2: Negative testing

![blockchain-testing-v2](/assets/lec-4/blockchain-testing-v2.png)

- This version of blockchain testing if more important to check if the invalid blocks not alter the post-state in the execution client.
- Similar to V1 setup, but the only difference is; we *intentionally* add an **invalid block** (either due to faulty transactions or headers, etc.) and expect the post-state to not alter due to the invalid block.
- It's crucial to always ensure the test is **correctly designed**.

> It's easy to write a test and assume it's correct. If you think its incomplete then **enhance** it, because *if the client passes the test, the fault will remain undetected*.

## Testing Frameworks

- [ethereum/tests](https://github.com/ethereum/tests)
- [ethereum/retesteth](https://github.com/ethereum/retesteth)
- [ethereum/execution-spec-tests](https://github.com/ethereum/execution-spec-tests)

All the tests are maintained in `ethereum/tests`. The test source files are simple `JSON` or `YAML`.

The tests contain pre-state, storage, code and smart contracts.

It provides simple parametrization i.e. simple and organized way to set up multiple transactions on the same pre-state and expect different outcomes.

Filler tests are written in `retesteth` (C++). It consumes the JSON, calls `geth` to fill a test, and provides a *fixture* that every client can consume. With the fixture, you can look for any invalidity in any client.

`Execution-spec-tests` leaps a step forward towards *flexible testing* and provides *secure testing* while tinkering with integration of new EIPs. It uses `pytest` to provide simple to complex parametrization.

EELS (`execution-specs`) will serve as the actual client implementation in the future.

## Execution Layer Tests

As previously mentioned, **tests** can be *created for each EIP or several EIPs*, or many for *various forks*.

It works in blend with `EELS` to provide a quick feature testing.

When you run the python tests i.e. `EEST`, it is important to know about these three puzzle pieces:
1. `evm t8n` external executable (very important)
2. `solc` external executable (somewhat important)
3. EIPs (Add-on to ease experimentations)

### Testing framework for EELS

#### EVM t8n

> [Geth: t8ntool](https://github.com/ethereum/go-ethereum/tree/master/cmd/evm/internal/t8ntool)

There is no existing EVM client in python, hence to execute a transaction with execution client's logic, we use a spawn `geth` sub-command i.e. `evm t8n`.

`evm t8n` takes in a pre-state, transaction and environment and outputs the execution result, including each transaction's execution.

#### Solc

`Solc` is a solidity compiler that compiles solidity code to bytecode which the `evm` executes during `state transition function`. Usually, the tests written to test EVM opcodes are often in bytecode. Solidity contracts are only used for complex code that cannot be easily written with bytecode.

>***Note***: Although Solidity is an excellent DSL for smart contracts, but often solidity optimizations can make tests unreliable hence are often ignored during the test of EVM opcodes.

#### EIPs
It is crucial to *preserve EIP ideas in the test source code*. This safeguards against testing an outdated EIP version. If the EIP changes and execution client implements a new version, causing test failures, then it is easier to pinpoint an EIP version that caused such an incident.

The **output** is another crucial piece of testing as we get all our insights from here. The fixtures are readable JSON fiels representing the test output. They are in three formats:
1. the state tests (transaction specific)
2. blockchain tests (entire blockchain)
3. Hive format (discussed below)
If any result differs or the client can't consume the fixture, then it indicates as an *error*. This is procedure to find bugs in execution clients.

### Ethereum Test of Execution Demo

> For demo, refer [ethereum/execution-spec-tests](https://github.com/ethereum/execution-spec-tests) and 50:17 timestamp of the lecture.
> The example discussed is in `tests/frontier/opcodes/test_dup.py`

### Fuzzy Differential testing

There are two main important tools that complements each other for fuzzy differential testing:
1. *Fuzzy EVM*: creates fuzzy test code
2. *GO evmlab*: execution test environment written in `golang`.

In order to execute fuzzy test:
1. Generate fuzzy code via `Fuzzy EVM`.
2. Use generated code as input for `evmlab` to create fixtures that is used to run against different clients to check for differences.

### Execution API testing

Execution API tests exist in the same repository as the specifications i.e. [ethereum/execution-apis](https://github.com/ethereum/execution-apis). Each RPC directive has one-two tests.

## Consensus Layer testing

- [ethereum/consensus-spec-tests](https://github.com/ethereum/consensus-spec-tests): Conformance tests built from the executable python spec.
- [consensus-specs/tests](https://github.com/ethereum/consensus-specs/tree/dev/tests): Test source code regarding the consensus specification.

## End-to-end (Cross layer) testing

Cross layer testing involves testing a full instantiated client, feeding information to it and verifying the correctness of its behavior.

Tools:
- [ethereum/hive](https://github.com/ethereum/hive)
- [ethpandaops/assertoor](https://github.com/ethpandaops/assertoor)
- [ethpandaops/ethereum-package](https://github.com/ethpandaops/ethereum-package)

### Hive

>An end-to-end test harness of Ethereum.

Hive is a framework that gives testers a way of
*spawning tests* and *clients inside tests*—namely, execution and consensus clients.

It is testing environment to test a particular edge cases that are to be tested in simulators.

![Hive](/assets/lec-4/hive.png)

>Hive Server is the main orchestrator.

There are three actors involved:
- *Hive Server*
- *Execution or Consensus Client*
- *Simulator*: a program containing certain instructions to run the test.

Following are the steps to perform a test on a Hive server:
1. Build and start the `Hive` server.
2. Tell it to instantiate a given simulator.
3. The simulators communicates with the Hive in order to start the test
4. Starts a test, starts a client, performs calculations (i.e. performs the test)
5. Notify the Hive server regarding the status of the test if it passes, fails or aborts along with end the client.

A single simulator can start many tests and clients in parallel and orchestrate many scenarios for the execution and consensus CLIs.

The Hive format contains the *engine API directives from the consensus client*, ensuring test scenarios are tested as if running on a real blockchain. Mainnet's large state is a difference; our tests use much smaller states for manageability.

>Hive server abstracts the client setup during the test environment setup.

## Live Testnets

There are various types of live tesnets:
1. **Devnets**: Limited node count that are used to verify proof of concept or early stages of hard-forks.
2. **Shadow-forks**: Limited node count forks that are configured to follow Ethereum mainnet, but have an early hard-fork configuration in order to test real network activity. More info on [shadow-forks](https://github.com/timbeiko/eth-roadmap-faq/blob/hackmd/README.md#shadow-forking).
3. **Public Testnets**: Sepolia, Holesky

## Most common issues to consider when testing

Execution Layer side:
- *Valid invalidation*: client invalidates a block that fully complies with Ethereum specs
- *Invalid validation*: client validates a block that does not comply with Ethereum specs
- *DoS during block execution*: client takes too much time to process a block due to a transaction

Consensus Layer side:
- Faulty clients and finalization based on faulty node majority scenarios:
  - *<33%*: based on faulty node majority scenarios can cause missed slot but chain will still finalize
  - *33%+*: can cause delayed finality
  - *50%+*: can disrupt forkchoice
  - *66%+*: can finalize an incorrect chain

## Bug Bounties

[Ethereum Bounty](https://bounty.ethereum.org)

## Public Disclosures

[Ethereum: Public Disclosures](https://github.com/ethereum/public-disclosures)
