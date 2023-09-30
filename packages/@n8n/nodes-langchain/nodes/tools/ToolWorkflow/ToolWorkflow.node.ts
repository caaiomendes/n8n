import type {
	IExecuteFunctions,
	IExecuteWorkflowInfo,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWorkflowBase,
	SupplyData,
	ExecutionError,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type { SetField, SetNodeOptions } from 'n8n-nodes-base/dist/nodes/Set/v2/helpers/interfaces';
import * as manual from 'n8n-nodes-base/dist/nodes/Set/v2/manual.mode';

import { DynamicTool } from 'langchain/tools';
import get from 'lodash/get';

export class ToolWorkflow implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Workflow Tool',
		name: 'toolWorkflow',
		icon: 'fa:network-wired',
		group: ['transform'],
		version: 1,
		description: 'Create a tool via a workflow',
		defaults: {
			name: 'Workflow Tool',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolworkflow/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiTool],
		outputNames: ['Tool'],
		properties: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'My Color Tool',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder:
					'Call this tool to get a random color. The input should be a string with comma separted names of colors to exclude.',
				typeOptions: {
					rows: 3,
				},
			},

			{
				displayName:
					'The workflow will receive "query" as input and the output of the last node will be returned as response',
				name: 'executeNotice',
				type: 'notice',
				default: '',
			},

			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'Database',
						value: 'database',
						description: 'Load the workflow from the database by ID',
					},
					{
						name: 'Parameter',
						value: 'parameter',
						description: 'Load the workflow from a parameter',
					},
				],
				default: 'database',
				description: 'Where to get the workflow to execute from',
			},

			// ----------------------------------
			//         source:database
			// ----------------------------------
			{
				displayName: 'Workflow ID',
				name: 'workflowId',
				type: 'string',
				displayOptions: {
					show: {
						source: ['database'],
					},
				},
				default: '',
				required: true,
				description: 'The workflow to execute',
			},

			// ----------------------------------
			//         source:parameter
			// ----------------------------------
			{
				displayName: 'Workflow JSON',
				name: 'workflowJson',
				type: 'string',
				typeOptions: {
					editor: 'json',
					rows: 10,
				},
				displayOptions: {
					show: {
						source: ['parameter'],
					},
				},
				default: '\n\n\n',
				required: true,
				description: 'The workflow JSON code to execute',
			},
			{
				displayName: 'Response Property Name',
				name: 'responsePropertyName',
				type: 'string',
				default: 'response',
				description: 'The name of the property of the last node that will be returned as response',
			},

			// ----------------------------------
			//         For all
			// ----------------------------------
			{
				displayName: 'Workflow Values',
				name: 'fields',
				placeholder: 'Add Value',
				type: 'fixedCollection',
				description: 'Set the values which should be made available in the workflow',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						name: 'values',
						displayName: 'Values',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: 'e.g. fieldName',
								description:
									'Name of the field to set the value of. Supports dot-notation. Example: data.person[0].name.',
								requiresDataPath: 'single',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								description: 'The field value type',
								// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
								options: [
									{
										name: 'String',
										value: 'stringValue',
									},
									{
										name: 'Number',
										value: 'numberValue',
									},
									{
										name: 'Boolean',
										value: 'booleanValue',
									},
									{
										name: 'Array',
										value: 'arrayValue',
									},
									{
										name: 'Object',
										value: 'objectValue',
									},
								],
								default: 'stringValue',
							},
							{
								displayName: 'Value',
								name: 'stringValue',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										type: ['stringValue'],
									},
								},
								validateType: 'string',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: 'Value',
								name: 'numberValue',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										type: ['numberValue'],
									},
								},
								validateType: 'number',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: 'Value',
								name: 'booleanValue',
								type: 'options',
								default: 'true',
								options: [
									{
										name: 'True',
										value: 'true',
									},
									{
										name: 'False',
										value: 'false',
									},
								],
								displayOptions: {
									show: {
										type: ['booleanValue'],
									},
								},
								validateType: 'boolean',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: 'Value',
								name: 'arrayValue',
								type: 'string',
								default: '',
								placeholder: 'e.g. [ arrayItem1, arrayItem2, arrayItem3 ]',
								displayOptions: {
									show: {
										type: ['arrayValue'],
									},
								},
								validateType: 'array',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: 'Value',
								name: 'objectValue',
								type: 'string',
								default: '={}',
								typeOptions: {
									editor: 'json',
									editorLanguage: 'json',
									rows: 2,
								},
								displayOptions: {
									show: {
										type: ['objectValue'],
									},
								},
								validateType: 'object',
								ignoreValidationDuringExecution: true,
							},
						],
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions): Promise<SupplyData> {
		const itemIndex = 0;

		const name = this.getNodeParameter('name', itemIndex) as string;
		const description = this.getNodeParameter('description', itemIndex) as string;

		const runFunction = async (query: string): Promise<string> => {
			const source = this.getNodeParameter('source', itemIndex) as string;
			const responsePropertyName = this.getNodeParameter(
				'responsePropertyName',
				itemIndex,
			) as string;

			const workflowInfo: IExecuteWorkflowInfo = {};
			if (source === 'database') {
				// Read workflow from database
				workflowInfo.id = this.getNodeParameter('workflowId', 0) as string;
			} else if (source === 'parameter') {
				// Read workflow from parameter
				const workflowJson = this.getNodeParameter('workflowJson', 0) as string;
				try {
					workflowInfo.code = JSON.parse(workflowJson) as IWorkflowBase;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`The provided workflow is not valid JSON: "${error.message}"`,
						{
							itemIndex,
						},
					);
				}
			}

			const rawData: IDataObject = { query };

			const workflowFieldsJson = this.getNodeParameter('fields.values', 0, [], {
				rawExpressions: true,
			}) as SetField[];

			// Copied from Set Node v2
			for (const entry of workflowFieldsJson) {
				if (entry.type === 'objectValue' && (entry.objectValue as string).startsWith('=')) {
					rawData[entry.name] = (entry.objectValue as string).replace(/^=+/, '');
				}
			}

			const options: SetNodeOptions = {
				include: 'all',
			};

			const newItem = await manual.execute.call(
				this,
				{ json: { query } },
				itemIndex,
				options,
				rawData,
				this.getNode(),
			);

			const items = [newItem] as INodeExecutionData[];

			let receivedData: INodeExecutionData;
			try {
				receivedData = (await this.executeWorkflow(workflowInfo, items)) as INodeExecutionData;
			} catch (error) {
				// Make sure a valid error gets returned that can by json-serialized else it will
				// not show up in the frontend
				throw new NodeOperationError(this.getNode(), error);
			}

			const response: string | undefined = get(receivedData, [
				0,
				0,
				'json',
				responsePropertyName,
			]) as string | undefined;
			if (response === undefined) {
				throw new NodeOperationError(
					this.getNode(),
					`There was an error: "The workflow did not return an item with the property '${responsePropertyName}'"`,
				);
			}

			return response;
		};

		return {
			response: new DynamicTool({
				name,
				description,

				func: async (query: string): Promise<string> => {
					const { index } = this.addInputData(NodeConnectionType.AiTool, [[{ json: { query } }]]);

					let response: string = '';
					let executionError: ExecutionError | undefined;
					try {
						response = await runFunction(query);
					} catch (error) {
						// TODO: Do some more testing. Issues here should actually fail the workflow
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						executionError = error;
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						response = `There was an error: "${error.message}"`;
					}

					if (typeof response === 'number') {
						response = (response as number).toString();
					}

					if (typeof response !== 'string') {
						// TODO: Do some more testing. Issues here should actually fail the workflow
						executionError = new NodeOperationError(
							this.getNode(),
							`The code did not return a valid value. Instead of a string did a value of type '${typeof response}' get returned.`,
						);
						response = `There was an error: "${executionError.message}"`;
					}

					if (executionError) {
						void this.addOutputData(NodeConnectionType.AiTool, index, executionError);
					} else {
						void this.addOutputData(NodeConnectionType.AiTool, index, [[{ json: { response } }]]);
					}
					return response;
				},
			}),
		};
	}
}
