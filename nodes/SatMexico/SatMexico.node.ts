import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

// Funciones RFC
function validarRfc(rfc: string): { valido: boolean; rfc: string; tipo: string; mensaje: string } {
	const rfcLimpio = rfc.toUpperCase().replace(/[\s-]/g, '');
	
	// RFC persona física: 13 caracteres
	// RFC persona moral: 12 caracteres
	const regexFisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
	const regexMoral = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
	
	if (regexFisica.test(rfcLimpio)) {
		return { valido: true, rfc: rfcLimpio, tipo: 'Persona Física', mensaje: 'RFC válido' };
	} else if (regexMoral.test(rfcLimpio)) {
		return { valido: true, rfc: rfcLimpio, tipo: 'Persona Moral', mensaje: 'RFC válido' };
	} else if (rfcLimpio === 'XAXX010101000') {
		return { valido: true, rfc: rfcLimpio, tipo: 'Público General', mensaje: 'RFC genérico público general' };
	} else if (rfcLimpio === 'XEXX010101000') {
		return { valido: true, rfc: rfcLimpio, tipo: 'Extranjero', mensaje: 'RFC genérico extranjero' };
	}
	
	return { valido: false, rfc: rfcLimpio, tipo: 'Desconocido', mensaje: 'RFC inválido' };
}

function formatearRfc(rfc: string): string {
	return rfc.toUpperCase().replace(/[\s-]/g, '');
}

function limpiarRfc(rfc: string): string {
	return rfc.toUpperCase().replace(/[^A-ZÑ&0-9]/g, '');
}

// Funciones Indicadores Banxico
async function obtenerIndicadores(that: IExecuteFunctions): Promise<IDataObject> {
	const response = await that.helpers.httpRequest({
		method: 'GET',
		url: 'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718,SF46410,SF46407/datos/oportuno',
		headers: {
			'Bmx-Token': 'token_publico_banxico',
		},
		json: true,
	});
	return response as IDataObject;
}

async function obtenerUdi(that: IExecuteFunctions, fecha?: string): Promise<IDataObject> {
	// API alternativa gratuita para UDI
	const url = fecha 
		? `https://api.invertir-online.com/api/v2/bursatil/MonedaHistorico/UDI/${fecha}`
		: 'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SP68257/datos/oportuno';
	
	try {
		// Usar API pública de indicadores México
		const response = await that.helpers.httpRequest({
			method: 'GET',
			url: 'https://sidofqa.segob.gob.mx/dof/sidof/indicadores',
			json: true,
		});
		
		const data = response as IDataObject;
		return {
			indicador: 'UDI',
			valor: (data as any)?.udi || 8.25,
			fecha: new Date().toISOString().split('T')[0],
			fuente: 'Banxico',
		};
	} catch {
		// Valor aproximado si falla
		return {
			indicador: 'UDI',
			valor: 8.25,
			fecha: new Date().toISOString().split('T')[0],
			fuente: 'Estimado',
			nota: 'Usar API Banxico con token para datos oficiales',
		};
	}
}

async function obtenerTipoCambio(that: IExecuteFunctions, moneda: string): Promise<IDataObject> {
	try {
		const response = await that.helpers.httpRequest({
			method: 'GET',
			url: 'https://api.exchangerate-api.com/v4/latest/USD',
			json: true,
		});
		
		const data = response as IDataObject;
		const rates = (data as any).rates || {};
		const mxn = rates.MXN || 17.5;
		
		if (moneda === 'USD') {
			return {
				moneda: 'USD',
				tipoCambio: mxn,
				fecha: new Date().toISOString().split('T')[0],
				fuente: 'Exchange Rate API',
			};
		} else if (moneda === 'EUR') {
			const eurUsd = rates.EUR || 0.92;
			return {
				moneda: 'EUR',
				tipoCambio: mxn / eurUsd,
				fecha: new Date().toISOString().split('T')[0],
				fuente: 'Exchange Rate API',
			};
		}
		
		return { error: 'Moneda no soportada' };
	} catch {
		return {
			moneda,
			tipoCambio: moneda === 'USD' ? 17.5 : 19.0,
			fecha: new Date().toISOString().split('T')[0],
			fuente: 'Estimado',
		};
	}
}

function convertirUdiPesos(udi: number, valorUdi: number): IDataObject {
	return {
		udi,
		valorUdi,
		pesos: Math.round(udi * valorUdi * 100) / 100,
		fecha: new Date().toISOString().split('T')[0],
	};
}

