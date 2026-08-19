import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

type KlinkyVariant = {
	label: string;
	destination_url: string;
	weight: number;
};

type VariantCollectionItem = {
	label: string;
	destinationUrl: string;
	weight: number;
};

type GeoRuleItem = {
	countryCode: string;
	variantLabel: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVariantCollectionItem(value: unknown): value is VariantCollectionItem {
	return (
		isRecord(value) &&
		typeof value.label === 'string' &&
		typeof value.destinationUrl === 'string' &&
		typeof value.weight === 'number'
	);
}

function isGeoRuleItem(value: unknown): value is GeoRuleItem {
	return (
		isRecord(value) &&
		typeof value.countryCode === 'string' &&
		typeof value.variantLabel === 'string'
	);
}

function buildVariantsFromCollection(
	context: IExecuteFunctions,
	items: unknown,
	itemIndex: number,
): KlinkyVariant[] {
	if (!Array.isArray(items)) {
		throw new NodeOperationError(context.getNode(), 'Variants must be provided as a list.', {
			itemIndex,
		});
	}

	const variants: KlinkyVariant[] = [];
	for (const item of items) {
		if (!isVariantCollectionItem(item)) {
			throw new NodeOperationError(
				context.getNode(),
				'Each variant needs a label, destination URL, and weight.',
				{ itemIndex },
			);
		}

		variants.push({
			label: item.label,
			destination_url: item.destinationUrl,
			weight: item.weight,
		});
	}

	if (variants.length === 0) {
		throw new NodeOperationError(context.getNode(), 'Add at least one variant.', { itemIndex });
	}

	return variants;
}

function buildGeoRulesFromCollection(
	items: unknown,
	defaultVariant: string,
): Record<string, string> {
	const geoRules: Record<string, string> = { default: defaultVariant };

	if (!Array.isArray(items)) {
		return geoRules;
	}

	for (const item of items) {
		if (!isGeoRuleItem(item)) {
			continue;
		}

		const countryCode = item.countryCode.trim().toUpperCase();
		if (!countryCode || countryCode === 'DEFAULT') {
			continue;
		}

		geoRules[countryCode] = item.variantLabel;
	}

	return geoRules;
}

function pushResponseItems(
	returnData: INodeExecutionData[],
	responseData: unknown,
	pairedItemIndex: number,
): void {
	if (Array.isArray(responseData)) {
		for (const row of responseData) {
			returnData.push({
				json: row as IDataObject,
				pairedItem: { item: pairedItemIndex },
			});
		}
		return;
	}

	if (isRecord(responseData) && Array.isArray(responseData.items)) {
		for (const row of responseData.items) {
			returnData.push({
				json: row as IDataObject,
				pairedItem: { item: pairedItemIndex },
			});
		}
		return;
	}

	if (isRecord(responseData)) {
		returnData.push({
			json: responseData as IDataObject,
			pairedItem: { item: pairedItemIndex },
		});
	}
}

async function klinkyApiRequest(
	context: IExecuteFunctions,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	path: string,
	index: number,
	body?: IDataObject | IDataObject[] | undefined,
	qs?: IDataObject,
	headers?: IDataObject,
) {
	const credentials = await context.getCredentials('klinkyApi', index);
	const requestOptions: IDataObject = {
		baseURL: credentials.baseUrl as string,
		url: path,
		method,
		body,
		qs,
		json: true,
	};

	if (headers && Object.keys(headers).length > 0) {
		requestOptions.headers = headers;
	}

	return context.helpers.requestWithAuthentication.call(context, 'klinkyApi', requestOptions);
}

const variantFields: INodeProperties[] = [
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		default: 'control',
		required: true,
		description: 'Variant label used in analytics and geo rules',
	},
	{
		displayName: 'Destination URL',
		name: 'destinationUrl',
		type: 'string',
		default: 'https://example.com',
		required: true,
	},
	{
		displayName: 'Weight',
		name: 'weight',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 100,
		},
		default: 100,
		required: true,
		description: 'Traffic share for this variant. All weights must sum to 100.',
	},
];

