// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Main {
    // Structure to hold details of Bidder
    struct IParticipant {
        address account;
        string fullname;
        string email;
        uint8 nSessions;
        uint256 deviation; // %
    }

    address public admin;

    // TODO: Variables
    uint8 public nParticipants;
    address[] public iParticipants;
    mapping(address => IParticipant) public participants;
    uint8 public nSessions = 0;
    address[] public sessions;

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Add a Session Contract address into Main Contract. Use to link Session with Main
    function addSession(address session) public {
        nSessions++;
        sessions.push(session);
    }

    // TODO: Functions
    function register(string memory _fullname, string memory _email)
        public
        returns (string memory, string memory)
    {
        participants[msg.sender] = IParticipant({
            account: msg.sender,
            fullname: _fullname,
            email: _email,
            nSessions: 0,
            deviation: 0
        });

        nParticipants++;
        iParticipants.push(msg.sender);

        return (_fullname, _email);
    }

    function getDeviation(address addr)
        external
        view
        returns (uint256 deviation)
    {
        return participants[addr].deviation;
    }

    function calculateDeviation(
        address participantAddr,
        uint256 currentPrice,
        uint256 finalPrice
    ) public {
        uint256 overlapPrice = finalPrice > currentPrice
            ? finalPrice - currentPrice
            : currentPrice - finalPrice;
        uint256 newDeviation = (overlapPrice * 100) / finalPrice;
        uint256 currentDeviation = participants[participantAddr].deviation;
        uint8 n = participants[participantAddr].nSessions;
        participants[participantAddr].deviation =
            ((currentDeviation * n) + newDeviation) /
            (n + 1);
        participants[participantAddr].nSessions++;
    }

    function updateUserProfile(string memory _fullname, string memory _email)
        public
    {
        participants[msg.sender].email = _email;
        participants[msg.sender].fullname = _fullname;
    }
}
