import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class SatMexicoApi implements ICredentialType {
	name = 'satMexicoApi';
	displayName = 'SAT México / Facturación CFDI';
	documentationUrl = 'https://facturapi.io/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'Proveedor de Facturación',
			name: 'provider',
			type: 'options',
			options: [
				{ name: 'Facturapi', value: 'facturapi' },
				{ name: 'Finkok', value: 'finkok' },
				{ name: 'Solo Funciones Locales (sin emisión)', value: 'none' },
			],
			default: 'none',
		},
		{
			displayName: 'API Key Facturapi',
			name: 'facturapiApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: { show: { provider: ['facturapi'] } },
		},
		{
			displayName: 'Ambiente Facturapi',
			name: 'facturapiEnvironment',
			type: 'options',
			options: [
				{ name: 'Sandbox (Pruebas)', value: 'sandbox' },
				{ name: 'Producción', value: 'production' },
			],
			default: 'sandbox',
			displayOptions: { show: { provider: ['facturapi'] } },
		},
		{
			displayName: 'Usuario Finkok',
			name: 'finkokUser',
			type: 'string',
			default: '',
			displayOptions: { show: { provider: ['finkok'] } },
		},
		{
			displayName: 'Password Finkok',
			name: 'finkokPassword',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: { show: { provider: ['finkok'] } },
		},
		{
			displayName: 'RFC Emisor',
			name: 'rfcEmisor',
			type: 'string',
			default: '',
			placeholder: 'AAA010101AAA',
			displayOptions: { hide: { provider: ['none'] } },
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.exchangerate-api.com',
			url: '/v4/latest/USD',
			method: 'GET',
		},
	};
}