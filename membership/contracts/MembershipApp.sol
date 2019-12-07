pragma solidity 0.4.24;
import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/SafeERC20.sol";
import "./helpers/ERC721Full.sol";
import "./Metadata.sol";

contract MembershipApp is AragonApp, ERC721Full, Metadata {

    bytes32 constant public ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Events
    event NewSubscription(uint256 subscriptionId, uint64 durationInSeconds, uint256 amount, address recipient, address tokenAddress);
    event Subscribed(address subscriber, uint256 subscriptionId);
    event Executed(address subscriber, uint256 subscriptionId);

    struct Subscription {
        bool exists;
        uint64 durationInSeconds;
        uint256 amount;
        address recipient;
        address tokenAddress;
        string tokenURI;
    }
    struct Instance {
        bool exists;
        uint64 startTime;
        uint64 lastExecuted;
    }
    uint256[] subscriptionIds;

    mapping(uint256=>Subscription) public subscriptions;
    mapping(address=>mapping(uint256=>Instance)) public instances;

    struct Payment {
        address recipient;
        uint256 subscriptionId;
        uint64 paymentTime;
    }
    mapping(uint256=>Payment) payments;

    /**
     * @notice Decrement the counter by 1
     */
    function totalSubscriptions() public view returns(uint256) {
        return subscriptionIds.length;
    }
    /**
     * @notice Decrement the counter by 1
     */
    function initialize(string name, string symbol) onlyInit public {
        _name = name;
        _symbol = symbol;
        initialized();
    }

    /**
     * @notice Decrement the counter by 1
     */
    function getURI(uint256 tokenId) public view returns (string) {
        return subscriptions[payments[tokenId].subscriptionId].tokenURI;
    }

    /**
     * @notice Decrement the counter by 1
     */
    function addSubscription(uint64 durationInSeconds, uint256 amount, address recipient, address tokenAddress)
    external auth(ADMIN_ROLE) returns(uint256) {
        require(durationInSeconds > 0, "Duration must be greater than 0");
        require(uint256(recipient) != 0, "Recipient can't be empty");
        require(uint256(tokenAddress) != 0, "Token can't be empty");
        // require(amount > 0, "Amount must be greater than 0"); // 0 Amount subscriptions might be desireable.

        uint256 subscriptionId = uint256(keccak256(abi.encodePacked(durationInSeconds, amount, recipient, tokenAddress)));
        require(!subscriptions[subscriptionId].exists, "Subscription with those attributes already exists");

        subscriptions[subscriptionId].exists = true;
        subscriptions[subscriptionId].durationInSeconds = durationInSeconds;
        subscriptions[subscriptionId].amount = amount;
        subscriptions[subscriptionId].recipient = recipient;
        subscriptions[subscriptionId].tokenAddress = tokenAddress;

        subscriptionIds.push(subscriptionId);
        emit NewSubscription(subscriptionId, durationInSeconds, amount, recipient, tokenAddress);
        return subscriptionId;
    }

    /**
     * @notice Decrement the counter by 1
     */
    function sinceLastExecution(uint256 subscriptionId, address subscriber) public view returns(uint64) {
        return getTimestamp64() - instances[subscriber][subscriptionId].lastExecuted;
    }

    /**
     * @notice Decrement the counter by 1
     */
    function checkSubscription(uint256 subscriptionId, address subscriber) public view
        returns (uint64 _timeSinceLastExecution, uint256 lastNFT) {
            uint64 lastExecuted = instances[subscriber][subscriptionId].lastExecuted;
            uint256 nftId = uint256(keccak256(abi.encodePacked(subscriptionId, subscriber, lastExecuted)));

            return (getTimestamp64() - lastExecuted, nftId);
    }

    /**
     * @notice Increment the counter by 1
     */
    function subscribe(uint256 subscriptionId) external isInitialized {
        require(subscriptions[subscriptionId].exists, "Subscription must exist");
        require(!instances[msg.sender][subscriptionId].exists, "Subscription instance already exists");

        instances[msg.sender][subscriptionId].exists = true;
        instances[msg.sender][subscriptionId].startTime = getTimestamp64();
        emit Subscribed(msg.sender, subscriptionId);

        require(execute(subscriptionId, msg.sender), "Failed to execute new subscription");
    }

    /**
     * @notice Decrement the counter by 1
     */
    function execute(uint256 subscriptionId, address recipient) public isInitialized returns (bool) {
        // require(subscriptions[subscriptionId].exists, "Subscription must exist"); // taken care of in next line
        require(sinceLastExecution(subscriptionId, recipient) < subscriptions[subscriptionId].durationInSeconds, "Already executed this period");

        require(SafeERC20.safeTransferFrom(ERC20(subscriptions[subscriptionId].tokenAddress), recipient, recipient, subscriptions[subscriptionId].amount),
            "Payment not successful");
        emit Executed(recipient, subscriptionId);

        uint64 paymentTime = getTimestamp64();
        uint256 nftId = uint256(keccak256(abi.encodePacked(subscriptionId, recipient, paymentTime)));

        _mint(recipient, nftId);
        instances[recipient][subscriptionId].lastExecuted = paymentTime;

        // this info will be relevant for NFT
        payments[nftId].recipient = recipient;
        payments[nftId].subscriptionId = subscriptionId;
        payments[nftId].paymentTime = paymentTime;

        return true;
    }
}