## Initial Data

#### Mainnet

- m0: `0x83e65DBFd247c5Da36D33F67431bE85Bf0FDD2a2`
- m1: `0x3eA6680e25873d736a9Bb921e754353d7aC2aB62`
- m2: `0x99a8eBdFd2101daCad6313eba309620FB5f8dd37`
- m3: `0x33b59Aff70FE19C4392e0AF686313FF831bD18a6`
- percentages[m0]: `44%`
- percentages[m1]: `25%`
- percentages[m2]: `18.6%`
- percentages[m3]: `12.4%`
- owner: `0x201b99C0E5c4f2B4eaBF8b2528F578E21BD8ee49`
- contract: `0x699Aa61b681CE15beB0aF44c49c83537A677FEAc`
- trioContract: `0x8B40761142B9aa6dc8964e61D0585995425C3D94`
- fundingSource:`0x448dD187b515d8Ee64131c00a975A7941e330198`

#### Ropsten

- m0: `0xA5CD83fA361BeE225d451BDAd317D3e3A5017d88`
- m1: `0xCed5aa254f86e2AA0C936B3f197676DfaE282860`
- m2: `0x294Ec091DC60D27803F89c15Ad33Aa2cD212321B`
- m3: `0x6c50c27fe00E968B0B822E37aC286B3B21b11482`
- percentages[m0]: `44%`
- percentages[m1]: `25%`
- percentages[m2]: `18.6%`
- percentages[m3]: `12.4%`
- owner: `0x201b99C0E5c4f2B4eaBF8b2528F578E21BD8ee49`
- contract: `0x13D861CD2Aa3Fc8aE194056e774156B0a457a054`
- trioContract: `0xF142f1c7BaDc95FB438302D7Cf0a5Db426f8f779`
- fundingSource:`0x262bAB6a90Aa1741390c4A3Ec58855C81d9728E1`

# How to run

#### Get started

- Get into this project and run `npm install`

- Install truffle: `npm install -g truffle`

- Run test: `truffle test`

#### Deploy contract

- Set your env var `MNEMONIC=[your eth mneminic] `
- Deploy on ropsten, run `truffle migrate --network ropsten`
- Deploy on mainnet, run `truffle migrate --network live`



## Documentation

#### Data & operations

- [Percentages](#Percentages)

- [Members](#Members)

- [Status](#Status)

- [Terminal](#Terminal)

- [Proposal](#Proposal)

  

##### Percentages

- proposalType: `1`

- Get percentages:

  - `teamPercentages() // return [m0_p, m1_p, m2_p, m3_p] `

- Create proposal (sending tx):

  - `updatePercentagesProposal(uint16 m0_p, uint16 m1_p, uint16 m2_p, uint16 m3_p)`

  - ```javascript
    // Example, the percentages are:
    // m0=44%, m1=25%, m2=18.6%, m3=12.4%
    updatePercentagesProposal(440, 250, 186, 124).send();
    ```

##### Members

- proposalType: `2`
- Get members:
  - `teamMembers() // return [m0, m1, m2, m3] `
- Create proposal (sending tx):
  - `updateMembersProposal(address _m0, address _m1, address _m2, address _m3)`



##### Status

- proposalType: `3`

- Get enabled:

  - `enabled() // return bool, true means running, false means paused`

- Create proposal (sending tx):

  - `updateStatusProposal(uint8 status) // status must be 1(resume) or 2(pause)`

  - ```javascript
    // Make a proposal to pause the contract
    updateStatusProposal(2).send()
    
    // Make a proposal to resume the contract
    updateStatusProposal(1).send()
    ```

##### Terminal

- proposalType: `4`
- Create proposal (sending tx):
  - `terminateProposal(bool terminal) // terminal must be true to terminate the contract`
  - After approved, the contract will be no longer working, all the funds will be sent to the original address.

##### Proposal

- Structure

  - ```javascript
    {
        _sponsor: <address>,
        _signatures: <bool[]>,
        _timestamp: <uint256>,
        _proposalType: <uint8>,
        _percentages: <uint16[]>,
        _members: <address[]>,
        _status: <uint8>,
        _termianl: <bool>
    }
    ```

  - 

- Get

  - Get proposalLength: `proposalLength() // return current proposal length`
  - Get proposal: `teamProposal(uint256 proposalIndex)`

  - ```Javascript
    // Get latest proposal
    async function getLatestPorposal () {
     const proposalLength = await contract.methods.proposalLength().call();
     const proposalIndex = proposalLength - 1;
     const proposal = await contract.methods.teamProposal(proposalIndex).call();
     // Maybe a new proposal made before teamProposal() and after proposalLength(),
     // so you should check this proposal carefully if this is what you want.
    }
    
    ```

  - 

- Vote for proposal (sending tx):

  - `vote(address sponsor, uint256 proposalIndex, uint proposalType) `
  - After enough voting, the proposal will come into force.

