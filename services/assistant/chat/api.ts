import OpenAI from 'openai'
const openai = new OpenAI()
import { getUserId, getJwtToken } from '../../core/auth'
import { APIGatewayEvent } from 'aws-lambda'

import { createChatSession } from './db'
import { getAssistantByUserId } from '../openai/db'

export async function createSession(event: APIGatewayEvent) {
  console.log('Event:', event)
  const userId = getUserId(event)
  console.log('User ID:', userId)
  const jwtToken = getJwtToken(event)
  console.log('JWT Token:', jwtToken)
  const assistant = await getAssistantByUserId(userId)

  const response = await openai.beta.threads.create()
  console.log('Thread:', response)

  const threadId = response.id

  const sessionId = await createChatSession(
    userId,
    assistant?.openai_assistant_id,
    threadId,
    jwtToken
  )
  console.log('Session:', sessionId)

  // Because the lambda function is of type RESPONSE_STREAM, we can't proxy it through API Gateway and we can't use a custom domain.
  // This is why we need to return the stream URL to the client so it can connect directly to the lambda function.
  return {
    statusCode: 200,
    body: JSON.stringify({
      stream_url: process.env.STREAM_URL + '?session_id=' + sessionId
    })
  }
}
