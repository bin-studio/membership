const ethers = require('ethers');
const MembershipApp = require('../../membership/build/contracts/MembershipApp.json')
const abi = MembershipApp.abi
let contractAddress = '0xA15Cc45A8751bCC2794FdD955ec49Efc9615E4Cc'

export async function handler(event, context) {
    // console.log({event, context})

    // let provider = ethers.getDefaultProvider('rinkeby');

    try {
        const tokenID = event.queryStringParameters.tokenID
        let provider = new ethers.providers.JsonRpcProvider();
        let contract = new ethers.Contract(contractAddress, abi, provider);

        let currentValue = await contract.getPaymentAndSubscription(tokenID);
        console.log({currentValue})
        // const durationInSeconds = await web3.contract(Subscription).
        return {
            statusCode: 200,
            body: JSON.stringify({
                "name": "Membership Token",
                "description": `This is a membership token that is valid from ${startDate} 'til ${endDate}.`,
                "external_url": `https://foobar.com/${tokenID}`,
                "image": `https://dummyimage.com/600x600/000/fff&text=${tokenID}`,
                "attributes": [
                    {
                        "trait_type": "durationInSeconds", 
                        "value": durationInSeconds
                    },
                    {
                        "trait_type": "durationInHours", 
                        "value": durationInHours
                    },
                    {
                        "trait_type": "durationInDays", 
                        "value": durationInDays
                    },
                    {
                        "trait_type": "durationInMonths", 
                        "value": durationInMonths
                    },
                ]
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: error.message
        };
    }
  }