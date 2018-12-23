var FoundingTeam = artifacts.require("./FoundingTeam.sol");
var TripioToken = artifacts.require("./TripioTokenOnline.sol");

module.exports = function(deployer, network, accounts) {
  if (network === 'test') {
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const user4 = accounts[4];

    deployer.deploy(TripioToken).then(function() {
      // console.log('prgs.address', user1, user2, user3, user4, TripioTokenOnline.address);
      return deployer.deploy(FoundingTeam, user1, user2, user3, user4, TripioToken.address);
    });
  }
};
