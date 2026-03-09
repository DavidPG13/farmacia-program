# Farmacia Program - Solana Smart Contract

## Descripción

Este programa administra el inventario de una farmacia, permitiendo crear el establecimiento, registrar medicinas con precio y stock, y dar de baja productos agotados.

## Funcionalidades

### CRUD Completo

1. **CREATE - Crear Farmacia**: Inicializa la cuenta principal de la farmacia con el nombre del establecimiento y el dueño.

2. **CREATE - Agregar Medicamento**: Crea una cuenta PDA independiente para cada medicamento con la siguiente información:
   - Nombre del medicamento
   - Precio (u64)
   - Stock disponible (u32)
   - Necesita receta médica (bool)

3. **UPDATE - Actualizar Stock**: Permite modificar el precio y/o la cantidad disponible de un medicamento existente.

4. **DELETE - Eliminar Medicamento**: Cierra la cuenta del medicamento y devuelve el SOL de renta al dueño.

## Estructura de Datos

### FarmaciaAccount
```rust
{
    dueno: Pubkey,                    // Dueño de la farmacia
    nombre: String,                   // Nombre del establecimiento
    medicamentos_registrados: Vec<Pubkey>  // Lista de medicamentos
}
```

### MedicamentoAccount
```rust
{
    nombre: String,           // Nombre del medicamento
    precio: u64,              // Precio en lamports
    stock: u32,               // Cantidad disponible
    necesita_receta: bool     // Requiere receta médica
}
```

## Arquitectura Técnica

- **Framework**: Anchor 0.29.0
- **PDAs**: Se utilizan Program Derived Addresses para generar cuentas determinísticas
  - Farmacia: `["farmacia", dueno_pubkey]`
  - Medicamento: `["medicamento", nombre_medicamento]`
- **Seguridad**: Solo el dueño puede agregar, actualizar o eliminar medicamentos

## Compilación y Despliegue

### Requisitos previos
- Solana CLI instalado
- Anchor CLI instalado
- Node.js y Yarn

### Comandos

```bash
# Instalar dependencias
yarn install

# Compilar el programa
anchor build

# Ejecutar tests
anchor test

# Desplegar (Devnet)
anchor deploy --provider.cluster devnet
```

## Uso desde el Cliente

Ver ejemplos en:
- `tests/anchor.ts` - Tests de integración completos
- `client/client.ts` - Cliente básico

## Program ID

Actualizar después del primer deploy en `Anchor.toml` y `lib.rs`

## Autor

Proyecto desarrollado para la certificación de Solana

## Licencia

MIT
