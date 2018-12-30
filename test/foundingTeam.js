var FoundingTeam = artifacts.require("./FoundingTeam.sol");
var TripioToken = artifacts.require("./TripioTokenOnline.sol");
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
const web3 = new Web3(
  new Web3.providers.HttpProvider('http://127.0.0.1:7545')
);

contract('FoundingTeam', function(accounts) {

  const creator = accounts[0];
  const m0 = accounts[1];
  const m1 = accounts[2];
  const m2 = accounts[3];
  const m3 = accounts[4];
  const newM0 = accounts[5];
  const newM1 = accounts[6];
  const fundingSource = accounts[7];
  let tripioToken, instance;

  const snapshotIds = [];
  const candyBalances = [];

  function increaseTime (duration) {
    const id = Date.now();
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id,
      }, (err, res) => {
        return err ? reject(err) : snapshotIds.push(id) && resolve();
      })
    })
  }

  function mine() {
    const id = Date.now();
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id,
      }, (err, res) => {
        return err ? reject(err) : resolve();
      })
    })
  }

  function revert (snapshotIds) {
    const id = Date.now();
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_revert',
        params: snapshotIds,
        id,
      }, (err, res) => {
        return err ? reject(err) : resolve();
      })
    })
  }

  before(async () => {
    tripioToken = await TripioToken.deployed();
    instance = await FoundingTeam.deployed();
    const { timestamp } = await web3.eth.getBlock('latest');
    console.log('timestamp', timestamp);
    await tripioToken.enableTransfer();
    await tripioToken.transfer(fundingSource, to18Decimals('10000'));
  });

  after(async () => {
    await revert(snapshotIds);
    await mine();
    const { timestamp } = await web3.eth.getBlock('latest');
    console.log('timestamp', timestamp);
  });

  function to18Decimals(numString) {
    return web3.utils.toWei(numString, 'ether');
  }

  it('teamMembers created by constructor', async function() {
    const members = await instance.teamMembers();
    assert.deepEqual(members, [m0, m1, m2, m3], 'teamMembers not correct!');
  });

  it('teamPercentages 440, 250, 186, 124 created by constructor', async function() {
    const percentages = (await instance.teamPercentages()).map(p => Number(p));
    assert.deepEqual(percentages, [440, 250, 186, 124], 'teamPercentages not correct!');
  });

  it('deposit', async function () {
    const amount = to18Decimals('10000');
    await tripioToken.approve(instance.address, amount, { from: fundingSource });
    await instance.deposit({ from: fundingSource });

    const foundingBalance = await tripioToken.balanceOf(instance.address);
    const fundingSourceBalance = await tripioToken.balanceOf(fundingSource);

    assert.equal(foundingBalance, to18Decimals('10000'), 'foundingBalance err');
    assert.equal(fundingSourceBalance, to18Decimals('0'), 'fundingSourceBalance err');
  })

  async function makePercentagesProposal() {    
    await instance.updatePercentagesProposal(100, 250, 300, 350, { from: m0});
    const proposalLength = await instance.proposalLength();
    const proposal = await instance.teamProposal(proposalLength - 1);

    const percentagesProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      percentages: proposal._percentages.map(p => Number(p))
    };

    return percentagesProposal;
  }

  it('make updatePercentagesProposal', async () => {
    const percentagesProposal = await makePercentagesProposal();
    const teamPercentages = (await instance.teamPercentages()).map(p => Number(p));
    assert.deepEqual(percentagesProposal, {
      sponsor: m0,
      signatures: [true, false, false, false],
      percentages: [100, 250, 300, 350],
    }, 'percentagesProposal not correct');
    assert.deepEqual(teamPercentages, [440, 250, 186, 124], 'teamPercentages not correct');
  });

  it('vote for expired percentages(tx fail)', async () => {
    const formerProposal = await makePercentagesProposal();
    const proposalLength = await instance.proposalLength();
    await increaseTime(48 * 60 * 60);
    await mine();
    try {
      await instance.vote(formerProposal.sponsor, proposalLength - 1, 1, { from: m1 });
      assert.fail('Expected throw not received');
    } catch (error) {
      assert.equal(error.reason, 'Expired proposal', 'Expected not correct');
    }
  });

  it('vote for updating percentages', async () => {
    const formerProposal = await makePercentagesProposal();
    const proposalLength = await instance.proposalLength();

    await instance.vote(formerProposal.sponsor, proposalLength - 1, 1, { from: m1 });
    await instance.vote(formerProposal.sponsor, proposalLength - 1, 1, { from: m2 });
    await instance.vote(formerProposal.sponsor, proposalLength - 1, 1, { from: m3 });

    const proposal = await instance.teamProposal(proposalLength - 1);
    const teamPercentages = (await instance.teamPercentages()).map(p => Number(p));
    const percentagesProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      percentages: proposal._percentages.map(p => Number(p))
    };

    assert.deepEqual(percentagesProposal, {
      sponsor: m0,
      signatures: [true, true, true, true],
      percentages: [100, 250, 300, 350],
    }, 'percentagesProposal not correct');

    assert.deepEqual(teamPercentages, [100, 250, 300, 350], 'teamPercentages not correct');
  });

  it('make updateMembersProposal', async function() {
    await instance.updateMembersProposal(newM0, newM1, m2, m3, { from: m0 });

    const proposalLength = await instance.proposalLength();
    const proposal = await instance.teamProposal(proposalLength - 1);
    const teamMembers = await instance.teamMembers();

    const membersProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      members: proposal._members,
    }

    assert.deepEqual(membersProposal, {
      sponsor: m0,
      signatures: [true, false, false, false],
      members: [newM0, newM1, m2, m3],
    }, 'suggestTerminal not correct');
    assert.deepEqual(teamMembers, [m0, m1, m2, m3], 'suggestTerminal not correct');
  });

  it('vote for updating members', async function() {
    const proposalLength = await instance.proposalLength();
    const formerProposal = await instance.teamProposal(proposalLength - 1);

    await instance.vote(formerProposal._sponsor, proposalLength - 1, 2, { from: m1 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 2, { from: m2 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 2, { from: m3 });

    const teamMembers = await instance.teamMembers();

    assert.deepEqual(teamMembers, [newM0, newM1, m2, m3], 'teamMembers not correct');
  });

  it('candy', async function() {
    await increaseTime(1559361600 - Math.floor(Date.now() / 1000));
    await instance.candy();
    const newM0Balance = await tripioToken.balanceOf(newM0);
    const newM1Balance = await tripioToken.balanceOf(newM1);
    const m2Balance = await tripioToken.balanceOf(m2);
    const m3Balance = await tripioToken.balanceOf(m3);
  
    // 24 timestamps totally
    // [100, 250, 300, 350]
    candyBalances.push({
      newM0: newM0Balance,
      newM1: newM1Balance,
      m2: m2Balance,
      m3: m3Balance,
    });

    assert.equal(Number(newM0Balance), Math.floor(new BigNumber(to18Decimals('10000')).times(100).div(24).div(1000)), 'newM0Balance not correct' + newM0Balance);
    assert.equal(Number(newM1Balance), Math.floor(new BigNumber(to18Decimals('10000')).times(250).div(24).div(1000)), 'newM1Balance not correct' + newM1Balance);
    assert.equal(Number(m2Balance),Math.floor(new BigNumber(to18Decimals('10000')).times(300).div(24).div(1000)), 'm2Balance not correct' + m2Balance);
    assert.equal(Number(m3Balance), Math.floor(new BigNumber(to18Decimals('10000')).times(350).div(24).div(1000)), 'm3Balance not correct' + m3Balance);
  });

  it('make updateStatusProposal to 2(pause)', async function() {
    await instance.updateStatusProposal(2, { from: newM0 });

    const proposalLength = await instance.proposalLength();
    const proposal = await instance.teamProposal(proposalLength - 1);
    const enabled = await instance.enabled();

    const statusProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      status: Number(proposal._status),
    }

    assert.deepEqual(statusProposal, {
      sponsor: newM0,
      signatures: [true, false, false, false],
      status: 2,
    }, 'suggestStatus not correct');
    assert.deepEqual(enabled, true, 'enabled not correct');
  });

  it('vote 3/4 for updating status to 2(pause)', async function() {
    const proposalLength = await instance.proposalLength();
    const formerProposal = await instance.teamProposal(proposalLength - 1);

    await instance.vote(formerProposal._sponsor, proposalLength - 1, 3, { from: newM1 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 3, { from: m2 });
    const enabled = await instance.enabled();
    const proposal = await instance.teamProposal(proposalLength - 1);
    const statusProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      status: Number(proposal._status),
    }

    assert.deepEqual(statusProposal, {
      sponsor: newM0,
      signatures: [true, true, true, false],
      status: 2,
    }, 'suggestStatus not correct');

    assert.deepEqual(enabled, false, 'enabled correct');
  });

  it('candy at pause (tx fail)', async function() {
    await increaseTime(2592000);
    try {
      await instance.candy();
      assert.fail('Expected throw not received');
    } catch (error) {
      assert.equal(error.reason, 'Must enabled', 'Expected not correct');
    }
    const newM0Balance = await tripioToken.balanceOf(newM0);
    const newM1Balance = await tripioToken.balanceOf(newM1);
    const m2Balance = await tripioToken.balanceOf(m2);
    const m3Balance = await tripioToken.balanceOf(m3);
    // 24 timestamps totally
    // [100, 250, 300, 350]
    assert.equal(newM0Balance, Math.floor(new BigNumber(to18Decimals('10000')).times(100).div(24).div(1000)), 'newM0Balance not correct' + newM0Balance);
    assert.equal(newM1Balance, Math.floor(new BigNumber(to18Decimals('10000')).times(250).div(24).div(1000)), 'newM1Balance not correct' + newM1Balance);
    assert.equal(Number(m2Balance),Math.floor(new BigNumber(to18Decimals('10000')).times(300).div(24).div(1000)), 'm2Balance not correct' + m2Balance);
    assert.equal(Number(m3Balance), Math.floor(new BigNumber(to18Decimals('10000')).times(350).div(24).div(1000)), 'm3Balance not correct' + m3Balance);
  });

  it('update status to 1(resume)', async function() {
    await instance.updateStatusProposal(1, { from: newM0 });
    const proposalLength = await instance.proposalLength();
    const formerProposal = await instance.teamProposal(proposalLength - 1);

    await instance.vote(formerProposal._sponsor, proposalLength - 1, 3, { from: m2 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 3, { from: m3 });

    const proposal = await instance.teamProposal(proposalLength - 1);
    const enabled = await instance.enabled();

    const statusProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      status: Number(proposal._status),
    }
    assert.deepEqual(statusProposal, {
      sponsor: newM0,
      signatures: [true, false, true, true],
      status: 1,
    }, 'suggestStatus not correct');
    assert.deepEqual(enabled, true, 'enabled not correct');
  });

  it('candy after resume', async function() {
    await increaseTime(2678400);
    await instance.updateStatusProposal(1, { from: newM0 });
    const foundingBalance = await tripioToken.balanceOf(instance.address);
    await instance.candy();
    const newM0Balance = Number(await tripioToken.balanceOf(newM0));
    const newM1Balance = Number(await tripioToken.balanceOf(newM1));
    const m2Balance = Number(await tripioToken.balanceOf(m2));
    const m3Balance = Number(await tripioToken.balanceOf(m3));
    
    // 24 timestamps totally
    // [100, 250, 300, 350]

    assert.equal(newM0Balance, Math.round(new BigNumber(candyBalances[0].newM0).plus(new BigNumber(foundingBalance).times(100).div(1000).div(22))), 'newM0Balance not correct' + newM0Balance);
    assert.equal(newM1Balance, Math.round(new BigNumber(candyBalances[0].newM1).plus(new BigNumber(foundingBalance).times(250).div(1000).div(22))), 'newM1Balance not correct' + newM1Balance);
    assert.equal(Number(m2Balance),Math.round(new BigNumber(candyBalances[0].m2).plus(new BigNumber(foundingBalance).times(300).div(1000).div(22))), 'm2Balance not correct' + m2Balance);
    assert.equal(Number(m3Balance), Math.round(new BigNumber(candyBalances[0].m3).plus(new BigNumber(foundingBalance).times(350).div(1000).div(22))), 'm3Balance not correct' + m3Balance);
  });

  it('make terminateProposal', async function() {
    await instance.terminateProposal(true, { from: newM0 });

    const proposalLength = await instance.proposalLength();
    const proposal = await instance.teamProposal(proposalLength - 1);
    const terminalProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      terminal: proposal._terminal,
    };

    assert.deepEqual(terminalProposal, {
      sponsor: newM0,
      signatures: [true, false, false, false],
      terminal: true,
    }, 'suggestTerminal not correct');
  });

  it('vote for terminate contract and withdraw', async function() {
    const proposalLength = await instance.proposalLength();
    const formerProposal = await instance.teamProposal(proposalLength - 1);

    await instance.vote(formerProposal._sponsor, proposalLength - 1, 4, { from: newM1 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 4, { from: m2 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 4, { from: m3 });

    const foundingBalance = await tripioToken.balanceOf(instance.address);
    const fundingSourceBalance = Number(await tripioToken.balanceOf(fundingSource));

    assert.equal(foundingBalance, to18Decimals('0'), 'foundingBalance err');
    assert.equal(fundingSourceBalance, Math.floor(new BigNumber(to18Decimals('10000')).times(23).div(24).times(21).div(22)), 'fundingSourceBalance err');
  });

});