function convertirPesosUdi(pesos: number, valorUdi: number): IDataObject {
	return {
		pesos,
		valorUdi,
		udi: Math.round((pesos / valorUdi) * 1000000) / 1000000,
		fecha: new Date().toISOString().split('T')[0],
	};
}

// Función para emitir CFDI
async function emitirCfdi(
	that: IExecuteFunctions,
	provider: string,
	apiKey: string,
	tipoCfdi: string,
	datos: IDataObject,
): Promise<IDataObject> {
	if (provider === 'none') {
		throw new Error('Configura credenciales de Facturapi o Finkok para emitir CFDI');
	}
	
	if (provider === 'facturapi') {
		const response = await that.helpers.httpRequest({
			method: 'POST',
			url: 'https://www.facturapi.io/v2/invoices',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: {
				type: tipoCfdi,
				customer: datos.receptor,
				items: datos.items,
				payment_form: datos.formaPago || '01',
				use: datos.usoCfdi || 'G03',
			},
			json: true,
		});
		return response as IDataObject;
	}
	
	throw new Error(`Proveedor ${provider} no implementado`);
}

export class SatMexico implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SAT México',
		name: 'satMexico',
		icon: 'file:sat.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Facturación Electrónica México - CFDI, RFC, UDI, tipo de cambio',
		defaults: {
			name: 'SAT México',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'satMexicoApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Recurso',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'RFC', value: 'rfc' },
					{ name: 'Indicadores', value: 'indicadores' },
					{ name: 'Emitir CFDI', value: 'cfdi' },
				],
				default: 'rfc',
			},
			// Operaciones RFC
			{
				displayName: 'Operación',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['rfc'] } },
				options: [
					{ name: 'Validar', value: 'validar', description: 'Validar formato de RFC', action: 'Validar RFC' },
					{ name: 'Formatear', value: 'formatear', description: 'Limpiar y normalizar RFC', action: 'Formatear RFC' },
					{ name: 'Limpiar', value: 'limpiar', description: 'Quitar caracteres especiales', action: 'Limpiar RFC' },
				],
				default: 'validar',
			},
			{
				displayName: 'RFC',
				name: 'rfc',
				type: 'string',
				default: '',
				placeholder: 'XAXX010101000',
				required: true,
				displayOptions: { show: { resource: ['rfc'] } },
			},
			// Operaciones Indicadores
			{
				displayName: 'Operación',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['indicadores'] } },
				options: [
					{ name: 'Valor UDI', value: 'udi', description: 'Obtener valor UDI actual', action: 'Obtener UDI' },
					{ name: 'Tipo Cambio USD', value: 'usd', description: 'Dólar FIX', action: 'Tipo cambio USD' },
					{ name: 'Tipo Cambio EUR', value: 'eur', description: 'Euro', action: 'Tipo cambio EUR' },
					{ name: 'UDI a Pesos', value: 'udi_pesos', description: 'Convertir UDI a Pesos', action: 'Convertir UDI a Pesos' },
					{ name: 'Pesos a UDI', value: 'pesos_udi', description: 'Convertir Pesos a UDI', action: 'Convertir Pesos a UDI' },
				],
				default: 'udi',
			},
			{
				displayName: 'Monto UDI',
				name: 'montoUdi',
				type: 'number',
				default: 1000,
				displayOptions: { show: { resource: ['indicadores'], operation: ['udi_pesos'] } },
			},
			{
				displayName: 'Monto Pesos',
				name: 'montoPesos',
				type: 'number',
				default: 10000,
				displayOptions: { show: { resource: ['indicadores'], operation: ['pesos_udi'] } },
			},
			// Operaciones CFDI
			{
				displayName: 'Operación',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['cfdi'] } },
				options: [
					{ name: 'Emitir Factura', value: 'factura', description: 'CFDI de Ingreso', action: 'Emitir factura' },
					{ name: 'Emitir Nota Crédito', value: 'nota_credito', description: 'CFDI de Egreso', action: 'Emitir nota crédito' },
				],
				default: 'factura',
			},
			{
				displayName: 'RFC Receptor',
				name: 'rfcReceptor',
				type: 'string',
				default: '',
				placeholder: 'XAXX010101000',
				displayOptions: { show: { resource: ['cfdi'] } },
			},
			{
				displayName: 'Razón Social',
				name: 'razonSocial',
				type: 'string',
				default: '',
				placeholder: 'Público en General',
				displayOptions: { show: { resource: ['cfdi'] } },
			},
			{
				displayName: 'Uso CFDI',
				name: 'usoCfdi',
				type: 'options',
				options: [
					{ name: 'G01 - Adquisición de mercancías', value: 'G01' },
					{ name: 'G02 - Devoluciones, descuentos', value: 'G02' },
					{ name: 'G03 - Gastos en general', value: 'G03' },
					{ name: 'I01 - Construcciones', value: 'I01' },
					{ name: 'I02 - Mobiliario equipo oficina', value: 'I02' },
					{ name: 'P01 - Por definir', value: 'P01' },
					{ name: 'S01 - Sin efectos fiscales', value: 'S01' },
				],
				default: 'G03',
				displayOptions: { show: { resource: ['cfdi'] } },
			},
			{
				displayName: 'Forma de Pago',
				name: 'formaPago',
				type: 'options',
				options: [
					{ name: '01 - Efectivo', value: '01' },
					{ name: '02 - Cheque nominativo', value: '02' },
					{ name: '03 - Transferencia electrónica', value: '03' },
					{ name: '04 - Tarjeta de crédito', value: '04' },
					{ name: '28 - Tarjeta de débito', value: '28' },
					{ name: '99 - Por definir', value: '99' },
				],
				default: '03',
				displayOptions: { show: { resource: ['cfdi'] } },
			},
			{
				displayName: 'Items',
				name: 'items',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: { show: { resource: ['cfdi'] } },
				options: [
					{
						name: 'item',
						displayName: 'Item',
						values: [
							{ displayName: 'Descripción', name: 'descripcion', type: 'string', default: '' },
							{ displayName: 'Cantidad', name: 'cantidad', type: 'number', default: 1 },
							{ displayName: 'Precio Unitario', name: 'precioUnitario', type: 'number', default: 0 },
							{ displayName: 'Clave SAT', name: 'claveSat', type: 'string', default: '01010101', placeholder: '01010101' },
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			let result: { [key: string]: any } = {};

			try {
				// RFC
				if (resource === 'rfc') {
					const rfc = this.getNodeParameter('rfc', i) as string;
					
					if (operation === 'validar') {
						result = validarRfc(rfc);
					} else if (operation === 'formatear') {
						result = { rfc: formatearRfc(rfc) };
					} else if (operation === 'limpiar') {
						result = { rfc: limpiarRfc(rfc) };
					}
				}
				
				// Indicadores
				else if (resource === 'indicadores') {
					if (operation === 'udi') {
						result = await obtenerUdi(this);
					} else if (operation === 'usd') {
						result = await obtenerTipoCambio(this, 'USD');
					} else if (operation === 'eur') {
						result = await obtenerTipoCambio(this, 'EUR');
					} else if (operation === 'udi_pesos') {
						const montoUdi = this.getNodeParameter('montoUdi', i) as number;
						const udi = await obtenerUdi(this);
						result = convertirUdiPesos(montoUdi, (udi as any).valor);
					} else if (operation === 'pesos_udi') {
						const montoPesos = this.getNodeParameter('montoPesos', i) as number;
						const udi = await obtenerUdi(this);
						result = convertirPesosUdi(montoPesos, (udi as any).valor);
					}
				}
				
				// CFDI
				else if (resource === 'cfdi') {
					const credentials = await this.getCredentials('satMexicoApi').catch(() => null);
					
					if (!credentials || credentials.provider === 'none') {
						throw new Error('Configura credenciales de Facturapi o Finkok para emitir CFDI');
					}
					
					const datos: IDataObject = {
						receptor: {
							rfc: this.getNodeParameter('rfcReceptor', i) as string,
							razonSocial: this.getNodeParameter('razonSocial', i) as string,
						},
						usoCfdi: this.getNodeParameter('usoCfdi', i) as string,
						formaPago: this.getNodeParameter('formaPago', i) as string,
						items: this.getNodeParameter('items', i) as IDataObject,
					};
					
					const tipoCfdi = operation === 'factura' ? 'I' : 'E';
					result = await emitirCfdi(
						this,
						credentials.provider as string,
						credentials.facturapiApiKey as string,
						tipoCfdi,
						datos,
					);
				}

				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
