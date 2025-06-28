# Lec-17: EVM by Pawel Bylica

More info about lecture: [EPF.wiki](https://epf.wiki/#/eps/day17)

## Overview

- Purpose & Context
- Ethereum State (EVM view)
- Virtual Machines (General Concept)
- EVM specifics
- EVM Operation
- Unique features
- EVM Memory Types
- EVM evolution: EVM Object Format (EOF)

## Sections Timestamp


| Topic                     | Time    |
| ------------------------- | ------- |
| Introduction              | 0:00    |
| Agenda                    | 2:41    |
| Ethereum State Transition | 4:19    |
| Accounts Duality          | 10:12   |
| Questions                 | 12:19   |
| What is Virtual Machine?  | 14:40   |
| EVM                       | 20:49   |
| EVM Design Goals          | 22:22   |
| EVM interpreter steps     | 24:13   |
| Instructions overview     | 27:33   |
| Questions                 | 29:45   |
| Internal calls            | 41:12   |
| EVM memories              | 48:08   |
| Gas metering              | 52:05   |
| Questions                 | 1:03:37 |
| EOF                       | 1:12:15 |
| Questions                 | 1:23:55 |


## Table of contents

<!-- mtoc-start -->

* [Ethereum State Transitions](#ethereum-state-transitions)
* [Accounts duality](#accounts-duality)
  * [1. EOA (externally owned account)](#1-eoa-externally-owned-account)
  * [2. Contracts (passive code)](#2-contracts-passive-code)
* [Virtual Machine](#virtual-machine)
  * [VM Architecture](#vm-architecture)
* [EVM](#evm)
* [EVM Interpreter Steps](#evm-interpreter-steps)
* [Instructions overview](#instructions-overview)
* [Questions: Part-1](#questions-part-1)
* [Internal calls](#internal-calls)
* [EVM memories](#evm-memories)
* [Gas Metering](#gas-metering)
  * [ADD (0x01)](#add-0x01)
  * [CALLDATACOPY (0x37)](#calldatacopy-0x37)
* [Questions: Part-2](#questions-part-2)
* [Ethereum Object Format (EOF)](#ethereum-object-format-eof)
  * [Control Flow in EVM](#control-flow-in-evm)
* [Questions: Part-3](#questions-part-3)

<!-- mtoc-end -->

## Ethereum State Transitions

The two main components of Ethereum that glues with EVM is to explain:
- What is executed? ***Transactions***
- Where it actually is? ***State***

![state-transitiion](/assets/lec-17/stf.png)

- $State = \text{collection of accounts}$
- $address ⇒ account$ (map)
- $Account$:
  - `balance`: 256-bit number (ETH amount)
  - `nonce`: 64-bit number
  - `code`: bytes
  - `storage (key ⇒ value)`: 32-bytes ⇒ 32-bytes
- *Commitments* (EVM does not care about it, mostly related with the higher level)

## Accounts duality

### 1. EOA (externally owned account)

- `balance`
- `nonce`

### 2. Contracts (passive code)

- `balance`
- `codehash`
- `storage`
- `nonce`

> *Contracts by design are passive code*. So, until an EOA initiate a transaction on a particular contract, contracts can't execute transactions on their own.

## Virtual Machine

With context to Ethereum, virtual machines are not related to cloud/system virtual machines (emulates physical machine and sits on top of native OS).

Ethereum adopts process/application virtual machine (managed runtime environment). Examples are: JVM, .NET, WebAssembly.

![programming-languages](/assets/lec-17/different-languages.png)

**"Classic" programming languages** like C/C++; each language is processed by its own specific compiler. The output of this compilation process is then directly targeted and executed on various distinct Hardware/OS Architectures, implying that the code must often be recompiled specifically for each different underlying system it needs to run on.

**"Managed" programming languages** like JVM, .NET; shows that code from different languages is first compiled by their respective compilers into an *intermediate form.* This intermediate code is not directly run by the hardware/OS; instead, it is *executed by a common Virtual Machine (VM)*, which then interfaces with the various underlying Hardware/OS Architectures, allowing the *same compiled code to run across different systems as long as the VM is available*.


### VM Architecture

The resources (infinite) are organized into different structures. And based on the resources, VM architectures are divided based on two categories:

- **Stack based**: "infinite" stack, shorter instructions (form of bytecode). Example: JVM, .NET, EVM, WASM
- **Register based**: "infinite" registers, longer instructions. Example: Lua-VM, Dalvik-VM

Stack based VMs are easier to implement and to work with because the encoding of instruction usually fits into a single byte.

In Register based VMs, you mostly need to include which are the input registers and in which register the result will end up.

## EVM

- *stack-based* virtual machine.
- *bytecode*; every instruction is one byte.
- has *big stack items*; more than the native hardware actually supports.
- *No validation*; produce deterministic results on any sequence of bytes
- *many memories*
- *exotic instructions*

Important info related to EVM:

- EVM is a *256-bit stack based virtual machine*.
- Each item pushed onto the stack is of 256 bits (32 bytes) in size. If a smaller value (like a single byte) is pushed, then it gets padded to convert it into a full 32-byte value on the stack.
- A stack can withhold *maximum of 1024 items*.
- Native hardware typically support smaller bit size; e.g. 32-bit or 64-bit.
- Comparatively size of EVM stack items are significantly larger than normal CPUs directly handle as a *fundamental unit of arithmetic operations*.
- Hence, EVM must **"emulate"** in order to perform certain operations. This means that calculations involving these large 256-bit numbers are broken down into a series of smaller operations that the underlying hardware can perform.
- This design choice in the EVM facilitates operations like Keccak256 hashing and elliptic-curve cryptography, which work well with 256-bit numbers.


For more info:

- Read [EVM Codes - About the EVM](https://www.evm.codes/about) to get more information about the EVM.
- Read [EVM Design Rationale](https://ethereumbuilders.gitbooks.io/guide/content/en/design_rationale.html#virtual-machine)

> 256-bit values are 4 times the size of native hardware support. Hence, emulate 256-bit arithmetic in software.
>
>***Reason:*** Blockchains heavily rely on secure hash functions, and the hash functions usually have 256 bits of output.

## EVM Interpreter Steps

Most of the implementations of EVM that are publicly known are ***interpreters***.

>Fundamentally, there is a loop that goes over every instruction and tries to execute what's encoded in the instruction.

But, the aim of EVM is to maintain its *execution efficiency*. More work is done before executing the instruction:
- check if the next instruction even exists.
- no validation step; hence perform pre-checks for a valid execution of the instruction. Some example of pre-checks are:
  - stack underflow
  - stack overflow
- gas cost calculation for executing the particular instruction
  - perform out-of-gas check (to check if the user paid enough gas to complete the transaction)
- Do the actual work.

## Instructions overview

- Refer [evm.codes](https://evm.codes/) to know more about all the instructions.

## Questions: Part-1

*Ques.* Currently, EVM works on 256-bit instructions, but there are some research proposals that suggest 384-bit instructions using BLS12-381. Are there any EVMs out there that actually aiming to adopt [EVM-384](https://ethereum-magicians.org/t/evm384-feedback-and-discussion/4533)?

*Ans.* There are some cryptographic primitives (in form of precompiles) in Ethereum that use values other than 256. Examples are: `alt_bn128` point addition, scalar multiplication and bilinear function on groups.

The abstraction of EVM provides a range of values between $[0, 2^{256} - 1]$.

EVM always has the same value size in different blockchains, but sometimes it's *not a natural value*. In case of zkEVMs, natively has a bit lower limit of arithmetic related to the said finite fields. Hence, these zkEVMs try to mitigate that by providing different programming languages where the *natural value is actually different from the EVM natural value*.

---

*Ques.* As mentioned earlier that mostly all operations are one-byte length. So what does it mean for a push operation to be greater than one byte? Does that mean it overflows into the next location in the stack?

*Ans.* The `PUSH` instruction kind of breaks this abstraction. EVM always checks the next
byte to know what to do with it.

The `PUSH` instructions are kind of different. They will actually have some *payload* after this single byte that describes the instruction. The next time the interpreter loops from the start, it can safely read one byte and then decode it at the next instruction.

---

*Ques.* Why EVM is fundamentally interpreter language and not compiled?

*Ans.* There are multiple answers to this; but the gist of all of them is: **it's hard**.

One of the first Pawel's projects was to actually write a just-in-time (JIT) compiler for EVM. It was almost impossible because of the control flow that the instructions, EVM has.

Although, EVM is very simple, but it has kind of unconstrained control flow instructions which are not really compatible with translation and compilation.

There are some constraints where we expect not properly behaving inputs. Because everyone can deploy the bytecode on a blockchain, as its permissionless and there's no validation. You have to be prepared for really awkward edge cases if your compilation pipeline is too complicated.

Hence, interpreted route seemed more logical due to current situations and limitations.

## Internal calls

- Smart contracts on the blockchain are analogous to *programs stored in a file system*.
- Users can initiate these programs.
- With internal calls, one smart contract can directly call and execute another smart contract on the blockchain. This interaction occurs within an *isolated EVM environment*.
- When one contract calls another, the called contract runs in an isolated "container" or a "new instance of EVM". The called contract has its *own* separate memory, stack, and private storage. The calling contract cannot directly see what's happening inside the called contract during its execution.
- EVM has multiple instructions to make calls:
  - `CALL`
  - `STATICCALL`
  - `DELEGATECALL`
- `STATICCALL` is similar to call, but the called contract cannot make any changes to the Ethereum state. It can only read data and return information.
- Call instructions have the following parameters:
  - `address`
  - `gas`
  - `value`
  - `input`
- The result of the call instruction is;
  - return data
  - remaining gas (the unused gas is returned to the calling contract)
- Implementing internal calls is one of the most complex aspects of the EVM due to details like pre-checks and post-checks. But, despite its complexity, this feature makes compossibility among contracts relatively straightforward for developers.
- There are also EVM instructions to create new accounts with new contract code: `CREATE`, `CREATE2`

- Read [Mastering Delegatecall in Solidity: A Comprehensive Guide with EVM Walkthrough \| by Oluwatosin Serah \| Medium](https://medium.com/@ajaotosinserah/mastering-delegatecall-in-solidity-a-comprehensive-guide-with-evm-walkthrough-6ddf027175c7) to understand `DELEGATECALL`

## EVM memories

Various categories of memories in EVM:

- **stack**: instruction operands
- **memory**: main volatile memory. Infinite memory, but limited by gas resources.
- **calldata**: input data (read-only)
- **return data**: output from sub-calls (read-only)
- **storage**: persistent key-value storage

![lifecycle of calldata across contracts](/assets/lec-17/calldata-lifecycle.png)

> **Data from the transaction itself can put as txn calldata (the top-level execution of calldata).**

## Gas Metering

The unique thing that makes EVM Turing complete is its gas mechanism. *Gas limits execution time.*

> - Subtract gas from the gas counter, consumed by a particular transaction.
> - Each instruction subtracts a value.
> - If it reaches zero, execution runs out of resources and terminates with failure.
> - Consequently, any state modifications or observable effects are reverted up to Warmups and logs.

Gas managements happen on different levels:

1. Internal call
2. transaction
3. block

When sending a transaction, gas limit has to specified based on the cost of the transaction. Wallets do the transaction cost estimation for successful execution.

There are gas limits on two levels:

1. Transaction level (each transaction has a gas limit)
2. Block level (each block has a gas limit)

Each instruction cost a certain amount of gas. It is either:

1. *constant*
2. *involves complex formula to calculate gas*

This makes the gas multi-dimension, in various scenarios the gas differs based on the input and the instruction applied on that input.

For example, pushing a new constant value with the push instruction on the EVM stack costs three gas units. Whereas, the exponent instruction, which computes the exponent of two values, has a cost depending on the exponent's length because it's not a constant-time implementation.

### ADD (0x01)

- pop two items (256-bit) from stack
- add them (256-bit)
- push result to stack
- gas cost: 3

### CALLDATACOPY (0x37)

- pop 3 items from stack
  - calldata offset
  - memory offset
  - size (number of bytes)
- copies part of calldata to memory
- gas cost (quadratic):
  - $3$
  - \+ $3 * size$ (rounded to 32-byte chunks)
  - \+ memory expansion slot

## Questions: Part-2

*Ques.* Is it true that only the top 16 stack elements are accessible for computation? How does it work, given that instructions are one byte? How does it know what to compute?

*Ans.* This is the basic design of the stack virtual machine. You don't specify the position; it's implicit—always the first and second items on the stack. Before addition, you must ensure the values are on top of the stack. If they are, you can add them, and the result will be on top. This is why you don't encode value positions in the instruction. A single byte for addition means adding the top two items. This saves code size, but if values aren't on top, you need instructions to move them there. There's a `dup` instruction to duplicate an item in the top 16, and a `swap` instruction to swap the top item with another. Compiler-generated code often uses `dup` and `swap` instructions. The encoding of adding two variables is actually three instructions: duplicate one, duplicate the other, then add. *This 16-element limit is the source of the famous Solidity "stack too deep" error.* There are ways to mitigate this, but the limitation causes the error.

---

*Ques.* If we move to higher-bit hash functions, would we have to change the architecture?

*Ans.* Replacing hash functions would break existing code. EVM evolution prioritizes backward compatibility. Hash functions remain; some are EVM instructions, others are pre-compiled contracts. We mostly extend the EVM. If a new hash function is needed, it can return two stack items, or use memory. There are ways to handle this without redesigning the EVM.

## Ethereum Object Format (EOF)

As we already know now that;

>EVM lacks a validation step; it executes whatever bytes are present. There are no restrictions on what you can put in contract code.

There have been attempts to fix the missing validation problem and one of the attempts is in the form of **Ethereum Object Format (EOF)**.

It borrows inspirations from WASM and other virtual machine designs.

The aim with EOF, is to struture the bytecode in a certain manner so that its easier to execute, analyze and has some other properties.

>EOF is an extensible and versioned container format for the EVM with once-off validation at deploy time. - Ref. [EIP-3540](https://eips.ethereum.org/EIPS/eip-3540)

>EOF prevents bad behavior with complexity.

On the practical side, is that we define ***what a valid bytecode means***.

- When you try to deploy a new contract, it has to pass this validation rules implemented in Ethereum nodes.
- whatever is deployed and stored on the Ethereum state is already valid.
- During execution, we are rest assured that everything is already validated.

![EOF](/assets/lec-17/eof.png)

Legacy EVM although designates an old version of EVM but it will still be compatible with EOF and there will be ways to maintain the backward compatibility.

The another problem apart from the validation check is the ability to distinguish between the bytecode to be executed and not executed.

At present i.e. legacy EVM, all the bytecodes are mixed together. There are some bytes that are to be executed and some that are not meant to be executed but its fundamentally impossible to decide if for *any program, you can actually reach some instruction somewhere or not*.

With EOF, it adds proper structure to the bytecode by separating version, header, code, data into sections.

With EOF, all the pre-checks are not required providing $10-15\%$ performance boost:
- ~~fetch next instruction if it exists~~
- ~~stack underflow~~
- ~~stack overflow~~

Only gas cost calculation and out-of-gas checks are required.

### Control Flow in EVM

Control flow in current EVM is done by two jump instructions:

- `JUMP`: *unconditional*; takes `target` from EVM stack
- `JUMPI`: *conditional*; takes `(target, condition)` from EVM stack

The problem is that it's hard to figure out the jump target as it is also a dynamic argument. Hence, it's really difficult to reason and predict the static control flow of the program.

EVM object format tries to fix that is mostly by replacing this dynamic jump with a *static jump*.

![Control flow: EVM, WASM, LLVM IR, x86](/assets/lec-17/various-vms.png)

![Legacy EVM vs EOF](/assets/lec-17/legacy-evm-eof.png)

## Questions: Part-3

*Ques.* in EIP 7620, there's an idea to deprecate all old CREATE and CREATE2 instructions. So how will it affect the currently deployed contracts, like any factory contract or some other contracts using the CREATE2?

*Ans.*  We want to replace these instructions with new instructions. It's kind of the similar story as with the jumps. new instructions conceptually work the same as the previous ones; we're just adding some small limitations to them, and sometimes we just clean it up because some of the features of the current instructions actually also kind of replaced with a new one.

There will be still EVM and there's a way to distinguish which bytecode is legacy and which bytecode is the EOF. So, we cannot modify the existing code; it will behave as it is.

---

*Ques.* If we want to access more than 16 items from the stack, then it will show you the stack too deep. Then how are we solving that in the EOF?

*Ans.* This is actually not like ultimately a super clever fix; there are new instructions that allow you to access deeper in the stack. So they're equivalent up to 256, because that's the number that fits into a single byte.


