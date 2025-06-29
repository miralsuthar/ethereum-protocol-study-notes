# Lec-20: Validator Architecture by James He

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day20)

## Overview

This lecture's sole focus is to explain the role of validator clients in performing the protocol duties. The overview includes:

- Purpose
- Context
- Prysm Specifics
- Architecture overview
- Initialization
- Validator Service
- Key management Service
- Performing duties
- RPC Service
- Other services and open considerations

## Sections Timestamp


| Topic                                     | Time  |
| ----------------------------------------- | ----- |
| Introduction                              | 0:00  |
| Agenda and intro                          | 0:59  |
| Validators refresher                      | 3:08  |
| Purpose of Validator Client               | 4:27  |
| High level view of Prysm Validator Client | 6:50  |
| Import config and settings                | 13:21 |
| Registered Services                       | 18:02 |
| Validator Services                        | 21:43 |
| Validator Service Initialization          | 27:45 |
| Wallet (local keymanager)                 | 32:56 |
| Wallet (remote keymanager)                | 38:29 |
| Validator Service continued…              | 43:00 |
| Example: Propose Block                    | 46:46 |
| Keymanager-APIs                           | 52:38 |
| Prysm WebUI                               | 54:10 |
| Conclusion                                | 56:13 |
| Questions                                 | 58:52 |


## Node v/s (Node + Validator)

![node-vs-node-validator](/assets/lec-20/node-vs-node-validator.png)


Often people think that in order to run a node, they require minimum 32 ETH. But that is not true.

An enthusiast can participate to run a node as it is totally free and doesn't require any amount of stake. It constitutes to run 2 pieces of software aka clients:

1. Execution node client (Nethermind, Erigon, Geth, etc.)
2. Beacon node client (Prysm, Teku, Lighthouse, Nimbus)

A stake is useful for a validator. A validator is an entity who stakes their 32 ETH or more (post-Pectra: EIP-7251 MaxEB). But you need a client to manage your validator account which you use to propose and make attestations using your node. This issue of key management is solved by validator accounts.

And a validator client is referred to a client used by validators to import their validator account/s to connect it to the beacon node. Almost all the beacon node clients have a validator client inherited so that a validator can easily start their beacon node in few commands.

## Purpose of a validator client

The purpose of validator client is to have the following features so that it's easier for validators to manage their key stores:

- Import validator keys (single/multiple)
- Backup key store
- Edit the settings of their validator accounts (example. graffiti, fee recipient)
- Sign different messages to perform the protocol duties.
- Remove validator key
- Slashing protection

Protocol duties include:

- Propose blocks
- Attest
- Aggregate
- Sync committee

