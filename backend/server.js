import express from 'express';
import cors from 'cors';
import { reclaimprotocol } from '@reclaimprotocol/reclaim-sdk'

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.text({ type: '*/*' }))

app.listen(PORT, function() {
    console.log("Server is running on Port: " + PORT);
});

// Just a test API to check if server is working properly or not
app.get("/", function (req, res) {
  res.send("API is working properly!");
});

app.post('/generateProof', async (req, res) => {
  const sessionId = reclaimprotocol.utils.generateUuid();
  // await db.store({ ...req.body, sessionId });
  const callbackUrl = 'https://reclaim-twitter-backend.onrender.com/callback/'
  const template = await buildTemplate(callbackUrl, sessionId);
  console.log(template);
  console.log(JSON.stringify(template._template.claims));
  console.log(JSON.stringify(template.url));
  res.send({ url: template.url });
});

app.post('/callback/:sessionId', async (req, res) => {
    
  const proofs = reclaimprotocol.utils.getProofsFromRequestBody(req.body)
  console.log(proofs);
    
  const responseSelections = [{responseMatch:'\"normal_followers_count\"\:{{NUM_FOLLOWERS}},\"pinned_tweet_ids_str\"'}]
    
  let parameters = {}
  for (const proof of proofs){
      const parametersExtracted = reclaimprotocol.utils.extractParameterValues(responseSelections, proof)
      parameters = {...parameters, ...parametersExtracted}
      console.log(parameters);
  }
    
  const reclaim = new reclaimprotocol.Reclaim();

  if(await reclaim.verifyCorrectnessOfProofs(proofs)) {
    if (parameters.NUM_FOLLOWERS > 100) {
      console.log("Congrats! You have provably more than 100 followers!");
      res.send({ proof: "Congrats! You have provably more than 100 followers!" });
    }
    else {
      console.log("Oh no! You have provably less than 100 followers!");
      res.send({ proof: "Oh no! You have provably less than 100 followers!" });
    }
  }

  else {
    console.log("Incorrect Proof!");
    res.send({ proof: "Incorrect Proof!" })
  }
});

async function buildTemplate(callbackUrl, sessionId) {
  const reclaim = new reclaimprotocol.Reclaim();
  const connection = reclaim.connect(
    "Twitter Followers",  // a title that will be shown to the user
    [
      {
        provider: 'http',
        payload: {
                metadata: {
                  name: "Has more than 100 Twitter followers", // What data you're extracting from the user's profile
                  logoUrl: "https://www.freepnglogos.com/uploads/twitter-logo-png/twitter-logo-vector-png-clipart-1.png" 
                },
                url: 'https://twitter.com/home', //URL which needs to be opened to extract information from 
                method: 'GET', // HTTP Method (Allowed : GET/POST)
                login: {
                  url: 'https://twitter.com/login', // Where should the user be redirected if they're not logged in to access the above mentioned URL
                  checkLoginCookies: ['auth_token', 'twid'], // Cookies that are set when a user is logged in
                },
                responseSelections: [
                  {
                    responseMatch:'\"normal_followers_count\"\:{{NUM_FOLLOWERS}},\"pinned_tweet_ids_str\"'
                  }
                ],
                parameters: {
                }
        },
        templateClaimId: sessionId, // id for each claim for tracking if relevant proofs have been submitted by the user
      }
    ],
    callbackUrl
  );

  const template = (await connection).generateTemplate(sessionId);
  return template;
}
