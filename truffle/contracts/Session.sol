pragma solidity ^0.4.17;

// Interface of Main contract to call from Session contract
contract Main {
    function addSession(address session) public {}
}

contract Session {
    // Variable to hold Main Contract Address when create new Session Contract
    address public mainContract;
    // Variable to hold Main Contract instance to call functions from Main
    Main MainContract;

    // TODO: Variables

    
    function Session(address _mainContract
        // Other arguments
    ) public {
        // Get Main Contract instance
        mainContract = _mainContract;
        MainContract = Main(_mainContract);
        
        // TODO: Init Session contract
        
        // Call Main Contract function to link current contract.
        MainContract.addSession(address(this));
    }

    // TODO: Functions
    
}
