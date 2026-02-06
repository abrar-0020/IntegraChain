// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IntegrityRegistry
 * @notice A registry for file integrity verification using SHA-256 hashes
 * @dev Stores file hashes with owner, timestamp, and optional note
 */
contract IntegrityRegistry {
    struct Record {
        address owner;
        uint64 timestamp;
        string note;
        bool exists;
    }

    // Mapping from file hash to record
    mapping(bytes32 => Record) private records;

    event HashRegistered(
        address indexed owner,
        bytes32 indexed hash,
        uint64 timestamp,
        string note
    );

    /**
     * @notice Register a file hash with optional note
     * @param hash The SHA-256 hash of the file (32 bytes)
     * @param note Optional description or label (max 80 chars)
     */
    function registerHash(bytes32 hash, string calldata note) external {
        require(hash != bytes32(0), "Hash cannot be zero");
        require(!records[hash].exists, "Hash already registered");
        require(bytes(note).length <= 80, "Note too long (max 80 chars)");

        records[hash] = Record({
            owner: msg.sender,
            timestamp: uint64(block.timestamp),
            note: note,
            exists: true
        });

        emit HashRegistered(msg.sender, hash, uint64(block.timestamp), note);
    }

    /**
     * @notice Get the record for a given hash
     * @param hash The file hash to query
     * @return exists Whether the hash is registered
     * @return owner The address that registered the hash
     * @return timestamp When the hash was registered (Unix timestamp)
     * @return note The note/label attached to the hash
     */
    function getRecord(bytes32 hash)
        external
        view
        returns (
            bool exists,
            address owner,
            uint64 timestamp,
            string memory note
        )
    {
        Record memory record = records[hash];
        return (record.exists, record.owner, record.timestamp, record.note);
    }
}
