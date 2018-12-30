var FoundingTeam = artifacts.require("./FoundingTeam.sol");
var TripioToken = artifacts.require("./TripioTokenOnline.sol");

module.exports = function(deployer, network, accounts) {
  if (network === 'test') {
    const m0 = accounts[1];
    const m1 = accounts[2];
    const m2 = accounts[3];
    const m3 = accounts[4];
    const fundingSource = accounts[7];

    deployer.deploy(TripioToken).then(function() {
      // console.log('prgs.address', user1, user2, user3, user4, TripioTokenOnline.address);
      return deployer.deploy(FoundingTeam, m0, m1, m2, m3, TripioToken.address, fundingSource);
    });
  } else if (network === 'ropsten') {
    const m0 = '0xA5CD83fA361BeE225d451BDAd317D3e3A5017d88';
    const m1 = '0xCed5aa254f86e2AA0C936B3f197676DfaE282860';
    const m2 = '0x294Ec091DC60D27803F89c15Ad33Aa2cD212321B';
    const m3 = '0x6c50c27fe00E968B0B822E37aC286B3B21b11482';
    const trioContract = '0xF142f1c7BaDc95FB438302D7Cf0a5Db426f8f779';
    const fundingSource = '0x262bAB6a90Aa1741390c4A3Ec58855C81d9728E1';
    deployer.deploy(FoundingTeam, m0, m1, m2, m3, trioContract, fundingSource);
  } else {
    const m0 = '0x83e65DBFd247c5Da36D33F67431bE85Bf0FDD2a2';
    const m1 = '0x3eA6680e25873d736a9Bb921e754353d7aC2aB62';
    const m2 = '0x99a8eBdFd2101daCad6313eba309620FB5f8dd37';
    const m3 = '0x33b59Aff70FE19C4392e0AF686313FF831bD18a6';
    const trioContract = '0x8B40761142B9aa6dc8964e61D0585995425C3D94';
    const fundingSource = '0x448dD187b515d8Ee64131c00a975A7941e330198';
    deployer.deploy(FoundingTeam, m0, m1, m2, m3, trioContract, fundingSource);
  }
};
