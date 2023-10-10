import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

const rawDynamoClient = new DynamoDBClient({ region: 'ap-southeast2'});

const dynamoClient = DynamoDBDocumentClient.from(rawDynamoClient);

module.exports.update = async (event: APIGatewayProxyEvent) => {
  try {
    const data = JSON.parse(event.body);

    if (!data.text && !data.checked) {
      return {
        statusCode: 400,
        body: 'Text or checked must be provided'
      };
    }

    if ((data.text && typeof data.text !== 'string' || 'checked' in data && typeof data !== 'boolean')) {
      return {
        statusCode: 400,
        body: 'Text or checked are invalid types'
      };
    }

    const timestamp = new Date().getTime();

    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: event.pathParameters.id },
      ReturnValues: 'ALL_NEW',
      Item: {
        ...('text' in data ? { text: data.text } : {}),
        ...('checked' in data ? { checked: data.checked } : {}),
        updatedAt: timestamp
      }
    };

    const updated = await dynamoClient.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify(updated)
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: e.toString()
    };
  }
};
