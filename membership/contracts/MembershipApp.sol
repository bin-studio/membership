pragma solidity 0.4.24;
import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/SafeERC20.sol";
import "./helpers/ERC721Full.sol";
import "./Metadata.sol";

contract MembershipApp is AragonApp, ERC721Full, Metadata {

    uint256 gracePeriod;
    bytes32 constant public ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Events
    event NewSubscription(uint256 subscriptionId, uint64 durationInSeconds, uint256 amount, address recipient, address tokenAddress);
    event RemovedSubscription(uint256 subscriptionId, uint64 durationInSeconds, uint256 amount, address recipient, address tokenAddress);
    event Subscribed(address subscriber, uint256 subscriptionId);
    event Unsubscribed(address subscriber, uint256 subscriptionId);
    event Executed(address subscriber, uint256 subscriptionId);

    struct Subscription {
        bool exists;
        uint256 index;
        uint64 active;
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
        address tokenRecipient;
        uint256 subscriptionId;
        uint64 paymentTime;
    }
    mapping(uint256=>Payment) payments;

    /**
     * @notice Adds a new subscription
     */
    function addSubscription(uint64 durationInSeconds, uint256 amount, address recipient, address tokenAddress, string baseURI)
    public auth(ADMIN_ROLE) returns(uint256) {
        require(durationInSeconds > 0, "Duration must be greater than 0");
        require(durationInSeconds < getTimestamp64(), "Improbable situation");
        require(uint256(recipient) != 0, "Recipient can't be empty");
        require(uint256(tokenAddress) != 0, "Token can't be empty");
        // require(amount > 0, "Amount must be greater than 0"); // 0 Amount subscriptions might be desireable.

        uint256 subscriptionId = uint256(keccak256(abi.encodePacked(durationInSeconds, amount, recipient, tokenAddress)));
        require(!subscriptions[subscriptionId].exists, "Subscription with those attributes already exists");

        subscriptions[subscriptionId].exists = true;
        subscriptions[subscriptionId].durationInSeconds = durationInSeconds;
        // subscriptions[subscriptionId].active = 0;
        subscriptions[subscriptionId].amount = amount;
        subscriptions[subscriptionId].recipient = recipient;
        subscriptions[subscriptionId].tokenAddress = tokenAddress;
        subscriptions[subscriptionId].tokenURI = baseURI;
        subscriptions[subscriptionId].index = subscriptionIds.push(subscriptionId) - 1;

        emit NewSubscription(subscriptionId, durationInSeconds, amount, recipient, tokenAddress);
        return subscriptionId;
    }

    /**
     * @notice Remove an unused subscription
     */
    function removeSubscription(uint256 subscriptionId) public auth(ADMIN_ROLE) {
        require(subscriptions[subscriptionId].active == 0, "Can't cancel a subscription with active instances");

        uint256 index = subscriptions[subscriptionId].index;
        require(index < subscriptionIds.length);
        
        uint256 movedSubscriptionId = subscriptionIds[subscriptionIds.length-1];
        subscriptionIds[index] = movedSubscriptionId;
        subscriptions[movedSubscriptionId].index = index;

        delete subscriptionIds[subscriptionIds.length-1];
        subscriptionIds.length--;
        emit RemovedSubscription(
            subscriptionId,
            subscriptions[subscriptionId].durationInSeconds,
            subscriptions[subscriptionId].amount,
            subscriptions[subscriptionId].recipient,
            subscriptions[subscriptionId].tokenAddress
        );
        delete subscriptions[subscriptionId];
    }

    /**
     * @notice Gets the total subscriptions
     */
    function updateGracePeriod(uint256 _gracePeriod) public auth(ADMIN_ROLE) {
        gracePeriod = _gracePeriod;
    }

    /**
     * @notice Gets the total subscriptions
     */
    function totalSubscriptions() public view returns(uint256) {
        return subscriptionIds.length;
    }

    /**
     * @notice Gets the total subscriptions
     */
    function getSubscriptionAtIndex(uint256 index) public view returns (uint256 durationInSeconds, uint256 amount, address recipient, address tokenAddress, string tokenURI) {
        require (index < subscriptionIds.length, "Index too large");
        return getSubscription(subscriptionIds[index]);
    }

    /**
     * @notice Initializes the app
     */
    function initialize(string name, string symbol) onlyInit public {
        _name = name;
        _symbol = symbol;
        gracePeriod = 24 * 60 * 60; // grace period of 1 day
        initialized();
    }

    /**
     * @notice Gets the URI of the token
     */
    function getURI(uint256 tokenId) public view returns (string) {
        return subscriptions[payments[tokenId].subscriptionId].tokenURI;
    }

    /**
     * @notice Gets the Payment info by tokenId
     */
    function getPaymentAndSubscription(uint256 tokenId) public view returns (address tokenRecipient, uint256 subscriptionId, uint256 paymentTime, uint256 durationInSeconds, uint256 amount, address recipient, address tokenAddress, string tokenURI) {
        Payment memory pay = payments[tokenId];
        Subscription memory sub = subscriptions[pay.subscriptionId];
        require(sub.exists, "Subscription doesn't exist");

        return (pay.tokenRecipient, pay.subscriptionId, pay.paymentTime, sub.durationInSeconds, sub.amount, sub.recipient, sub.tokenAddress, sub.tokenURI);
    }

    /**
     * @notice Gets the Subscription info by subscriptionId
     */
    function getSubscription(uint256 subscriptionId) public view returns (uint256 durationInSeconds, uint256 amount, address recipient, address tokenAddress, string tokenURI) {
        require(subscriptions[subscriptionId].exists, "Subscription doesn't exist");
        Subscription memory sub = subscriptions[subscriptionId];
        return (sub.durationInSeconds, sub.amount, sub.recipient, sub.tokenAddress, sub.tokenURI);
    }

    /**
     * @notice Check time since last payment.
     */
    function sinceLastExecution(uint256 subscriptionId, address subscriber) public view returns(uint64) {
        return getTimestamp64() - instances[subscriber][subscriptionId].lastExecuted;
    }

    /**
     * @notice Check last payment for a Subscription
     */
    function checkSubscription(uint256 _subscriptionId, address _subscriber) public view
    returns (uint256 subscriptionId, address subscriber, uint64 _timeSinceLastExecution, uint256 lastNFT) {
        uint64 lastExecuted = instances[_subscriber][_subscriptionId].lastExecuted;
        uint256 nftId = uint256(keccak256(abi.encodePacked(_subscriptionId, _subscriber, lastExecuted)));
        return (_subscriptionId, _subscriber, getTimestamp64() - lastExecuted, nftId);
    }

    /**
     * @notice Subscribe to a subscription
     */
    function subscribe(uint256 subscriptionId) public isInitialized {
        require(subscriptions[subscriptionId].exists, "Subscription must exist");
        require(!instances[msg.sender][subscriptionId].exists, "Subscription instance already exists");
        subscriptions[subscriptionId].active += 1;
        instances[msg.sender][subscriptionId].exists = true;
        instances[msg.sender][subscriptionId].startTime = getTimestamp64();
        emit Subscribed(msg.sender, subscriptionId);
        require(execute(subscriptionId, msg.sender), "Failed to execute new subscription");
    }

    /**
     * @notice Unsubscribe from a subscription
     */
    function unsubscribe(uint256 subscriptionId) public {
        require(subscriptions[subscriptionId].exists, "Subscription must exist");
        require(instances[msg.sender][subscriptionId].exists, "Subscription instance doesn't exists");
        subscriptions[subscriptionId].active -= 1;
        delete(instances[msg.sender][subscriptionId]);
        emit Unsubscribed(msg.sender, subscriptionId);
    }

    /**
     * @notice Invalidate a subscription
     */
    function invalidate(uint256 subscriptionId, address recipient) public isInitialized {
        require(instances[recipient][subscriptionId].exists, "Instance must exist");
        require(uint256(sinceLastExecution(subscriptionId, recipient)) >= uint256(subscriptions[subscriptionId].durationInSeconds).add(gracePeriod), "Grace period hasn't passed");
        subscriptions[subscriptionId].active -= 1;
        delete(instances[recipient][subscriptionId]);
        emit Unsubscribed(recipient, subscriptionId);
    }

    /**
     * @notice Collect dues from subscribers
     */
    function execute(uint256 subscriptionId, address tokenRecipient) public returns (bool) {
        require(subscriptions[subscriptionId].exists, "Subscription must exist");
        require(instances[tokenRecipient][subscriptionId].exists, "Instance must exist");
        // sinceLastExecution = current time - lastExecuted
        // sinceLastExecution = current time - 0 = current time;
        // if sinceLastExecution === current time, current time will be > subscription duration in seconds
        // (unless the duration in seconds is > ~50 years)
        // UPDATE: I added a require on newSubscription to make sure that won't happen.
        require(sinceLastExecution(subscriptionId, tokenRecipient) >= subscriptions[subscriptionId].durationInSeconds, "Already executed this period");

        address subscriptionRecipient = subscriptions[subscriptionId].recipient;
        require(SafeERC20.safeTransferFrom(ERC20(subscriptions[subscriptionId].tokenAddress), tokenRecipient, subscriptionRecipient, subscriptions[subscriptionId].amount),
            "Payment not successful");
        emit Executed(tokenRecipient, subscriptionId);

        uint64 paymentTime = getTimestamp64();
        uint256 nftId = uint256(keccak256(abi.encodePacked(subscriptionId, tokenRecipient, paymentTime)));

        _mint(tokenRecipient, nftId);
        instances[tokenRecipient][subscriptionId].lastExecuted = paymentTime;

        // this info will be relevant for NFT
        payments[nftId].tokenRecipient = tokenRecipient;
        payments[nftId].subscriptionId = subscriptionId;
        payments[nftId].paymentTime = paymentTime;

        return true;
    }
}