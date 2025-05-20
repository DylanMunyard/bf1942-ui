# BF42 AI
API for answering questions about BF stats using OpenAI LLM.

## Deployment
The Jenkins job will create the secret `openai-api-key` containing the API Key for OpenAI API.
- In Jenkins UI > Manage Jenkins > Credentials > System >  > Global credentials (unrestricted)
- "+ Add Credentials"
- Secret text
  - Id = OPENAI_API_KEY
  - Secret = Paste OpenAI API Key