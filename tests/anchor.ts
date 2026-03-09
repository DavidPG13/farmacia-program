import BN from "bn.js";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import type { FarmaciaProgram } from "../target/types/farmacia_program";

describe("farmacia_program", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.FarmaciaProgram as anchor.Program<FarmaciaProgram>;
  

  // ── PDAs ──────────────────────────────────────────────────────────────────
  const [farmaciaPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("farmacia"), program.provider.publicKey.toBuffer()],
    program.programId
  );

  const nombreMed = "Ibuprofeno";
  const [medicamentoPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("medicamento"), Buffer.from(nombreMed)],
    program.programId
  );

  // ── CREATE: Farmacia ───────────────────────────────────────────────────────
  it("Crea la farmacia correctamente", async () => {
    const cuentaExistente = await program.provider.connection.getAccountInfo(farmaciaPDA);

    if (!cuentaExistente) {
      const txHash = await program.methods
        .crearFarmacia("Farmacia Test")
        .accounts({
          farmaciaAccount: farmaciaPDA,
          dueno: program.provider.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      await program.provider.connection.confirmTransaction(txHash);
    }

    const farmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    assert.equal(farmacia.dueno.toBase58(), program.provider.publicKey.toBase58());
    assert.ok(farmacia.nombre.length > 0);
  });

  // ── CREATE: Medicamento ────────────────────────────────────────────────────
  it("Agrega un medicamento correctamente", async () => {
    const txHash = await program.methods
      .agregarMedicamento(
        nombreMed,
        new anchor.BN(1500),
        50,
        true,
      )
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: program.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    await program.provider.connection.confirmTransaction(txHash);

    const med = await program.account.medicamentoAccount.fetch(medicamentoPDA);
    assert.equal(med.nombre, nombreMed);
    assert(med.precio.eq(new anchor.BN(1500)));
    assert.equal(med.stock, 50);
    assert.equal(med.necesitaReceta, true);

    const farmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    assert.ok(farmacia.medicamentosRegistrados.length >= 1);
    assert.ok(
      farmacia.medicamentosRegistrados.some(
        (k) => k.toBase58() === medicamentoPDA.toBase58()
      )
    );
  });

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  it("Actualiza precio y stock del medicamento", async () => {
    const txHash = await program.methods
      .actualizarStock(
        nombreMed,
        new anchor.BN(2000),
        35,
      )
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: program.provider.publicKey,
      })
      .rpc();
    await program.provider.connection.confirmTransaction(txHash);

    const med = await program.account.medicamentoAccount.fetch(medicamentoPDA);
    assert(med.precio.eq(new anchor.BN(2000)));
    assert.equal(med.stock, 35);
    assert.equal(med.nombre, nombreMed);
    assert.equal(med.necesitaReceta, true);
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────
  it("Elimina el medicamento y lo remueve de la farmacia", async () => {
    const txHash = await program.methods
      .eliminarMedicamento(nombreMed)
      .accounts({
        medicamentoAccount: medicamentoPDA,
        farmaciaAccount: farmaciaPDA,
        dueno: program.provider.publicKey,
      })
      .rpc();
    await program.provider.connection.confirmTransaction(txHash);

    const cuentaCerrada = await program.provider.connection.getAccountInfo(medicamentoPDA);
    assert.equal(cuentaCerrada, null);

    const farmacia = await program.account.farmaciaAccount.fetch(farmaciaPDA);
    assert.ok(
      farmacia.medicamentosRegistrados.every(
        (k) => k.toBase58() !== medicamentoPDA.toBase58()
      )
    );
  });
});