export class Klinky implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Klinky',
		name: 'klinky',
		icon: 'file:klinky.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create and manage Klinky smart links from n8n workflows',
		defaults: {
			name: 'Klinky',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'klinkyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Link',
						value: 'link',
					},
				],
				default: 'link',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['link'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', action: 'Create a link' },
					{ name: 'Delete', value: 'delete', action: 'Delete a link' },
					{ name: 'Get', value: 'get', action: 'Get a link' },
					{ name: 'Get Clicks', value: 'getClicks', action: 'Get clicks for a link' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many links' },
					{ name: 'Update', value: 'update', action: 'Update a link' },
					{ name: 'Update Variants', value: 'updateVariants', action: 'Update link variants' },
				],
				default: 'create',
			},
			{
				displayName: 'Link ID',
				name: 'linkId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'update', 'updateVariants', 'delete', 'getClicks'],
					},
				},
				description: 'UUID of the Klinky link',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Slug',
				name: 'slug',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Optional custom slug. Leave empty to auto-generate.',
			},
			{
				displayName: 'Link Type',
				name: 'routingType',
				type: 'options',
				options: [
					{ name: 'Single Destination', value: 'single' },
					{ name: 'A/B Test', value: 'ab_test' },
					{ name: 'Geo Routing', value: 'geo' },
				],
				default: 'single',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Destination URL',
				name: 'singleDestinationUrl',
				type: 'string',
				default: 'https://example.com',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
						routingType: ['single'],
					},
				},
			},
			{
				displayName: 'Variant Label',
				name: 'singleVariantLabel',
				type: 'string',
				default: 'main',
				displayOptions: {
					show: {
						operation: ['create'],
						routingType: ['single'],
					},
				},
			},
			{
				displayName: 'Variants',
				name: 'variants',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {
					variant: [
						{
							label: 'control',
							destinationUrl: 'https://example.com/control',
							weight: 50,
						},
						{
							label: 'variant_b',
							destinationUrl: 'https://example.com/variant-b',
							weight: 50,
						},
					],
				},
				options: [
					{
						displayName: 'Variant',
						name: 'variant',
						values: variantFields,
					},
				],
				displayOptions: {
					show: {
						operation: ['create'],
						routingType: ['ab_test', 'geo'],
					},
				},
				description: 'Variant destinations and traffic weights. Weights must sum to 100.',
			},
			{
				displayName: 'Variants',
				name: 'updateVariantsList',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {
					variant: [
						{
							label: 'control',
							destinationUrl: 'https://example.com/control',
							weight: 50,
						},
						{
							label: 'variant_b',
							destinationUrl: 'https://example.com/variant-b',
							weight: 50,
						},
					],
				},
				options: [
					{
						displayName: 'Variant',
						name: 'variant',
						values: variantFields,
					},
				],
				displayOptions: {
					show: {
						operation: ['updateVariants'],
					},
				},
				description: 'Replace all variant destinations and weights on the link',
			},
			{
				displayName: 'Default Variant Label',
				name: 'defaultGeoVariant',
				type: 'string',
				default: 'control',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
						routingType: ['geo'],
					},
				},
				description: 'Variant label used when no country rule matches',
			},
			{
				displayName: 'Update Geo Rules',
				name: 'updateGeoRules',
				type: 'boolean',
				default: false,
				description: 'Whether to replace geo routing rules on the link',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
			},
			{
				displayName: 'Default Variant Label',
				name: 'updateDefaultGeoVariant',
				type: 'string',
				default: 'control',
				required: true,
				displayOptions: {
					show: {
						operation: ['update'],
						updateGeoRules: [true],
					},
				},
			},
			{
				displayName: 'Country Rules',
				name: 'geoRules',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {
					rule: [{ countryCode: 'US', variantLabel: 'control' }],
				},
				options: [
					{
						displayName: 'Rule',
						name: 'rule',
						values: [
							{
								displayName: 'Country Code',
								name: 'countryCode',
								type: 'string',
								default: 'US',
								required: true,
								description: 'ISO country code such as US, DE, or GB',
							},
							{
								displayName: 'Variant Label',
								name: 'variantLabel',
								type: 'string',
								default: 'control',
								required: true,
							},
						],
					},
				],
				displayOptions: {
					show: {
						operation: ['create'],
						routingType: ['geo'],
					},
				},
			},
			{
				displayName: 'Country Rules',
				name: 'updateGeoRulesList',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {
					rule: [{ countryCode: 'US', variantLabel: 'control' }],
				},
				options: [
					{
						displayName: 'Rule',
						name: 'rule',
						values: [
							{
								displayName: 'Country Code',
								name: 'countryCode',
								type: 'string',
								default: 'US',
								required: true,
							},
							{
								displayName: 'Variant Label',
								name: 'variantLabel',
								type: 'string',
								default: 'control',
								required: true,
							},
						],
					},
				],
				displayOptions: {
					show: {
						operation: ['update'],
						updateGeoRules: [true],
					},
				},
			},
			{
				displayName: 'Enable Conversion Tracking',
				name: 'enableConversionTracking',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Whether conversion tracking should be enabled for the link',
			},
			{
				displayName: 'Conversion Redirect URL',
				name: 'conversionRedirectUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Auto Winner Review',
				name: 'autoWinner',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Whether to enable automatic winner review in Klinky',
			},
			{
				displayName: 'Auto Winner Threshold',
				name: 'autoWinnerThreshold',
				type: 'number',
				typeOptions: {
					minValue: 10,
				},
				default: 100,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
						autoWinner: [true],
					},
				},
			},
			{
				displayName: 'Set Active State',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the link should remain active',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
			},
			{
				displayName: 'Updated Name',
				name: 'updatedName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['getAll', 'getClicks'],
					},
				},
			},
			{
				displayName: 'Per Page',
				name: 'perPage',
				type: 'number',
				default: 20,
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				displayOptions: {
					show: {
						operation: ['getAll', 'getClicks'],
					},
				},
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['getClicks'],
					},
				},
				description: 'Optional ISO date/time lower bound',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['getClicks'],
					},
				},
				description: 'Optional ISO date/time upper bound',
			},
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				description: 'Optional key sent as Idempotency-Key header for safe retries',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let index = 0; index < items.length; index++) {
			try {
				const operation = this.getNodeParameter('operation', index) as string;
				let responseData: unknown;

				if (operation === 'create') {
					const routingType = this.getNodeParameter('routingType', index) as string;
					let variants: KlinkyVariant[];

					if (routingType === 'single') {
						variants = [
							{
								label: this.getNodeParameter('singleVariantLabel', index, 'main') as string,
								destination_url: this.getNodeParameter('singleDestinationUrl', index) as string,
								weight: 100,
							},
						];
					} else {
						const variantCollection = this.getNodeParameter('variants', index) as {
							variant?: unknown[];
						};
						variants = buildVariantsFromCollection(this, variantCollection.variant ?? [], index);
					}

					const body: IDataObject = {
						name: this.getNodeParameter('name', index),
						variants,
						auto_winner: this.getNodeParameter('autoWinner', index),
						auto_winner_threshold: this.getNodeParameter('autoWinnerThreshold', index),
						enable_conversion_tracking: this.getNodeParameter('enableConversionTracking', index),
						routing_type: routingType === 'geo' ? 'geo' : 'ab_test',
					};

					const slug = this.getNodeParameter('slug', index) as string;
					if (slug) body.slug = slug;

					const conversionRedirectUrl = this.getNodeParameter('conversionRedirectUrl', index) as string;
					if (conversionRedirectUrl) body.conversion_redirect_url = conversionRedirectUrl;

					if (routingType === 'geo') {
						const geoCollection = this.getNodeParameter('geoRules', index) as { rule?: unknown[] };
						const defaultVariant = this.getNodeParameter('defaultGeoVariant', index) as string;
						body.geo_rules = buildGeoRulesFromCollection(
							geoCollection.rule ?? [],
							defaultVariant,
						);
					}

					const idempotencyKey = this.getNodeParameter('idempotencyKey', index) as string;
					const headers: IDataObject = {};
					if (idempotencyKey) {
						headers['Idempotency-Key'] = idempotencyKey;
					}

					responseData = await klinkyApiRequest(
						this,
						'POST',
						'/public/links',
						index,
						body,
						undefined,
						headers,
					);
				} else if (operation === 'get') {
					const linkId = this.getNodeParameter('linkId', index) as string;
					responseData = await klinkyApiRequest(this, 'GET', `/public/links/${linkId}`, index);
				} else if (operation === 'getAll') {
					const page = this.getNodeParameter('page', index) as number;
					const perPage = this.getNodeParameter('perPage', index) as number;
					responseData = await klinkyApiRequest(this, 'GET', '/public/links', index, undefined, {
						page,
						per_page: perPage,
					});
				} else if (operation === 'getClicks') {
					const linkId = this.getNodeParameter('linkId', index) as string;
					const page = this.getNodeParameter('page', index) as number;
					const perPage = this.getNodeParameter('perPage', index) as number;
					const qs: IDataObject = { page, per_page: perPage };
					const startDate = this.getNodeParameter('startDate', index) as string;
					const endDate = this.getNodeParameter('endDate', index) as string;
					if (startDate) qs.start_date = startDate;
					if (endDate) qs.end_date = endDate;
					responseData = await klinkyApiRequest(
						this,
						'GET',
						`/public/links/${linkId}/clicks`,
						index,
						undefined,
						qs,
					);
				} else if (operation === 'update') {
					const linkId = this.getNodeParameter('linkId', index) as string;
					const body: IDataObject = {
						is_active: this.getNodeParameter('isActive', index),
						auto_winner: this.getNodeParameter('autoWinner', index),
						auto_winner_threshold: this.getNodeParameter('autoWinnerThreshold', index),
					};
					const updatedName = this.getNodeParameter('updatedName', index) as string;
					if (updatedName) body.name = updatedName;
					const conversionRedirectUrl = this.getNodeParameter('conversionRedirectUrl', index) as string;
					if (conversionRedirectUrl) body.conversion_redirect_url = conversionRedirectUrl;

					if (this.getNodeParameter('updateGeoRules', index, false)) {
						const geoCollection = this.getNodeParameter('updateGeoRulesList', index, { rule: [] }) as {
							rule?: unknown[];
						};
						const defaultVariant = this.getNodeParameter(
							'updateDefaultGeoVariant',
							index,
							'control',
						) as string;
						body.geo_rules = buildGeoRulesFromCollection(
							geoCollection.rule ?? [],
							defaultVariant,
						);
					}

					responseData = await klinkyApiRequest(this, 'PUT', `/public/links/${linkId}`, index, body);
				} else if (operation === 'updateVariants') {
					const linkId = this.getNodeParameter('linkId', index) as string;
					const variantCollection = this.getNodeParameter('updateVariantsList', index) as {
						variant?: unknown[];
					};
					const body = buildVariantsFromCollection(this, variantCollection.variant ?? [], index);
					responseData = await klinkyApiRequest(
						this,
						'PUT',
						`/public/links/${linkId}/variants`,
						index,
						body as unknown as IDataObject[],
					);
				} else {
					const linkId = this.getNodeParameter('linkId', index) as string;
					responseData = await klinkyApiRequest(this, 'DELETE', `/public/links/${linkId}`, index);
				}

				pushResponseItems(returnData, responseData, index);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: index },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: index });
			}
		}

		return [returnData];
	}
}
