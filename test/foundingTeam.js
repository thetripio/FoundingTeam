var FoundingTeam = artifacts.require("./FoundingTeam.sol");
var TripioToken = artifacts.require("./TripioTokenOnline.sol");
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
  const pool0 = accounts[5];
  const pool1 = accounts[6];
  let tripioToken, instance;

  before(async () => {
    tripioToken = await TripioToken.deployed();
    instance = await FoundingTeam.deployed();
    await tripioToken.enableTransfer();
    await tripioToken.transfer(pool0, to18Decimals('10000'));
    await tripioToken.transfer(pool1, to18Decimals('5000'));
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
    const amount0 = to18Decimals('10000');
    const amount1 = to18Decimals('5000');
    await tripioToken.approve(instance.address, amount0, { from: pool0 });
    await tripioToken.approve(instance.address, amount1, { from: pool1 });
    await instance.deposit({ from: pool0 });
    await instance.deposit({ from: pool1 });

    const foundingBalance = await tripioToken.balanceOf(instance.address);
    const pool0Balance = await tripioToken.balanceOf(pool0);
    const pool1Balance = await tripioToken.balanceOf(pool1);

    assert.equal(foundingBalance, to18Decimals('15000'), 'foundingBalance err');
    assert.equal(pool0Balance, to18Decimals('0'), 'pool0Balance err');
    assert.equal(pool1Balance, to18Decimals('0'), 'pool1Balance err');
  })

  it('make updatePercentagesProposal', async function() {
    await instance.updatePercentagesProposal(100, 250, 300, 350, { from: m0});
    const proposalLength = await instance.proposalLength();
    const proposal = await instance.teamProposal(proposalLength - 1);
    const teamPercentages = (await instance.teamPercentages()).map(p => Number(p));

    const percentagesProposal = {
      sponsor: proposal._sponsor,
      signatures: proposal._signatures,
      percentages: proposal._percentages.map(p => Number(p))
    };

    assert.deepEqual(percentagesProposal, {
      sponsor: m0,
      signatures: [true, false, false, false],
      percentages: [100, 250, 300, 350],
    }, 'percentagesProposal not correct');

    assert.deepEqual(teamPercentages, [440, 250, 186, 124], 'teamPercentages not correct');
  });

  it('vote for updating percentages', async function() {
    const proposalLength = await instance.proposalLength();
    const formerProposal = await instance.teamProposal(proposalLength - 1);

    /**
     * Uncomment this code to test the Expiration time
     */
    // await new Promise((resolve, reject) => {
    //   web3.currentProvider.send({
    //     jsonrpc: '2.0', 
    //     method: 'evm_increaseTime', 
    //     params: [24 * 60 * 60], 
    //     id: new Date().getSeconds()
    //   }, (err, resp) => {
    //     if (!err) {
    //       resolve();
    //     }
    //   });
    // });

    await instance.vote(formerProposal._sponsor, proposalLength - 1, 1, { from: m1 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 1, { from: m2 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 1, { from: m3 });

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

  it('make terminateProposal', async function() {
    await instance.terminateProposal(true, { from: m0 });

    const proposalLength = await instance.proposalLength();
    const proposal = await instance.teamProposal(proposalLength - 1);
    const suggestTerminal = await instance.suggestTerminalMap(proposalLength - 1);

    assert.deepEqual(suggestTerminal, true, 'suggestTerminal not correct');
  });

  it('vote for terminate contract and withdraw', async function() {
    const proposalLength = await instance.proposalLength();
    const formerProposal = await instance.teamProposal(proposalLength - 1);

    await instance.vote(formerProposal._sponsor, proposalLength - 1, 4, { from: m1 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 4, { from: m2 });
    await instance.vote(formerProposal._sponsor, proposalLength - 1, 4, { from: m3 });

    const foundingBalance = await tripioToken.balanceOf(instance.address);
    const pool0Balance = await tripioToken.balanceOf(pool0);
    const pool1Balance = await tripioToken.balanceOf(pool1);

    assert.equal(foundingBalance, to18Decimals('0'), 'foundingBalance err');
    assert.equal(pool0Balance, to18Decimals('10000'), 'pool0Balance err');
    assert.equal(pool1Balance, to18Decimals('5000'), 'pool1Balance err');
  });

});
