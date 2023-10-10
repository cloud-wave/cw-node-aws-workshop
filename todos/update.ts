import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

const rawDynamoClient = new DynamoDBClient({ region: 'ap-southeast-2' });

const dynamoClient = DynamoDBDocumentClient.from(rawDynamoClient);

interface IUpdatableFields {
  text?: string;
  checked?: boolean;
}

function getUpdateExpression (changes: IUpdatableFields) {
  return Object.keys(changes).map(key => `#${key} = :${key}`).join(', ');
}

function getExpressionAttributeNames (changes: IUpdatableFields) {
  return Object.keys(changes).reduce((names, key) => ({ ...names,[`#${key}`]: key }), {});
}

function getExpressionAttributeValues (changes: IUpdatableFields) {
  return Object.keys(changes).reduce((values, key) => ({ ...values, [`:${key}`]: changes[key] }), {});
}

module.exports.update = async (event: APIGatewayProxyEvent) => {
  try {
    const data = JSON.parse(event.body);

    if (!data.text && !data.checked) {
      return {
        statusCode: 400,
        body: 'Text or checked must be provided'
      };
    }

    if ((data.text && typeof data.text !== 'string' || 'checked' in data && typeof data.checked !== 'boolean')) {
      return {
        statusCode: 400,
        body: 'Text or checked are invalid types'
      };
    }

    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: event.pathParameters.id },
      ReturnValues: 'ALL_NEW',
      UpdateExpression: `SET ${getUpdateExpression(data)}, #updatedAt = :updatedAt`,
      ExpressionAttributeNames: { ...getExpressionAttributeNames(data), '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: { ...getExpressionAttributeValues(data), ':updatedAt': new Date().getTime() }
    };

    const updated = await dynamoClient.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify(updated.Attributes)
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: e.toString()
    };
  }
};
