import React from 'react'
import { useAccount , useWriteContract } from 'wagmi'
import { config } from '../configs/WagmiConfig'
import abi from '../contracts/EventTicket.json'
import { eventTicketAddress } from '../constants/constant'

export default function CreateEvent() {
    const [image, setImage] = React.useState(null)
    const [name, setName] = React.useState('')
    const [description, setDescription] = React.useState('')
    const [price, setPrice] = React.useState('')
    const [participants , setParticipants] = React.useState('')
    const [category , setCategory] = React.useState('')

    const {write} = useWriteContract(config , {
        abi,
        address : eventTicketAddress,
        functionName : 'createEvent'
    });

    const uploadToIpfs = async () => {
        if(!image || !name || !description || !price || !participants){
            alert('Please fill all the fields')
            return;
        }
        const formData = new FormData();
        formData.append('file', image);
        const metadata = JSON.stringify({
            name,
            description,
            price,
            participants
        });
        formData.append('pinata' , metadata);

        const option = JSON.stringify({cidVersion : 1});
        const request = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method : 'POST',
            headers : {
                Authorization : `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
                body : formData
            }
        });
        const rewponse = await request.json();
        if(!response || !response.data || !response.data.secure_url){
            alert('Error uploading image to ipfs');
            return;
        }
        return response.data.secure_url;
    }


    const handleMint = async () => {
        const ipfsUrl = await uploadToIpfs();
        if(!ipfsUrl) return;
        await write(name, description, price, participants, ipfsUrl)
    }

    return (
        <div>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input type="number" placeholder="Participants" value={participants} onChange={(e) => setParticipants(e.target.value)} />
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="music">Music</option>
                <option value="art">Art</option>
                <option value="sport">Sport</option>
            </select>
            <button onClick={handleMint}>Create Event</button>
        </div>
    )

}