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
  }
};
