// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

pragma experimental ABIEncoderV2;


contract Copyright{
    struct User{
        string id;
        string name;
        string email;
        string phoneNumber;

        bool created;
    }   

    event UserCreatedEvent(
        string id,
        string name,
        string email,
        string phoneNumber
    );

    event UserChecked(string id, bool result);

    event WorkAdded(string imageHash, string ownerAddress, string title, string link);

    struct Work{
        string imageHash;
        string ownerAddress;
        string title;
        string link;
    } 

    address public adminAddress;

    mapping(string => User) public ownerDetails;

    mapping(string => Work[]) public ownerWorks;

    Work[] public allWorks;

    constructor(){
        adminAddress = msg.sender;
    }       

    function checkUserExists(string memory id) public view returns (bool){
        return ownerDetails[id].created;
    }


    function addNewCopyrightOwner(
        string memory id,
        string memory name,
        string memory email,
        string memory phoneNumber
    ) public {
        require(ownerDetails[id].created == false, "User with that id already exists");

        ownerDetails[id] = User({
            id: id,
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            created: true
        });

        emit UserCreatedEvent(
            id,
            name,
            email,
            phoneNumber
        );
    }

    function addNewWork(
        string memory ownerAddress,
        string memory perceptualHash,
        string memory title,
        string memory link
    ) public {
        Work memory work = Work({
            imageHash: perceptualHash,
            ownerAddress: ownerAddress,
            title: title,
            link: link
        });

        ownerWorks[ownerAddress].push(work);
        allWorks.push(work);

        emit WorkAdded(perceptualHash, ownerAddress, title, link);
    }


    function getUserWorks(string memory ownerAddress)
         public view returns (Work[] memory){
        return ownerWorks[ownerAddress];
    }
}