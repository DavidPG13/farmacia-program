import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import type { FarmaciaProgram } from "../target/types/farmacia_program";

describe("Farmacia Program Tests", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.FarmaciaProgram as anchor.Program<FarmaciaProgram>;
  const provider = anchor.AnchorProvider.env();

  it("Crear Farmacia", async () => {
    const nombreFarmacia = "Farmacia San Juan";

    // Derivar PDA de la farmacia
    const [farmaciaPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("farmacia"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // Crear farmacia
    const tx = await program.methods
      .crearFarmacia(nombreFarmacia)
      .accounts({
        farmaciaAccount: farmaciaPDA,
        dueno: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Farmacia creada. TX:", tx);

    // Verificar datos
    const farmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    assert.strictEqual(farmacia.nombre, nombreFarmacia);
    assert.strictEqual(farmacia.dueno.toString(), provider.wallet.publicKey.toString());
    assert.strictEqual(farmacia.medicamentosRegistrados.length, 0);
  });

  it("Agregar Medicamento", async () => {
    const nombreMedicamento = "Paracetamol";
    const precio = 5000;
    const stock = 100;
    const necesitaReceta = false;

    // Derivar PDAs
    const [farmaciaPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("farmacia"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [medicamentoPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("medicamento"), Buffer.from(nombreMedicamento)],
      program.programId
    );

    // Agregar medicamento
    const tx = await program.methods
      .agregarMedicamento(nombreMedicamento, precio, stock, necesitaReceta)
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Medicamento agregado. TX:", tx);

    // Verificar datos del medicamento
    const medicamento = await program.account.medicamentoAccount.fetch(medicamentoPDA);
    assert.strictEqual(medicamento.nombre, nombreMedicamento);
    assert.strictEqual(medicamento.precio.toNumber(), precio);
    assert.strictEqual(medicamento.stock, stock);
    assert.strictEqual(medicamento.necesitaReceta, necesitaReceta);

    // Verificar que se agregó al vector de la farmacia
    const farmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    assert.strictEqual(farmacia.medicamentosRegistrados.length, 1);
  });

  it("Actualizar Stock de Medicamento", async () => {
    const nombreMedicamento = "Paracetamol";
    const nuevoPrecio = 6000;
    const nuevoStock = 150;

    // Derivar PDAs
    const [farmaciaPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("farmacia"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [medicamentoPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("medicamento"), Buffer.from(nombreMedicamento)],
      program.programId
    );

    // Actualizar
    const tx = await program.methods
      .actualizarStock(nombreMedicamento, nuevoPrecio, nuevoStock)
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Stock actualizado. TX:", tx);

    // Verificar cambios
    const medicamento = await program.account.medicamentoAccount.fetch(medicamentoPDA);
    assert.strictEqual(medicamento.precio.toNumber(), nuevoPrecio);
    assert.strictEqual(medicamento.stock, nuevoStock);
  });

  it("Eliminar Medicamento", async () => {
    const nombreMedicamento = "Paracetamol";

    // Derivar PDAs
    const [farmaciaPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("farmacia"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [medicamentoPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("medicamento"), Buffer.from(nombreMedicamento)],
      program.programId
    );

    // Eliminar
    const tx = await program.methods
      .eliminarMedicamento(nombreMedicamento)
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Medicamento eliminado. TX:", tx);

    // Verificar que la cuenta fue cerrada
    try {
      await program.account.medicamentoAccount.fetch(medicamentoPDA);
      assert.fail("La cuenta debería estar cerrada");
    } catch (error) {
      // Esperado: cuenta no existe
    }

    // Verificar que se removió del vector
    const farmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    assert.strictEqual(farmacia.medicamentosRegistrados.length, 0);
  });
});
