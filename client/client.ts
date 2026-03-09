import BN from "bn.js";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import type { FarmaciaProgram } from "../target/types/farmacia_program";

// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.FarmaciaProgram as anchor.Program<FarmaciaProgram>;

async function runCRUD() {
  console.log("💊 Iniciando interacción con Farmacia Program...");

  // ── PDAs ──────────────────────────────────────────────────────────────────
  const [farmaciaPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("farmacia"), program.provider.publicKey.toBuffer()],
    program.programId
  );

  const nombreMedicamento = "Paracetamol";
  const [medicamentoPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("medicamento"), Buffer.from(nombreMedicamento)],
    program.programId
  );

  console.log("📍 Farmacia PDA  :", farmaciaPDA.toBase58());
  console.log("📍 Medicamento PDA:", medicamentoPDA.toBase58());

  try {
    // ── CREATE: Farmacia ──────────────────────────────────────────────────────
    const cuentaExistente = await program.provider.connection.getAccountInfo(farmaciaPDA);
    if (!cuentaExistente) {
      console.log("\n🏪 Creando farmacia...");
      const txFarmacia = await program.methods
        .crearFarmacia("Farmacia San Juan")
        .accounts({
          farmaciaAccount: farmaciaPDA,
          dueno: program.provider.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      await program.provider.connection.confirmTransaction(txFarmacia);
      console.log("✅ Farmacia creada!");
    } else {
      console.log("\nℹ️  Farmacia ya existe, saltando creación.");
    }

    // ── READ: Farmacia ────────────────────────────────────────────────────────
    let datosFarmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    console.log("\n📋 Datos de la farmacia:");
    console.log(`  Nombre  : ${datosFarmacia.nombre}`);
    console.log(`  Dueño   : ${datosFarmacia.dueno.toBase58()}`);
    console.log(`  Medicamentos registrados: ${datosFarmacia.medicamentosRegistrados.length}`);

    // ── CREATE: Medicamento ───────────────────────────────────────────────────
    const medExistente = await program.provider.connection.getAccountInfo(medicamentoPDA);
    if (!medExistente) {
      console.log("\n💊 Agregando Paracetamol...");
      const txMed = await program.methods
        .agregarMedicamento(
          nombreMedicamento,
          new anchor.BN(2500),  // precio en centavos ($25.00)
          100,                   // stock
          false,                 // necesita_receta
        )
        .accounts({
          medicamentoAccount: medicamentoPDA,
          farmaciaAccount: farmaciaPDA,
          dueno: program.provider.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      await program.provider.connection.confirmTransaction(txMed);
      console.log("✅ Medicamento agregado!");
    } else {
      console.log("\nℹ️  Medicamento ya existe, saltando creación.");
    }

    // ── READ: Medicamento ─────────────────────────────────────────────────────
    let datosMed = await program.account.medicamentoAccount.fetch(medicamentoPDA);
    console.log("\n📋 Datos del medicamento:");
    console.log(`  Nombre          : ${datosMed.nombre}`);
    console.log(`  Precio          : $${datosMed.precio.toString()}`);
    console.log(`  Stock           : ${datosMed.stock}`);
    console.log(`  Necesita receta : ${datosMed.necesitaReceta}`);

    datosFarmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    console.log(`\n  Medicamentos en farmacia: ${datosFarmacia.medicamentosRegistrados.length}`);

    // ── UPDATE: Actualizar stock ──────────────────────────────────────────────
    console.log("\n🔄 Actualizando precio y stock...");
    const txUpdate = await program.methods
      .actualizarStock(
        nombreMedicamento,
        new anchor.BN(3000),  // nuevo precio
        80,                    // nuevo stock
      )
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: program.provider.publicKey,
      })
      .rpc();
    await program.provider.connection.confirmTransaction(txUpdate);

    datosMed = await program.account.medicamentoAccount.fetch(medicamentoPDA);
    console.log("✅ Medicamento actualizado!");
    console.log(`  Nuevo precio : $${datosMed.precio.toString()}`);
    console.log(`  Nuevo stock  : ${datosMed.stock}`);

    // ── DELETE: Eliminar medicamento ──────────────────────────────────────────
    console.log("\n🗑️  Eliminando medicamento...");
    const txDelete = await program.methods
      .eliminarMedicamento(nombreMedicamento)
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: program.provider.publicKey,
      })
      .rpc();
    await program.provider.connection.confirmTransaction(txDelete);
    console.log("✅ Medicamento eliminado, SOL devuelto al dueño.");

    const cuentaCerrada = await program.provider.connection.getAccountInfo(medicamentoPDA);
    console.log("🔍 Cuenta cerrada:", cuentaCerrada === null ? "Sí ✅" : "No ❌");

    datosFarmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    console.log(`\n  Medicamentos en farmacia: ${datosFarmacia.medicamentosRegistrados.length}`);

  } catch (error) {
    console.error("❌ Error en la transacción:", error);
  }
}

runCRUD();