import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const rawDynamoClient = new DynamoDBClient({ region: 'ap-southeast-2' });

const dynamoClient = DynamoDBDocumentClient.from(rawDynamoClient);

module.exports.create = async (event: APIGatewayProxyEvent) => {
  try {
    const timestamp = new Date().getTime();
    const data = JSON.parse(event.body);

    if (!data.text || typeof data.text !== 'string') {
      console.error('Validation Failed');

      return {
        statusCode: 400,
        body: 'Text wasn\'t a valid string'
      };
    }

    const newId = uuidv4();

    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: newId },
      Item: {
        id: newId,
        text: data.text,
        checked: false,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };

    await dynamoClient.send(new PutCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify(params.Item)
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: e.toString()
    };
  }
};
