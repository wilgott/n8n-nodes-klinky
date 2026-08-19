import type {
	ICredentialTestRequest,
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KlinkyApi implements ICredentialType {
	name = 'klinkyApi';

	displayName = 'Klinky API';

	documentationUrl = 'https://docs.klinky.io/guide/api/authentication';

	icon = 'file:../nodes/Klinky/klinky.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://klinky-api.fly.dev/api/v1',
			required: true,
			description: 'Klinky API base URL',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Use a secret key (`klinky_sk_...`) for write operations',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/public/links?page=1&per_page=1',
			method: 'GET',
		},
	};
}