And to perform all these duties your validator client access the [Beacon API](https://ethereum.github.io/beacon-APIs/).

## Prysm Validator Client

The validator client architecture is not in the consensus-specs. So the duties it performs and some of the functions that it has are part of the consensus specs, but each validator client has different implementations across the client teams.

### High level view

![high-level-view](/assets/lec-19/high-level-view.png)

For more clear image, refer [lecture slides](https://epf.wiki/#/eps/day20).

The diagram above, has two containers:
- Validator (related to the validator-client)
- External (connection of validator-client with external components)

The entry point to the validator-client is `prysm.sh` file (Source code at `prysm/cmd/validator/main.go`).

***This helps boot up the validator client.***

Prysm have separate binaries for the *validator software* and *beacon node software* (Some clients have just one binary and users have liberty to switch between different modes).


***1️⃣ Validator Client***

Validator client is the heart (source) to all the services performed by the client. There are three service major services performed by Validator Client:

1. **Validator Service** (primary service that executes the protocol duties)
2. RPC Service (hosts API that let users talk to the validator client to perform some actions. Two types of APIs: REST, gRPC)
3. **Monitor Service** (Prometheus)

***2️⃣ Storage***

There is another important feature is related to *storage management* of the validator client. ***Wallet*** and ***Database*** (BoltDB) are two components that help store important critical user information i.e. validator keys of the user (in wallet) and protocol duties executed (in database).

***3️⃣ Wallet***

Wallet has its own key store to store the validator accounts who will perform their protocol duties. There are two kinds of key store based on where the client is hosted:

1. **Local Keymanager**: The key is stored locally in wallet directory.
2. **Remote Keymanager**: Use a webhook API through a `web3signer`.

### How the protocol duties are fulfilled by a validator?

1. **RPC Service** calls the beacon node through *Beacon API*.
2. The **Validator service** calls the *RPC Service* to get the latest block to attest to, propose block if told to, etc.
3. The signatures requests are made available to validator service by the **Wallet** using `getKeys/signRequest`.
4. To update any validator related settings, the validator service is required to send request to **Keymanager API** (more info on this later).

## Configuration and settings

**Config types for `params.BeaconChain()`**:
- *Mainnet*
- *Minimal*
- *E2E*

There are **flags** that have the following:

- Proposer settings
- Fee Recipient
- enable Web UI

1. [prysm/cmd/validator/main.go: startNode()](https://github.com/OffchainLabs/prysm/blob/2aa52fb56aa58f02ceb8137ada7d1ec13f4d08cc/cmd/validator/main.go#L38) is the entry point to the Validator Client.
2. `validatorClient, err := node.NewValidatorClient(cliCtx)` indicates the instantiation of a new validator client with `cliCtx` being *context for the CLI flags* provided during command execution.
3. `getWallet` manages the validator keys in the Prysm keystore.
4. `initializeDB` initializes the database that stores the protocol chores and duties (to provide slashing protection) done by the validator.
5. `registerServices` help register the other 3 services i.e. `PrometheusService`, `ValidatorService`, `RPCService`.
6. Finally, once the `node.NewValidatorClient` successfully executes in `startNode()` (see step 1), it starts all the registered services via `validatorClient.Start()`.

## Registered Services

There are three services that are registered during the initialization process.

### Validator Service

`registerValidatorService` initializes the Validator Service executed during the initial configuration in `registerServices`.

1. It initializes keymanager with `InteropKeymanagerConfig` which also helps with interoperability testing.
2. Configures validator graffiti
3. Get `web3SignerConfig` information
4. Get proposer settings (`proposerSettings`)
5. After getting all the required information to setup new validator service, call `NewValidatorService`.
6. Finally, register the service to the service registry with `registerService`.

### RPC Service

`registerRPCService` initializes the RPC Service.

1. If Prysm web UI is enabled via `EnableWebFlag` flag and RPC service is enabled via `EnableRPCFlag` flag, only then create the `RPCService` i.e. go ahead.
2. Get host, port, auth token and wallet directory provided in CLI flags during execution or initial configuration.
3. Add CORS middleware.
4. Initialize `rpc.NewServer` after getting all the necessary info.
5. register the service to the service registry via `registerService`.

### Prometheus Service

`registerPrometheusService` initializes the Prometheus service for monitoring validator activities.

1. Check for if `DisableMonitoringFlag` flag is enabled. Only setup if `False`.
2. Run `prometheus.NewService` with necessary `cliCtx`.
3. register the service to the service registry via `registerService`.

## Validator Service

To understand the responsibilities of validator services, we need to understand `validator/client/runner.go:run()`.

Validator service has a `Start()` (executed during start services after registry) in `validator/client/service.go` which runs `run()`.

This function performs all the validator's protocol duties.

Like added in the comments, the order of operations include:

1. Initialize validator data
2. Wait for validator activation
3. Wait for the next slot start
4. Update assignments
5. Determine role at current slot
6. Perform assigned role, if any

CodeWalkthrough:

- There are two kinds of context, one is main context and the other is deadline based context (for monitoring and reinstantiating for slots, updateDuties on per epoch basis).
- The deadline for the in-function context lasts an epoch i.e. `slot + params.BeaconConfig().SlotsPerEpoch - 1`.
- `SubscribeAccountChanges` is used to monitor  new validator accounts added, or account removed. So, there is enough context to look for protocol duties for only those accounts that are in keymanager.
- PushProposerSettings calls the `prepareBeaconProposer` RPC to set the *fee-recipient* and also the register validator API if using a custom builder.
- The *for loop* (later discussed in detail) keeps on running unless the context is cancelled or context errored.

### Initialization

During the validator initialization i.e. validator starts in `initializeValidatorAndGetHeadSlot`, executes the following funciton;
1. `WaitForChainStart()` to check if the beacon node started.
2. `WaitForKeymanagerInitialization` to check if the wallet keymanager is setup and running and have validator keys.
3. `WaitForSync` to check if the beacon node is synced.
4. `WaitForActivation` to check if the validator key provided in the keymanager is allowed to perform protocol duties (known as active validator).
5. `CanonicalHeadSlot` to get the current canonical head slot. This will help us get the current head slot and a starting point for a validator to perform protocol duties.
6. `CheckDoppelGanger` to check if the same validator key is attesting/proposing to different beacon node. Hence, providing a protection from potential slashing.

- To understand the whole validator lifecycle, read: [Ethereum Validator Lifecycle: A Deep Dive](https://mixbytes.io/blog/ethereum-validator-lifecycle-a-deep-dive)

All these requests and duties are API-based, using beacon APIs to get information and perform tasks. See `validator/client/beacon-api/beacon_api_node_client.go` implementation of Beacon API.

## Wallet (Keymanager)

Refer `type Wallet struct` to understand the info required to create a wallet.

There are three kinds of keymanager:

1. Local Keymanager
2. Derived Keymanager
3. Remote signed Keymanager

A keymanager has the following capabilities:

- PublicKeysFetcher
- Signer
- KeyChangeSubscriber
- KeyStoreExtractor
- AccountLister
- Deleter

The key store looks like a JSON file, matching the JSON files from the deposit CLI.

### Local Keymanager

For the local keymanager, the main entry point is `importKeystores()` in `validator/keymanager/local/import.go`. It is used to import keystores from an external source and in order to do it, following tasks are performed:

1. Copy the in memory keystore
2. Update copied keystore with new keys
3. Save the copy to disk
4. Reinitialize account store and updating the keymanager
5. Return Statuses

Signing the messages are done by `Sign()` in `validator/keymanager/local/keymanager.go`. It caches secret key to memory and uses it to sign `SigningRoot`.

### Remote Keymanager

If validators use a staking service, then if they use local keymanager, it isn't safe for validators to store their keystores locally as the staking service might have the access to it.

Hence, its recommended to use a remote keymanager in such scenarios. It uses webhook to remotely sign different requests.

`Sign()` calls `getSignRequestJson()` that returns a json request based on the SignRequest type. This request is then sent to the remote signer through an API request:

```go
// internal Sign() that resides in
// `validator/keymanager/remote-web3signer/internal/client.go`
signature, err := km.client.Sign(ctx, hexutil.Encode(request.PublicKey), signRequest)
```

## Validator Services: The `for` loop

The `run()` does all the initialization checks and later if all pass successfully, runs a giant for loop.

The Prysm implementation uses *for loop* to perform all the protocol duties and the service runs until the context is cancelled. This might be different in other client implementations. Some might be event driven via subscribing to different events from Beacon API. Some might separate different duties to individual services and run them separately (ex. proposer service, attestation service, etc).

Protocol Duties gets updated in two scenarios:

1. At the start of every epoch
2. At the starting slot when a new active validator connects to perform duties (i.e. in an epoch somewhere in between slots)

Once updated, `performRoles()` help perform different roles based on the `updateDuties()`.

1. ***RoleUnknown*** (ι) means that the role of the validator cannot be determined.
2. ***RoleAttester*** means that the validator should submit an attestation.
3. ***RoleProposer*** means that the validator should propose a block.
4. ***RoleAggregator*** means that the validator should submit an aggregation and proof.
5. ***RoleSyncCommittee*** means that the validator should submit a sync committee message.
6. ***RoleSyncCommitteeAggregator*** means the validator should aggregate sync committee messages and submit a sync committee contribution.

## Proposer Role Example

![validator-proposer-role](/assets/lec-20/proposer-role.png)

Source code for the above diagram: `validator/client/proposer.go:ProposeBlock()`

## Keymanager-APIs

Refer: [Keymanager-API](https://ethereum.github.io/keymanager-APIs/)

## Prysm WebUI

Currently Prysm WebUI is at frozen state because it was assumed nobody uses it but a few percentage are using it.

`serveWebUI()` helps serve the angular frontend.

## Conclusion

Validator client, in summary, is really meant to do two tasks:

1. Manage/use your validator key stores
2. Perform the validator protocol duties.

The architecture might differ among different clients, as there is no consensus specs to manage validator client. It is up to the implementers to decide how you want to organize the architecture and make better informed decisions.

## Questions

*Ques.* Are validator clients compatible with other consensus clients?

*Ans.* We don't currently recommend using the Prism validator client with other clients in production just yet. We've done a lot of things to try to enable REST in our validator client. There are definitely improvements that we're working on, but it was all because of our migration process from gRPC to REST.

---

*Ques.* If you could talk a bit about some of the incentives or potentials for slashing for a validator, to go a bit more into the economics of why you would want to run one, or even how you would be selected as the guy to propose a block?

*Ans.* The beacon node decides  the proposer. From the validator perspective, it doesn't know anything about the incentives or anything like that. It's just being told, hey, go, this is your task now, go perform your duty. In the process of performing your duty, you would go call the beacon API for some more information specific to your validator client. Regarding the slashing, the client do provide slashing protection in case of a validator executing the same duty again.

The validator client should be sort of like a dumb to the protocol design. It should just call the beacon node, and the beacon node will determine all of those other things. The validator client will just give your keys access to performing that particular duty.
