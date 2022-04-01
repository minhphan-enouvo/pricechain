// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// Interface of Main contract to call from Session contract
contract MainSC {
    struct IParticipant {
        address account;
        string fullname;
        string email;
        uint8 nSessions;
        uint256 deviation; // %
    }

    address public admin;
    uint8 public nParticipants;
    address[] public iParticipants;
    mapping(address => IParticipant) public participants;

    function addSession(address session) public {}

    function getDeviation(address addr)
        external
        view
        returns (uint256 deviation)
    {}

    function calculateDeviation(
        address participantAddr,
        uint256 currentPrice,
        uint256 finalPrice
    ) public {}
}

contract Session {
    // Variable to hold Main Contract Address when create new Session Contract
    address public mainContract;
    int8 public nSessions;
    // Variable to hold Main Contract instance to call functions from Main
    MainSC MainContract;

    // State Enum to define Session's state
    enum State {
        CREATED,
        STARTED,
        CLOSING,
        CLOSED
    }

    struct IParticipant {
        address account;
        string fullname;
        string email;
        uint8 nSessions;
        uint256 deviation; // %
    }

    // TODO: Variables
    string public name;
    string public description;
    string public image;
    address[] public participants;
    mapping(address => uint256) public priceOfParticipants;
    uint256 public proposedPrice;
    uint256 public finalPrice;
    address public admin;
    State public state = State.CREATED;

    // Necessary events
    event ProposePrice(address from, uint256 value, uint256 proposedPrice);
    event SetFinalPrice(uint256 finalPrice);

    constructor(
        address _mainContract,
        string memory _name,
        string memory _description,
        string memory _image
    ) public {
        // Get Main Contract instance
        mainContract = _mainContract;
        MainContract = MainSC(_mainContract);

        // TODO: Init Session contract
        name = _name;
        description = _description;
        image = _image;

        // Call Main Contract function to link current contract.
        MainContract.addSession(address(this));
        admin = MainContract.admin();
    }

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    modifier onlyInState(State _state) {
        require(state == _state);
        _;
    }

    // only Admin
    function startSession() public onlyAdmin onlyInState(State.CREATED) {
        state = State.STARTED;
    }

    function checkExist(address _addr) private view returns (bool) {
        for (uint8 i = 0; i < participants.length; i++) {
            if (participants[i] == _addr) {
                return true;
            }
        }

        return false;
    }

    // only by owner, the session is still opening
    function proposePrice(uint256 _price) public onlyInState(State.STARTED) {
        priceOfParticipants[msg.sender] = _price;

        if (!checkExist(msg.sender)) {
            participants.push(msg.sender);
        }

        uint256 totalPrice;
        uint256 totalDeviation;

        for (uint8 i = 0; i < participants.length; i++) {
            address addr = participants[i];
            totalPrice +=
                priceOfParticipants[addr] *
                (100 - MainContract.getDeviation(addr));
            totalDeviation += MainContract.getDeviation(addr);
        }

        // calculate proposed price
        proposedPrice =
            totalPrice /
            (100 * participants.length - totalDeviation);
        emit ProposePrice(msg.sender, _price, proposedPrice);
    }

    // stop session, only by admin
    function stopSession() public onlyAdmin onlyInState(State.STARTED) {
        state = State.CLOSING;
    }

    // close session, only by admin
    function closeSession(uint256 _finalPrice) public onlyAdmin {
        require(_finalPrice > 0, "Final price must be great than 0.");

        finalPrice = _finalPrice;

        for (uint8 i = 0; i < participants.length; i++) {
            address addr = participants[i];
            MainContract.calculateDeviation(
                addr,
                priceOfParticipants[addr],
                finalPrice
            );
        }

        state = State.CLOSED;
        emit SetFinalPrice(finalPrice);
    }

    // only Admin
    function updateProductInfo(
        string memory _name,
        string memory _description,
        string memory _image
    ) public onlyAdmin {
        name = _name;
        description = _description;
        image = _image;
    }
}
