use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod farmacia_program {
    use super::*;

    // --- CREATE: Crear Farmacia ---
    pub fn crear_farmacia(
        ctx: Context<CrearFarmacia>,
        nombre: String,
    ) -> Result<()> {
        let farmacia = &mut ctx.accounts.farmacia_account;a
        farmacia.dueno = *ctx.accounts.dueno.key;
        farmacia.nombre = nombre.clone();
        farmacia.medicamentos_registrados = Vec::new();

        msg!("Farmacia {} creada con éxito!", nombre);
        Ok(())
    }

    // --- CREATE: Agregar Medicamento ---
    pub fn agregar_medicamento(
        ctx: Context<AgregarMedicamento>,
        nombre_medicamento: String,
        precio: u64,
        stock: u32,
        necesita_receta: bool,
    ) -> Result<()> {
        let medicamento = &mut ctx.accounts.medicamento_account;
        medicamento.nombre = nombre_medicamento.clone();
        medicamento.precio = precio;
        medicamento.stock = stock;
        medicamento.necesita_receta = necesita_receta;

        // Agregar la dirección del medicamento al vector de la farmacia
        let farmacia = &mut ctx.accounts.farmacia_account;
        farmacia.medicamentos_registrados.push(*ctx.accounts.medicamento_account.to_account_info().key);

        msg!("Medicamento {} agregado. Precio: {}, Stock: {}", nombre_medicamento, precio, stock);
        Ok(())
    }

    // --- UPDATE: Actualizar Stock ---
    pub fn actualizar_stock(
        ctx: Context<ActualizarMedicamento>,
        _nombre_medicamento: String,
        nuevo_precio: u64,
        nuevo_stock: u32,
    ) -> Result<()> {
        let medicamento = &mut ctx.accounts.medicamento_account;
        
        medicamento.precio = nuevo_precio;
        medicamento.stock = nuevo_stock;

        msg!("Medicamento {} actualizado. Precio: {}, Stock: {}", 
            medicamento.nombre, medicamento.precio, medicamento.stock);
        Ok(())
    }

    // --- DELETE: Eliminar Medicamento ---
    pub fn eliminar_medicamento(
        ctx: Context<EliminarMedicamento>,
        nombre_medicamento: String,
    ) -> Result<()> {
        // Remover del vector de la farmacia
        let farmacia = &mut ctx.accounts.farmacia_account;
        let medicamento_key = *ctx.accounts.medicamento_account.to_account_info().key;
        farmacia.medicamentos_registrados.retain(|&x| x != medicamento_key);

        msg!("Medicamento {} eliminado. Cuenta cerrada.", nombre_medicamento);
        Ok(())
    }
}

// --- ESTRUCTURAS DE DATOS ---

#[account]
#[derive(InitSpace)]
pub struct FarmaciaAccount {
    pub dueno: Pubkey,
    #[max_len(50)]
    pub nombre: String,
    #[max_len(20)]
    pub medicamentos_registrados: Vec<Pubkey>,
}

#[account]
#[derive(InitSpace)]
pub struct MedicamentoAccount {
    #[max_len(30)]
    pub nombre: String,
    pub precio: u64,
    pub stock: u32,
    pub necesita_receta: bool,
}

// --- CONTEXTOS DE VALIDACIÓN ---

#[derive(Accounts)]
#[instruction(nombre: String)]
pub struct CrearFarmacia<'info> {
    #[account(
        init,
        seeds = [b"farmacia", dueno.key().as_ref()],
        bump,
        payer = dueno,
        space = 8 + FarmaciaAccount::INIT_SPACE
    )]
    pub farmacia_account: Account<'info, FarmaciaAccount>,
    #[account(mut)]
    pub dueno: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nombre_medicamento: String)]
pub struct AgregarMedicamento<'info> {
    #[account(
        init,
        seeds = [b"medicamento", nombre_medicamento.as_bytes()],
        bump,
        payer = dueno,
        space = 8 + MedicamentoAccount::INIT_SPACE
    )]
    pub medicamento_account: Account<'info, MedicamentoAccount>,
    #[account(
        mut,
        seeds = [b"farmacia", dueno.key().as_ref()],
        bump,
        has_one = dueno
    )]
    pub farmacia_account: Account<'info, FarmaciaAccount>,
    #[account(mut)]
    pub dueno: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nombre_medicamento: String)]
pub struct ActualizarMedicamento<'info> {
    #[account(
        mut,
        seeds = [b"medicamento", nombre_medicamento.as_bytes()],
        bump
    )]
    pub medicamento_account: Account<'info, MedicamentoAccount>,
    #[account(
        seeds = [b"farmacia", dueno.key().as_ref()],
        bump,
        has_one = dueno
    )]
    pub farmacia_account: Account<'info, FarmaciaAccount>,
    pub dueno: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(nombre_medicamento: String)]
pub struct EliminarMedicamento<'info> {
    #[account(
        mut,
        seeds = [b"medicamento", nombre_medicamento.as_bytes()],
        bump,
        close = dueno
    )]
    pub medicamento_account: Account<'info, MedicamentoAccount>,
    #[account(
        mut,
        seeds = [b"farmacia", dueno.key().as_ref()],
        bump,
        has_one = dueno
    )]
    pub farmacia_account: Account<'info, FarmaciaAccount>,
    #[account(mut)]
    pub dueno: Signer<'info>,
}
