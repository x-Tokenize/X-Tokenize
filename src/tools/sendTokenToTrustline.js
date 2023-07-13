export const sendTokenToTrustline = async(networkRPC,sender)=>{
        try{
            let accountLinesResponse = await getAccountLines(networkRPC,sender)
           
            if(accountLinesResponse.result!=='success') return {result:'warn',message:'There was a problem getting the account lines.'}
            else
            {
                let {lines} = accountLinesResponse
                console.log(lines)
            }
        }
        catch(err)
        {
            console.log('There was aproblem sending the token to the trustline: ',err)

        }
}