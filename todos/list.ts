import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

const rawDynamoClient = new DynamoDBClient({ region: 'ap-southeast-2' });

const dynamoClient = DynamoDBDocumentClient.from(rawDynamoClient);

module.exports.list = async (event: APIGatewayProxyEvent) => {
  try {
    const queryParams = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE
    });

    const resp = await dynamoClient.send(queryParams);

    return {
      statusCode: 200,
      body: JSON.stringify(resp.Items)
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: e.toString()
    };
  }
};
