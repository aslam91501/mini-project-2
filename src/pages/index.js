import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { useState } from "react";
import Abi from '../../build/contracts/Copyright.json';
import * as steg from 'ts-steganography';
import Script from 'next/script'
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";


export default function Index() {
    // console.log(prcp);
    const contractAddress = '0x1357bD2a165BDC85284fce48041897B6fe52A874';
    const [accountId, setAccountId] = useState();
    const [page, setPage] = useState('INDEX');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState([]);
    const addError = (err) => {
        if (!error.find(e => e === err))
            setError([...error, err]);
    };
    const checkUserExists = async (accountId) => {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, Abi.abi, signer);
        const exists = await contract.checkUserExists(accountId);
        console.log(exists);
        return exists;
    };

    const getUserWorks = async (accountId) => {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, Abi.abi, signer);
        const works = await contract.getUserWorks(accountId);
        console.log(works);
        return works;
    };
    
    const onclickHandler = () => {
        setLoading(true);
        detectEthereumProvider().then(provider => {
            setLoading(false);
            if (!provider)
                addError("Metamask is not installed");
            else {
                if (provider !== window.ethereum) {
                    addError("Cannot detect wallet properly. Do you have multiple wallets installed?");
                }
                else {
                    window.ethereum.request({ method: 'eth_requestAccounts' })
                        .then(accounts => {
                        if (accounts.length === 0)
                            addError("Could not connect to account!");
                        else {
                            let accountId = accounts[0];
                            setError([]);
                            setAccountId(accountId);
                            checkUserExists(accountId).then(exists => {
                                if (exists)
                                    setPage('UPLOAD');
                                else
                                    setPage('REGISTER');
                            });
                        }
                    })
                        .catch(err => {
                        addError("Could not connect to account!");
                    });
                }
            }
        });
    };
    const [registerFormData, setRegisterFormData] = useState({
        name: '',
        email: '',
        phoneNumber: ''
    });
    const handleRegisterFormChange = (event) => {
        setRegisterFormData(prev => {
            return { ...prev, [event.target.name]: event.target.value };
        });
        console.log(registerFormData);
    };
    const createUser = async (data) => {
        const provider = new ethers.JsonRpcProvider("HTTP://127.0.0.1:7545");
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, Abi.abi, signer);
        console.log(data);
        const transaction = await contract.addNewCopyrightOwner(accountId, data.name, data.email, data.phoneNumber);
        transaction.wait();
    };
    const onSubmit = (event) => {
        event.preventDefault();
        createUser(registerFormData).then(() => { setPage('UPLOAD'); }).catch(err => console.log(err));
    };
    const [file, setFile] = useState();
    const [newUrl, setNewUrl] = useState();
    const [hidden, setHidden] = useState();

    const extractId = async (link) => {
      const text = await steg.decode(link);
      // greater than 42 characters
      if(!text || text?.length < 42){
        return null;
      } else return text.substring(0, 42);
    }

    const addWatermark = async (link) => {
        console.log("Adding watermark....");
        // const encodeUrl = await dw.transformImageUrlWithText(link, accountId!, 1);
        const encodeUrl = await steg.encode(accountId, link);
        const text = await steg.decode(encodeUrl);
        setHidden(text);
        return encodeUrl;
    };
    const addWork = async (hash, title, link) => {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, Abi.abi, signer);
        const transaction = await contract.addNewWork(accountId, hash, title, link);
        transaction.wait();
    };
    const onFileUpload = (event) => {
		setNewUrl(undefined);
		setFile(undefined);

        const f = event.target.files[0];
        setFile(f);

        const link = URL.createObjectURL(f);

        extractId(link).then(userId => {
			if(userId !== null){
				checkUserExists(userId).then(exists => {
					if(exists){
					toast.error("The Image is already copyrighted.")
					} 
				})
			}
			else{
				addWatermark(link).then(result => {
					setNewUrl(result);
					const formData = new FormData();
					formData.append('file', f);

                    axios.post('http://localhost:8081', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data'
                        }
                    }).then(fileURL => {
                        console.log(fileURL);

                        const pHash = window.pHash;
                        pHash.hash(f).then(hash => {
                            addWork(hash.toHex(), f.name, fileURL.data).then(result => console.log("Work Added")); 
                            console.log(hash.toHex());
                        })
                    }).catch(err => console.log(err));
                })
				
					
			}
		})
    };

    const [works, setWorks] = useState();

    const onFileVerifyUpload = (event) => {
        setWorks(undefined);
        const f = event.target.files[0];

		const pHash = window.pHash;

		extractId(URL.createObjectURL(f)).then(userId => {
            console.log(userId);
			if(userId !== null){
				checkUserExists(userId).then(exists => {
					if(exists){
					    toast("The Image is already copyrighted.")
                        getUserWorks(userId).then(result => {
                            let parsed = JSON.parse(JSON.stringify(result))

                            let myWorks = [];
                            

                            parsed.forEach(w => {
                                fetch(w[3]).then(response => response.blob())
                                .then(blob => {
                                    const temp = new File([blob], 'image.png', {type: blob.type});
                                    pHash.compare(f, temp).then(distance => {
                                        console.log(distance);
                                    })
                                })
                            })

                            setWorks(parsed);
                        });
					} 
				})
			}

			// pHash.hash(f).then(hash => {addWork(hash.toHex(), f.name); console.log(hash.toHex());})

		})
    };


    return (<>
      <Toaster />
      <Script src="https://cdn.jsdelivr.net/npm/phash-js/dist/phash.js" />

	<style>
	</style>

      <nav className="w-full h-20 bg-blue-500 shadow-xl text-white">
		<div className="flex items-center justify-between h-full px-20">
			<section className="text-lg font-sans tracking-wide">Copyright Manager</section>
			<section className="flex items-center gap-3">
				<span className={(page === 'UPLOAD') ? "hover:cursor-pointer underline underline-offset-8" : "hover:cursor-pointer text-white"}
					onClick={() => setPage('UPLOAD')}>
						Upload
				</span>
				<span className={(page === 'VERIFY') ? "hover:cursor-pointer underline underline-offset-8" : "hover:cursor-pointer text-white"}
					onClick={() => setPage('VERIFY')}>
						Verify
				</span>
			</section>
		</div>
      </nav>     

			<div className="min-h-screen w-screen max-w-full text-gray-900
				bg-neutral-50 flex py-10 px-32">   				
				{page === 'INDEX' &&
            	<div className="flex flex-col gap-5 items-center justify-center w-full">
					{error.length > 0 &&
                    <span className="text-red-700 text-sm bg-red-300 rounded-md p-4">
						{error.map(err => <>{err} <br /></>)}
					</span>
					}

					<button className="bg-blue-500 text-lg text-white px-10 py-5
						rounded-full capitalize hover:bg-blue-600 transition-colors" onClick={onclickHandler}>
						{loading ? "Loading" : "access your account"}
					</button>


					<span className="text-xs text-gray-500 text-center">MetaMask Required</span>
				</div>
				}


				{page === 'REGISTER' &&
            		<div className="p-10 flex flex-col gap-4">
						<h2 className="text-2xl">Register</h2>

						<form className="flex flex-col gap-2 w-1/3" onSubmit={(e) => onSubmit(e)}>
							<input type="text" name="name" onChange={(e) => handleRegisterFormChange(e)} required className="rounded-full px-3 w-72" placeholder="Name"/>

							<input name="email" onChange={(e) => handleRegisterFormChange(e)} type="email" required className="rounded-full px-3 w-72" placeholder="Email"/>
							
							<input name="phoneNumber" onChange={(e) => handleRegisterFormChange(e)} type="text" required className="rounded-full px-3 w-72" placeholder="Phone Number"/>

							<input type="submit" value="Register" className="bg-blue-500 hover:bg-blue-600 transition-colors hover:cursor-pointer px-3 py-2 rounded-full text-white"/>
						</form>
					</div>
				}


				{page === 'UPLOAD' && 
				<div>
					<h1 className="text-2xl">Upload</h1>
					<p className="mt-7 text-sm">Select an image to upload. We will embed your user key into the image using steganography. The image hash, file name and its link are then stored in the blockchain. This information can be used to verify other imagest against this one to check copyright infringement.</p>
					<form className="mt-7">
						<input type="file" name="fileUpload" id="fileUpload" accept=".png,.jpg" onChange={(e) => { onFileUpload(e); console.log("bzzz"); }}/>

						<div className="flex gap-4 mt-8 text-gray-900">
							
						</div>
					
					</form>

					{newUrl && 
					<a href={newUrl} download className="inline-block hover:scale-90 transition-all">
						<img src={newUrl} className="w-96"/>
					</a>
					}
					{hidden && newUrl && <>
						<p className="mt-7">The following text (your user id) is embedded into the above image.</p>
						<p className="bg-blue-300 inline-block p-3 mt-2">{hidden.substring(0, 42)}</p>
					</>}
				</div>
				}

				{page === 'VERIFY' && 
				<div>
					<h1 className="text-2xl">Verify</h1>
					<p className="mt-7 text-sm">Select an image to upload. We will verify if that image is already logged in our system. This is done by checking whether the image contains a user key, a message is shown.</p>
					<form className="mt-7">
						<input type="file" name="fileVerifyUpload" id="fileVerifyUpload" accept=".png,.jpg" onChange={(e) => { onFileVerifyUpload(e); console.log("bzzz"); }}/>
					</form>

                    {works && works.length > 0 && 
                    <div className="mt-7 flex max-w-screen flex-wrap gap-2">
                        {works.map(work => {
                            return <>
                                <img src={work[3]} alt="" srcset="" className="w-80 border-blue-500 border-4" />
                            </>
                        })}
                    </div>
                    }
				</div>
				}
			</div>
		</>);
}
