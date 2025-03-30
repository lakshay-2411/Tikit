// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketStaking is ERC1155Holder, Ownable {
    IERC1155 public ticketContract;

    struct Stake {
        uint256 eventId;
        uint256 timestamp;
        uint256 amount;
    }

    mapping(address => Stake) public stakes;
    mapping(address => uint256) public rewards;

    uint256 public constant MINIMUM_STAKE_TIME = 30 days;
    uint256 public constant REWARD_RATE = 10; // 10% discount per month staked

    event Staked(
        address indexed user,
        uint256 eventId,
        uint256 amount,
        uint256 timestamp
    );
    event Unstaked(
        address indexed user,
        uint256 eventId,
        uint256 amount,
        uint256 reward
    );

    constructor(address _ticketContract) Ownable(msg.sender) {
        ticketContract = IERC1155(_ticketContract);
    }

    function stake(uint256 eventId, uint256 amount) public {
        require(amount > 0, "Cannot stake 0 tickets");
        require(
            ticketContract.balanceOf(msg.sender, eventId) >= amount,
            "Insufficient tickets"
        );

        ticketContract.safeTransferFrom(
            msg.sender,
            address(this),
            eventId,
            amount,
            ""
        );

        stakes[msg.sender] = Stake(eventId, block.timestamp, amount);

        emit Staked(msg.sender, eventId, amount, block.timestamp);
    }

    function unstake() public {
        Stake memory userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");

        uint256 stakingDuration = block.timestamp - userStake.timestamp;
        require(
            stakingDuration >= MINIMUM_STAKE_TIME,
            "Minimum stake time not met"
        );

        uint256 monthsStaked = stakingDuration / 30 days;
        uint256 discount = REWARD_RATE * monthsStaked;
        if (discount > 50) discount = 50;

        rewards[msg.sender] = discount;

        ticketContract.safeTransferFrom(
            address(this),
            msg.sender,
            userStake.eventId,
            userStake.amount,
            ""
        );

        delete stakes[msg.sender];

        emit Unstaked(
            msg.sender,
            userStake.eventId,
            userStake.amount,
            discount
        );
    }

    function getStakeInfo(
        address user
    )
        public
        view
        returns (
            uint256 eventId,
            uint256 timestamp,
            uint256 amount,
            uint256 potentialReward
        )
    {
        Stake memory userStake = stakes[user];
        uint256 stakingDuration = block.timestamp - userStake.timestamp;
        uint256 monthsStaked = stakingDuration / 30 days;
        uint256 discount = REWARD_RATE * monthsStaked;
        if (discount > 50) discount = 50;

        return (
            userStake.eventId,
            userStake.timestamp,
            userStake.amount,
            discount
        );
    }
}