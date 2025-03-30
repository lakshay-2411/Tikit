// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicket is ERC1155, Ownable, IERC1155Receiver {
    uint256 private _nextEventId = 1;

    struct Event {
        uint256 eventId;
        string name;
        string description;
        uint256 maxParticipants;
        uint256 basePrice;
        uint256 currentSupply;
        string cid; // 🟢 Store dynamic CID
        bool active;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => bool)) public hasResold;

    event EventCreated(
        uint256 indexed eventId,
        string name,
        uint256 maxParticipants,
        uint256 basePrice,
        string cid
    );
    event TicketPurchased(
        address indexed buyer,
        uint256 indexed eventId,
        uint256 price
    );
    event TicketResold(
        address indexed seller,
        uint256 indexed eventId,
        uint256 refundAmount
    );
    event TicketTransferred(
        address indexed from,
        address indexed to,
        uint256 indexed eventId,
        uint256 amount
    );

    constructor() ERC1155("") Ownable(msg.sender) {}

    // 🟢 ERC1155 Receiver Implementation
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    // 🟢 Create Event and Mint Tickets
    function createEvent(
        string memory name,
        string memory description,
        uint256 basePrice,
        uint256 maxParticipants,
        string memory cid // 🟢 Accept CID here
    ) public onlyOwner returns (uint256) {
        uint256 eventId = _nextEventId++;
        events[eventId] = Event(
            eventId,
            name,
            description,
            maxParticipants,
            basePrice,
            maxParticipants,
            cid,
            true
        );

        _mint(address(this), eventId, maxParticipants, "");
        emit EventCreated(eventId, name, maxParticipants, basePrice, cid);
        return eventId;
    }

    // 🟢 Get Event Metadata URI
    function getEventURI(uint256 eventId) public view returns (string memory) {
        Event memory eventDetails = events[eventId];
        require(eventDetails.eventId != 0, "Event not found");
        return
            string(
                abi.encodePacked(
                    `https://${gateway from pintata}/ipfs/`,
                    eventDetails.cid
                )
            );
    }

    // 🟢 Get Current Ticket Price
    function getCurrentPrice(uint256 eventId) public view returns (uint256) {
        Event memory eventDetails = events[eventId];
        uint256 remainingSupply = eventDetails.currentSupply;
        uint256 basePrice = eventDetails.basePrice;

        if (remainingSupply == 0) return basePrice * 3;
        uint256 supplyPercentage = (remainingSupply * 100) /
            eventDetails.maxParticipants;

        if (supplyPercentage <= 20) {
            return basePrice * 3;
        } else if (supplyPercentage <= 50) {
            return basePrice * 2;
        }
        return basePrice;
    }

    // 🟢 Buy Ticket
    function buyTicket(uint256 eventId) public payable {
        Event storage eventDetails = events[eventId];
        require(eventDetails.active, "Event is not active");
        require(eventDetails.currentSupply > 0, "Sold out");

        uint256 price = getCurrentPrice(eventId);
        require(msg.value >= price, "Insufficient payment");

        eventDetails.currentSupply--;
        _safeTransferFrom(address(this), msg.sender, eventId, 1, "");
        emit TicketPurchased(msg.sender, eventId, price);
        emit TicketTransferred(address(this), msg.sender, eventId, 1);
    }

    // 🟢 Resell Ticket
    function resellTicket(uint256 eventId) public {
        require(balanceOf(msg.sender, eventId) > 0, "No ticket owned");
        require(!hasResold[eventId][msg.sender], "Already resold");

        _safeTransferFrom(msg.sender, address(this), eventId, 1, "");
        hasResold[eventId][msg.sender] = true;
        events[eventId].currentSupply++;

        uint256 refundAmount = (getCurrentPrice(eventId) * 90) / 100;
        payable(msg.sender).transfer(refundAmount);

        emit TicketResold(msg.sender, eventId, refundAmount);
        emit TicketTransferred(msg.sender, address(this), eventId, 1);
    }

    // 🟢 Get All Events with Metadata URI
    function getAllEvents()
        public
        view
        returns (Event[] memory, string[] memory)
    {
        Event[] memory allEvents = new Event[](_nextEventId - 1);
        string[] memory uris = new string[](_nextEventId - 1);

        for (uint256 i = 1; i < _nextEventId; i++) {
            allEvents[i - 1] = events[i];
            uris[i - 1] = getEventURI(i);
        }

        return (allEvents, uris);
    }

    // 🟢 Get User Ticket Balance
    function getTicketBalance(
        address user,
        uint256 eventId
    ) public view returns (uint256) {
        return balanceOf(user, eventId);
    }

    // 🟢 Get Next Event ID
    function getNextEventId() public view returns (uint256) {
        return _nextEventId;
    }

    function getEventStats(
        uint256 eventId
    ) public view returns (uint256 sold, uint256 remaining) {
        Event storage eventInfo = events[eventId];
        uint256 soldTickets = eventInfo.currentSupply;
        uint256 remainingTickets = eventInfo.maxParticipants - soldTickets;
        return (soldTickets, remainingTickets);
    }
}
