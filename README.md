# n8n-nodes-sat-mexico

![SAT México](https://img.shields.io/badge/SAT-México-006847)
![n8n](https://img.shields.io/badge/n8n-community--node-ff6d5a)
![License](https://img.shields.io/badge/license-MIT-blue)

Nodo n8n para integración con **SAT México** (Servicio de Administración Tributaria).

## 🚀 Funcionalidades

### RFC (Registro Federal de Contribuyentes)
- ✅ **Validar RFC** - Verifica formato y estructura
- ✅ **Formatear RFC** - Limpia y normaliza
- ✅ **Calcular homoclave** - Genera desde nombre y fecha
- ✅ **Validar en lista negra** - Verifica si está en lista 69-B

### Indicadores Económicos (Banxico)
- 📊 **Valor UDI** - Unidad de Inversión actual
- 💵 **Tipo de cambio USD** - Dólar FIX
- 💶 **Tipo de cambio EUR** - Euro
- 📈 **TIIE** - Tasa de Interés Interbancaria
- 🔄 **Convertir UDI ↔ Pesos**

### Emisión CFDI (requiere proveedor)
- 📄 **Factura** - CFDI de Ingreso
- 📄 **Nota de Crédito** - CFDI de Egreso
- 📄 **Recibo de Nómina** - CFDI de Nómina
- 📄 **Carta Porte** - Complemento de traslado

## 📦 Instalación

### En n8n (recomendado)
1. Ve a **Settings** → **Community Nodes**
2. Clic en **Install**
3. Escribe: `n8n-nodes-sat-mexico`
4. Clic en **Install**

### Via npm
```bash
npm install n8n-nodes-sat-mexico
```

## ⚙️ Configuración

### Sin credenciales (funciones locales)
Las siguientes funciones NO requieren credenciales:
- Validar/formatear RFC
- Indicadores económicos (API pública Banxico)
- Conversiones UDI ↔ Pesos

### Con credenciales (emisión CFDI)
Para emitir facturas necesitas una cuenta en:
- **Facturapi** - https://facturapi.io (tiene sandbox gratuito)
- **Finkok** - https://finkok.com
- **SW Sapien** - https://sw.com.mx

## 📋 Ejemplos de Uso

### Validar RFC
```
Recurso: RFC
Operación: Validar
RFC: XAXX010101000
```

### Obtener tipo de cambio
```
Recurso: Indicadores
Operación: Tipo de cambio USD
```

### Convertir UDI a Pesos
```
Recurso: Indicadores
Operación: UDI a Pesos
Monto UDI: 1000
```

## 📊 Tipos de CFDI

| Código | Tipo | Descripción |
|--------|------|-------------|
| I | Ingreso | Factura de venta |
| E | Egreso | Nota de crédito |
| T | Traslado | Carta porte |
| N | Nómina | Recibo de nómina |
| P | Pago | Complemento de pago |

## 🔗 APIs Utilizadas

- **Banxico** - Indicadores económicos (pública)
- **SAT** - Validación RFC y lista 69-B
- **Facturapi/Finkok** - Emisión CFDI (requiere cuenta)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue o pull request.

## 📄 Licencia

MIT © Manuel Reyes Bravo
