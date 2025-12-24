"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatMexicoApi = void 0;
class SatMexicoApi {
    constructor() {
        this.name = 'satMexicoApi';
        this.displayName = 'SAT México / Facturación CFDI';
        this.documentationUrl = 'https://facturapi.io/docs';
        this.properties = [
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
        this.test = {
            request: {
                baseURL: 'https://api.exchangerate-api.com',
                url: '/v4/latest/USD',
                method: 'GET',
            },
        };
    }
}
exports.SatMexicoApi = SatMexicoApi;
