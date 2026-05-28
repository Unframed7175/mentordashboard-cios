// src/components/HelpPage.tsx — Phase 30 Plan 02
// HELP-01: In-app help view met 4 secties (Importeren, Bekijken, Afdrukken, Fout melden)

import React from 'react';

interface HelpPageProps {
  onBack: () => void;
}

export default function HelpPage({ onBack }: HelpPageProps) {
  return (
    <main className="settings-page">
      <div className="settings-header">
        <button className="detail-nav-btn" onClick={onBack}>← Terug</button>
        <h1>Help</h1>
      </div>

      <div className="help-content">
        <section className="detail-section">
          <h2 className="detail-section-title">Stap 1: Importeren</h2>
          <p>
            Sleep één of meerdere SomToday voortgang-PDF's naar het importvak, of klik op de
            knop "Bestanden toevoegen". Verzuimgegevens laad je via een Excel-bestand (.xls/.xlsx)
            vanuit SomToday. BPV-gegevens laad je via een apart BPV Excel-bestand.
          </p>
          <ol>
            <li>Open het laadscherm via de navigatiebalk.</li>
            <li>Sleep de PDF-bestanden of klik op "Bestanden toevoegen".</li>
            <li>Herhaal voor het verzuim Excel-bestand en het BPV Excel-bestand indien beschikbaar.</li>
          </ol>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Stap 2: Klasoverzicht bekijken</h2>
          <p>
            Na het laden zie je alle leerlingen in het klasoverzicht. Gebruik de tabs bovenin
            om te wisselen tussen klassen. Elke leerlingtegel toont een kleurcode die de prognose
            aangeeft: groen (op koers), oranje (aandacht nodig) of rood (risico). Klik op een
            leerlingtegel om de detailweergave te openen.
          </p>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Stap 3: Afdrukken</h2>
          <p>
            Open de detailweergave van een leerling en klik op de afdrukknop. Kies als bestemming
            "Opslaan als PDF" om een overzicht op te slaan, of stuur het direct naar de printer.
            Het dashboard is geoptimaliseerd voor A4-formaat.
          </p>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Stap 4: Fout melden</h2>
          <p>
            Gebruik de 🐛-knop in de navigatiebalk om een foutmelding te sturen. Er opent zich
            een e-mailvenster met de ontwikkelaar al ingevuld. Voeg een beschrijving toe van wat
            er misging en verstuur het bericht.
          </p>
        </section>
      </div>
    </main>
  );
}
