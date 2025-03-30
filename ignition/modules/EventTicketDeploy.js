const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EventTicketDeployment", (m) => {
    // Deploy the EventTicket contract
    const eventTicket = m.contract("EventTicket");

    // Ensure the new function is callable after deployment
    const getEventStats = m.call(eventTicket, "getEventStats", [1]); // Example with eventId 1

    return { eventTicket, getEventStats };
});
