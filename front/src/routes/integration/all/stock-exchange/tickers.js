const tickers = [
  { value: 'GIB', label: 'CGI' },
  { value: '^FCHI', label: 'CAC40' },
  { value: 'ALMIL.PA', label: '1000MERCIS' },
  { value: '2CRSI.PA', label: '2CRSI' },
  { value: 'MLATV.PA', label: 'A TOUTE VITESSE' },
  { value: 'ASP.PA', label: 'A.S.T. GROUPE' },
  { value: 'AB.PA', label: 'AB SCIENCE' },
  { value: 'ABCA.PA', label: 'ABC ARBITRAGE' },
  { value: 'ABEO.PA', label: 'ABEO' },
  { value: 'ABNX.PA', label: 'ABIONYX PHARMA' },
  { value: 'ABVX.PA', label: 'ABIVAX' },
  { value: 'ACAN.PA', label: 'ACANTHE DEV.' },
  { value: 'AC.PA', label: 'ACCOR' },
  { value: 'ALALO.PA', label: 'ACHETER-LOUER.FR' },
  { value: 'EOS.PA', label: 'ACTEOS' },
  { value: 'ATI.PA', label: 'ACTIA GROUP' },
  { value: 'ALACT.PA', label: 'ACTIPLAY (GROUPE)' },
  { value: 'MLACT.PA', label: 'ACTIVIUM GROUP' },
  { value: 'ALADA.PA', label: 'ADA' },
  { value: 'ALDV.PA', label: 'ADC SIIC' },
  { value: 'ALARF.PA', label: 'ADEUNIS' },
  { value: 'ALP.PA', label: 'ADL PARTNER' },
  { value: 'ADOC.PA', label: 'ADOCIA' },
  { value: 'ALADO.PA', label: 'ADOMOS' },
  { value: 'ADP.PA', label: 'ADP' },
  { value: 'ALADM.PA', label: 'ADTHINK' },
  { value: 'ADUX.PA', label: 'ADUX' },
  { value: 'ADV.PA', label: 'ADVENIS' },
  { value: 'ADVIC.PA', label: 'ADVICENNE' },
  { value: 'ADVI.PA', label: 'ADVINI' },
  { value: 'AKOM.PA', label: 'AERKOMM INC' },
  { value: 'MLAGI.PA', label: 'AG3I' },
  { value: 'MLAGP.PA', label: 'AGP MALAGA SOCIMI' },
  { value: 'ALAGP.PA', label: 'AGRIPOWER' },
  { value: 'ALAGR.PA', label: 'AGROGENERATION' },
  { value: 'AF.PA', label: 'AIR FRANCE -KLM' },
  { value: 'AI.PA', label: 'AIR LIQUIDE' },
  { value: 'MLAIM.PA', label: 'AIR MARINE' },
  { value: 'AIR.PA', label: 'AIRBUS' },
  { value: 'AKA.PA', label: 'AKKA TECHNOLOGIES' },
  { value: 'AKW.PA', label: 'AKWEL' },
  { value: 'ABIO.PA', label: 'ALBIOMA' },
  { value: 'ALCHI.PA', label: 'ALCHIMIE' },
  { value: 'ALD.PA', label: 'ALD' },
  { value: 'ALPHY.PA', label: 'ALES GROUPE' },
  { value: 'CDA.PA', label: 'ALPES (COMPAGNIE)' },
  { value: 'ALM.PA', label: 'ALPHA MOS' },
  { value: 'ALO.PA', label: 'ALSTOM' },
  { value: 'ALODS.PA', label: 'ALSTOM DS' },
  { value: 'LTA.PA', label: 'ALTAMIR' },
  { value: 'ALTA.PA', label: 'ALTAREA' },
  { value: 'AREIT.PA', label: 'ALTAREIT' },
  { value: 'ATE.PA', label: 'ALTEN' },
  { value: 'ALTUR.PA', label: 'ALTUR INVEST.' },
  { value: 'MLALV.PA', label: 'ALVEEN' },
  { value: 'MLAAH.PA', label: 'AMATHEON AGRI' },
  { value: 'ALMIB.PA', label: 'AMOEBA' },
  { value: 'AMPLI.PA', label: 'AMPLITUDE SURGICAL' },
  { value: 'AMUN.PA', label: 'AMUNDI' },
  { value: 'ALANV.PA', label: 'ANEVIA' },
  { value: 'ANVBS.PA', label: 'ANEVIA BSA 2018' },
  { value: 'ANVBU.PA', label: 'ANEVIA BSA A' },
  { value: 'ANVBV.PA', label: 'ANEVIA BSA B' },
  { value: 'ALANT.PA', label: 'ANTEVENIO' },
  { value: 'APAM.PA', label: 'APERAM' },
  { value: 'APM.PA', label: 'APTORUM GROUP CL A' },
  { value: 'ALAQU.PA', label: 'AQUILA' },
  { value: 'MT.PA', label: 'ARCELORMITTAL SA' },
  { value: 'JXR.PA', label: 'ARCHOS' },
  { value: 'ALCUR.PA', label: 'ARCURE' },
  { value: 'MLARD.PA', label: 'ARDOIN ST AMAND A' },
  { value: 'ARDO.PA', label: 'ARDOIN ST AMAND B' },
  { value: 'ARG.PA', label: 'ARGAN' },
  { value: 'AKE.PA', label: 'ARKEMA' },
  { value: 'MLARO.PA', label: 'AROCA DEL PINAR' },
  { value: 'ARTE.PA', label: 'ARTEA' },
  { value: 'ALATF.PA', label: 'ARTEFACT' },
  { value: 'PRC.PA', label: 'ARTMARKET COM' },
  { value: 'ARTO.PA', label: 'ARTOIS NOM.' },
  { value: 'MLAEM.PA', label: 'ASHLER ET MANSON' },
  { value: 'ASIT.PA', label: 'ASIT' },
  { value: 'ASY.PA', label: 'ASSYSTEM' },
  { value: 'ATA.PA', label: 'ATARI' },
  { value: 'ATEME.PA', label: 'ATEME' },
  { value: 'ATO.PA', label: 'ATOS' },
  { value: 'AUB.PA', label: 'AUBAY' },
  { value: 'MLAUD.PA', label: 'AUDIENCE LABS' },
  { value: 'ALAVY.PA', label: 'AUDIOVALLEY' },
  { value: 'AUGR.PA', label: 'AUGROS COSMETICS' },
  { value: 'ALAMG.PA', label: 'AUPLATA MINING GR' },
  { value: 'AURE.PA', label: 'AUREA' },
  { value: 'AURS.PA', label: 'AURES TECHNOLOGIES' },
  { value: 'AVT.PA', label: 'AVENIR TELECOM' },
  { value: 'CS.PA', label: 'AXA' },
  { value: 'AXW.PA', label: 'AXWAY SOFTWARE' },
  { value: 'MLAZL.PA', label: 'AZ LEASING' },
  { value: 'MLAAT.PA', label: 'AZOREAN TECH' },
  { value: 'BCRA.PA', label: 'BACCARAT' },
  { value: 'ALBKK.PA', label: 'BAIKOWSKI' },
  { value: 'BAIN.PA', label: 'BAINS MER MONACO' },
  { value: 'BALYO.PA', label: 'BALYO' },
  { value: 'BUI.PA', label: 'BARBARA BUI' },
  { value: 'MLBAR.PA', label: 'BARINGS CORE SPAIN' },
  { value: 'BASS.PA', label: 'BASSAC' },
  { value: 'BLC.PA', label: 'BASTIDE LE CONFORT' },
  { value: 'MLBAT.PA', label: 'BATLA MINERALS' },
  { value: 'ALBDM.PA', label: 'BD MULTI MEDIA' },
  { value: 'FBEL.PA', label: 'BEL' },
  { value: 'BEN.PA', label: 'BENETEAU' },
  { value: 'ALDBL.PA', label: 'BERNARD LOISEAU' },
  { value: 'BB.PA', label: 'BIC' },
  { value: 'BIG.PA', label: 'BIGBEN INTERACTIVE' },
  { value: 'ALBLD.PA', label: 'BILENDI' },
  { value: 'ALTUV.PA', label: 'BIO-UV GROUP' },
  { value: 'ALCOR.PA', label: 'BIOCORP' },
  { value: 'BIM.PA', label: 'BIOMERIEUX' },
  { value: 'ALBPS.PA', label: 'BIOPHYTIS' },
  { value: 'BPSBS.PA', label: 'BIOPHYTIS BSA' },
  { value: 'ALBIO.PA', label: 'BIOSYNEX' },
  { value: 'BIOBS.PA', label: 'BIOSYNEX BSAR' },
  { value: 'BLEE.PA', label: 'BLEECKER' },
  { value: 'MLBSP.PA', label: 'BLUE SHARK POWER' },
  { value: 'ALBLU.PA', label: 'BLUELINEA' },
  { value: 'BLUBS.PA', label: 'BLUELINEA BSA J' },
  { value: 'BLUBT.PA', label: 'BLUELINEA BSA Y' },
  { value: 'BNP.PA', label: 'BNP PARIBAS ACT.A' },
  { value: 'MLONE.PA', label: 'BODY ONE' },
  { value: 'BOI.PA', label: 'BOIRON' },
  { value: 'BOL.PA', label: 'BOLLORE' },
  { value: 'BON.PA', label: 'BONDUELLE' },
  { value: 'BOTHE.PA', label: 'BONE THERAPEUTICS' },
  { value: 'BOOST.PA', label: 'BOOSTHEAT' },
  { value: 'ALBOU.PA', label: 'BOURRELIER GROUP' },
  { value: 'BSD.PA', label: 'BOURSE DIRECT' },
  { value: 'EN.PA', label: 'BOUYGUES' },
  { value: 'BVI.PA', label: 'BUREAU VERITAS' },
  { value: 'BUR.PA', label: 'BURELLE' },
  { value: 'CAT31.PA', label: 'CA TOULOUSE 31 CCI' },
  { value: 'ALCG.PA', label: 'CABASSE GROUP' },
  { value: 'CAFO.PA', label: 'CAFOM' },
  { value: 'MLAAE.PA', label: 'CAIRE' },
  { value: 'CBDG.PA', label: 'CAMBODGE NOM.' },
  { value: 'CAPLI.PA', label: 'CAPELLI' },
  { value: 'CAP.PA', label: 'CAPGEMINI' },
  { value: 'ALCRB.PA', label: 'CARBIOS' },
  { value: 'ALCAR.PA', label: 'CARMAT' },
  { value: 'CARM.PA', label: 'CARMILA' },
  { value: 'CARP.PA', label: 'CARPINIENNE PART.' },
  { value: 'CA.PA', label: 'CARREFOUR' },
  { value: 'CO.PA', label: 'CASINO GUICHARD' },
  { value: 'CAS.PA', label: 'CAST' },
  { value: 'CATG.PA', label: 'CATANA GROUP' },
  { value: 'CTRG.PA', label: 'CATERING INTL SCES' },
  { value: 'CATR.PA', label: 'CATERPILLAR INC' },
  { value: 'CBOT.PA', label: 'CBO TERRITORIA' },
  { value: 'MLCEC.PA', label: 'CECURITY.COM' },
  { value: 'CGM.PA', label: 'CEGEDIM' },
  { value: 'CGR.PA', label: 'CEGEREAL' },
  { value: 'ALCLS.PA', label: 'CELLECTIS' },
  { value: 'CYAD.PA', label: 'CELYAD ONCOLOGY' },
  { value: 'ALPCV.PA', label: 'CERINNOV GROUP' },
  { value: 'ALCES.PA', label: 'CESAR' },
  { value: 'MLCSA.PA', label: 'CESYNT A SHARES' },
  { value: 'MLCSB.PA', label: 'CESYNT B SHARES' },
  { value: 'CFI.PA', label: 'CFI' },
  { value: 'MLCFM.PA', label: 'CFM INDOSUEZWEALTH' },
  { value: 'CGG.PA', label: 'CGG' },
  { value: 'CGGBS.PA', label: 'CGG BSA 1' },
  { value: 'CGGBT.PA', label: 'CGG BSA 2' },
  { value: 'MLCFD.PA', label: 'CH.FER DEPARTEMENT' },
  { value: 'MLCVG.PA', label: 'CH.FER VAR GARD N.' },
  { value: 'CRI.PA', label: 'CHARGEURS' },
  { value: 'CHSR.PA', label: 'CHAUSSERIA' },
  { value: 'MLCHE.PA', label: 'CHEOPS TECHNOLOGY' },
  { value: 'CDI.PA', label: 'CHRISTIAN DIOR' },
  { value: 'CIBBS.PA', label: 'CIBOX BS' },
  { value: 'CIB.PA', label: 'CIBOX INTER A CTIV' },
  { value: 'MLCMB.PA', label: 'CIE DU MONT BLANC' },
  { value: 'MLCIO.PA', label: 'CIOA' },
  { value: 'CLA.PA', label: 'CLARANOVA' },
  { value: 'ALCLA.PA', label: 'CLASQUIN' },
  { value: 'COM.PA', label: 'CNIM GROUP' },
  { value: 'CNV.PA', label: 'CNOVA' },
  { value: 'CNP.PA', label: 'CNP ASSURANCES' },
  { value: 'COFA.PA', label: 'COFACE' },
  { value: 'ALCOF.PA', label: 'COFIDUR' },
  { value: 'COGEC.PA', label: 'COGELEC' },
  { value: 'ALCOG.PA', label: 'COGRA' },
  { value: 'COH.PA', label: 'COHERIS' },
  { value: 'ALCOI.PA', label: 'COIL' },
  { value: 'RE.PA', label: 'COLAS' },
  { value: 'MLCLP.PA', label: 'COLIPAYS' },
  { value: 'MLMFI.PA', label: 'CONDOR TECHNOLOG' },
  { value: 'MLCNT.PA', label: 'CONSORT NT' },
  { value: 'MLLCB.PA', label: 'CONSTRUCTEURS BOIS' },
  { value: 'MLCOR.PA', label: 'COREP LIGHTING' },
  { value: 'MLCOU.PA', label: 'COURBET' },
  { value: 'COUR.PA', label: 'COURTOIS' },
  { value: 'COV.PA', label: 'COVIVIO' },
  { value: 'COVH.PA', label: 'COVIVIO HOTELS' },
  { value: 'CRAP.PA', label: 'CRCAM ALP.PROV.CCI' },
  { value: 'CRAV.PA', label: 'CRCAM ATL.VEND.CCI' },
  { value: 'CRBP2.PA', label: 'CRCAM BRIE PIC2CCI' },
  { value: 'CIV.PA', label: 'CRCAM ILLE-VIL.CCI' },
  { value: 'CRLA.PA', label: 'CRCAM LANGUED CCI' },
  { value: 'CRLO.PA', label: 'CRCAM LOIRE HTE L.' },
  { value: 'CMO.PA', label: 'CRCAM MORBIHAN CCI' },
  { value: 'CNF.PA', label: 'CRCAM NORD CCI' },
  { value: 'CCN.PA', label: 'CRCAM NORM.SEINE' },
  { value: 'CAF.PA', label: 'CRCAM PARIS ET IDF' },
  { value: 'CRSU.PA', label: 'CRCAM SUD R.A.CCI' },
  { value: 'CRTO.PA', label: 'CRCAM TOURAINE CCI' },
  { value: 'ACA.PA', label: 'CREDIT AGRICOLE' },
  { value: 'ALCJ.PA', label: 'CROSSJECT' },
  { value: 'CROS.PA', label: 'CROSSWOOD' },
  { value: 'SX.PA', label: 'CS GROUP.' },
  { value: 'ALCYB.PA', label: 'CYBERGUN' },
  { value: 'CYBBT.PA', label: 'CYBERGUN BSA 2' },
  { value: 'CYBK1.PA', label: 'CYBERGUN BSA K1' },
  { value: 'CYBKA.PA', label: 'CYBERGUN BSA K2A' },
  { value: 'CYBKB.PA', label: 'CYBERGUN BSA K2B' },
  { value: 'ALDLS.PA', label: 'D.L.S.I.' },
  { value: 'MLGEL.PA', label: 'D2L GROUP' },
  { value: 'DLT.PA', label: 'DALET' },
  { value: 'MLDAM.PA', label: 'DAMARIS' },
  { value: 'ALDAR.PA', label: 'DAMARTEX' },
  { value: 'BN.PA', label: 'DANONE' },
  { value: 'AM.PA', label: 'DASSAULT AVIATION' },
  { value: 'DSY.PA', label: 'DASSAULT SYSTEMES' },
  { value: 'ALDBT.PA', label: 'DBT' },
  { value: 'DBV.PA', label: 'DBV TECHNOLOGIES' },
  { value: 'ALDEI.PA', label: 'DEINOVE' },
  { value: 'ALDEL.PA', label: 'DELFINGEN' },
  { value: 'ALDR.PA', label: 'DELTA DRONE' },
  { value: 'ALDBS.PA', label: 'DELTA DRONE BSA' },
  { value: 'ALDBY.PA', label: 'DELTA DRONE BSA Y' },
  { value: 'DLTA.PA', label: 'DELTA PLUS GROUP' },
  { value: 'DBG.PA', label: 'DERICHEBOURG' },
  { value: 'MLDYH.PA', label: 'DESIGN YOUR HOME' },
  { value: 'ALDEV.PA', label: 'DEVERNOIS' },
  { value: 'DVT.PA', label: 'DEVOTEAM' },
  { value: 'DGE.PA', label: 'DIAGEO' },
  { value: 'DGM.PA', label: 'DIAGNOSTIC MEDICAL' },
  { value: 'ALDNX.PA', label: 'DNXCORP' },
  { value: 'DPAM.PA', label: 'DOCK.PETR.AMBES AM' },
  { value: 'ALDOL.PA', label: 'DOLFINES' },
  { value: 'ALDNE.PA', label: 'DONTNOD' },
  { value: 'ALDRV.PA', label: 'DRONE VOLT' },
  { value: 'DRODS.PA', label: 'DRONE VOLT DS' },
  { value: 'MLDYN.PA', label: 'DYNAFOND' },
  { value: 'MLDYX.PA', label: 'DYNEX ENERGY SA' },
  { value: 'MLEAS.PA', label: 'EASSON HOLDINGS' },
  { value: 'ALEZV.PA', label: 'EASYVISTA' },
  { value: 'MLEDR.PA', label: 'EAUX DE ROYAN' },
  { value: 'MLEAV.PA', label: 'EAVS' },
  { value: 'ECASA.PA', label: 'ECA' },
  { value: 'MLECO.PA', label: 'ECOLUTIONS' },
  { value: 'ALECO.PA', label: 'ECOMIAM' },
  { value: 'ALESA.PA', label: 'ECOSLOPS' },
  { value: 'EDEN.PA', label: 'EDENRED' },
  { value: 'EDF.PA', label: 'EDF' },
  { value: 'ALEAC.PA', label: 'EDILIZIACROBATICA' },
  { value: 'MLEDS.PA', label: 'EDITIONS DU SIGNE' },
  { value: 'MLEDU.PA', label: 'EDUNIVERSAL' },
  { value: 'MLEES.PA', label: 'EES' },
  { value: 'GID.PA', label: 'EGIDE' },
  { value: 'FGR.PA', label: 'EIFFAGE' },
  { value: 'EKI.PA', label: 'EKINOPS' },
  { value: 'ELEC.PA', label: 'ELEC.STRASBOURG' },
  { value: 'EEM.PA', label: 'ELECT. MADAGASCAR' },
  { value: 'ELIOR.PA', label: 'ELIOR GROUP' },
  { value: 'ELIS.PA', label: 'ELIS' },
  { value: 'ALEMV.PA', label: 'EMOVA GROUP' },
  { value: 'ALDUB.PA', label: 'ENCRES DUBUIT' },
  { value: 'ALNN6.PA', label: 'ENENSYS' },
  { value: 'ALNRG.PA', label: 'ENERGISME' },
  { value: 'ALENE.PA', label: 'ENERTIME' },
  { value: 'ENGI.PA', label: 'ENGIE' },
  { value: 'EPS.PA', label: 'ENGIE EPS' },
  { value: 'ALENT.PA', label: 'ENTREPARTICULIERS' },
  { value: 'ALENR.PA', label: 'ENTREPRENDRE' },
  { value: 'ALTEV.PA', label: 'ENVEA' },
  { value: 'ALEO2.PA', label: 'EO2' },
  { value: 'EOSI.PA', label: 'EOS IMAGING' },
  { value: 'ERA.PA', label: 'ERAMET' },
  { value: 'ERYP.PA', label: 'ERYTECH PHARMA' },
  { value: 'ESI.PA', label: 'ESI GROUP' },
  { value: 'ALESK.PA', label: 'ESKER' },
  { value: 'ESP.PA', label: 'ESPERITE' },
  { value: 'EL.PA', label: 'ESSILORLUXOTTICA' },
  { value: 'ES.PA', label: 'ESSO' },
  { value: 'EFI.PA', label: 'EURASIA FONC INV' },
  { value: 'ALEUA.PA', label: 'EURASIA GROUPE' },
  { value: 'RF.PA', label: 'EURAZEO' },
  { value: 'EUR.PA', label: 'EURO RESSOURCES' },
  { value: 'ALERS.PA', label: 'EUROBIO-SCIENTIFIC' },
  { value: 'ALECR.PA', label: 'EUROFINS CEREP' },
  { value: 'ERF.PA', label: 'EUROFINS SCIENT.' },
  { value: 'ALGEM.PA', label: 'EUROGERM' },
  { value: 'MLERO.PA', label: 'EUROLAND CORPORATE' },
  { value: 'ALEMG.PA', label: 'EUROMEDIS GROUPE' },
  { value: 'ENX.PA', label: 'EURONEXT' },
  { value: 'ECP.PA', label: 'EUROPACORP' },
  { value: 'EUCAR.PA', label: 'EUROPCAR MOBILITY' },
  { value: 'ALEUP.PA', label: 'EUROPLASMA' },
  { value: 'EURBU.PA', label: 'EUROPLASMA BSC' },
  { value: 'ETL.PA', label: 'EUTELSAT COMMUNIC.' },
  { value: 'EGR.PA', label: 'EVERGREEN' },
  { value: 'MLEVE.PA', label: 'EVERSET' },
  { value: 'ALTVO.PA', label: 'EVOLIS' },
  { value: 'EXAC.PA', label: 'EXACOMPTA CLAIREF.' },
  { value: 'EXE.PA', label: 'EXEL INDUSTRIES' },
  { value: 'EPCP.PA', label: 'EXPLOS.PROD.CHI.PF' },
  { value: 'EXPL.PA', label: 'EXPLOSIFS PROD.CHI' },
  { value: 'ALPHI.PA', label: 'FACEPHI' },
  { value: 'ALFBA.PA', label: 'FASHION B AIR' },
  { value: 'EO.PA', label: 'FAURECIA' },
  { value: 'FAUV.PA', label: 'FAUVET GIREL' },
  { value: 'FAYE.PA', label: 'FAYENC.SARREGUEMI.' },
  { value: 'MLFDV.PA', label: 'FD' },
  { value: 'FDJ.PA', label: 'FDJ' },
  { value: 'FCMC.PA', label: 'FERM.CAS.MUN.CANNE' },
  { value: 'FALG.PA', label: 'FERMENTALG' },
  { value: 'FFP.PA', label: 'FFP' },
  { value: 'SACI.PA', label: 'FIDUCIAL OFF.SOL.' },
  { value: 'ORIA.PA', label: 'FIDUCIAL REAL EST.' },
  { value: 'FGA.PA', label: 'FIGEAC AERO' },
  { value: 'ALFIL.PA', label: 'FILAE' },
  { value: 'BERR.PA', label: 'FIN.ETANG BERRE' },
  { value: 'EBPF.PA', label: 'FIN.ETANG BERRE PF' },
  { value: 'FOAF.PA', label: 'FIN.OUEST AFRICAIN' },
  { value: 'FINM.PA', label: 'FINANCIERE MARJOS' },
  { value: 'ODET.PA', label: 'FINANCIERE ODET' },
  { value: 'FNTS.PA', label: 'FINATIS' },
  { value: 'MLFXO.PA', label: 'FINAXO' },
  { value: 'FIPP.PA', label: 'FIPP' },
  { value: 'MLFIR.PA', label: 'FIRSTCAUTION' },
  { value: 'ALFLE.PA', label: 'FLEURY MICHON' },
  { value: 'FNAC.PA', label: 'FNAC DARTY' },
  { value: 'ALFOC.PA', label: 'FOCUS HOME INT' },
  { value: 'FPN.PA', label: 'FONC. PARIS NORD' },
  { value: 'LEBL.PA', label: 'FONCIERE 7 INVEST' },
  { value: 'FATL.PA', label: 'FONCIERE ATLAND' },
  { value: 'EURS.PA', label: 'FONCIERE EURIS' },
  { value: 'INEA.PA', label: 'FONCIERE INEA' },
  { value: 'FLY.PA', label: 'FONCIERE LYONNAISE' },
  { value: 'MLVIN.PA', label: 'FONCIERE VINDI' },
  { value: 'SPEL.PA', label: 'FONCIERE VOLTA' },
  { value: 'FORE.PA', label: 'FORESTIERE EQUAT.' },
  { value: 'ALFPC.PA', label: 'FOUNTAINE PAJOT' },
  { value: 'LFDE.PA', label: 'FRANCAISE ENERGIE' },
  { value: 'MLFSG.PA', label: 'FRANCE SOIR GROUPE' },
  { value: 'MLFTI.PA', label: 'FRANCE TOURISME' },
  { value: 'ALFRE.PA', label: 'FREELANCE.COM' },
  { value: 'FREY.PA', label: 'FREY' },
  { value: 'MLGAI.PA', label: 'G.A.I.' },
  { value: 'MLGAL.PA', label: 'GALEO' },
  { value: 'GALIM.PA', label: 'GALIMMO' },
  { value: 'ALBI.PA', label: 'GASCOGNE' },
  { value: 'GAM.PA', label: 'GAUMONT' },
  { value: 'ALGAU.PA', label: 'GAUSSIN' },
  { value: 'GAUBS.PA', label: 'GAUSSIN BSAR' },
  { value: 'GEA.PA', label: 'GEA GRENOBL.ELECT.' },
  { value: 'GECP.PA', label: 'GECI INTL' },
  { value: 'GECBT.PA', label: 'GECI INTL BSAR A' },
  { value: 'GFC.PA', label: 'GECINA' },
  { value: 'GNE.PA', label: 'GENERAL ELECTRIC' },
  { value: 'GENX.PA', label: 'GENERIX GROUP' },
  { value: 'GNRO.PA', label: 'GENEURO' },
  { value: 'GNFT.PA', label: 'GENFIT' },
  { value: 'GKTX.PA', label: 'GENKYOTEX' },
  { value: 'GV.PA', label: 'GENOMIC VISION' },
  { value: 'ALGEN.PA', label: 'GENOWAY' },
  { value: 'SIGHT.PA', label: 'GENSIGHT BIOLOGICS' },
  { value: 'MLGEQ.PA', label: 'GENTLEMENS EQUITY' },
  { value: 'GEPBS.PA', label: 'GEP BSA 2020' },
  { value: 'GET.PA', label: 'GETLINK SE' },
  { value: 'ALGEV.PA', label: 'GEVELOT' },
  { value: 'GLO.PA', label: 'GL EVENTS' },
  { value: 'ALGBE.PA', label: 'GLOBAL BIOENERGIES' },
  { value: 'ALGEP.PA', label: 'GLOBAL ECOPOWER' },
  { value: 'ALGLD.PA', label: 'GOLD BY GOLD' },
  { value: 'MLGML.PA', label: 'GOUR MEDICAL' },
  { value: 'GPE.PA', label: 'GPE GROUP PIZZORNO' },
  { value: 'ALPAR.PA', label: 'GPE PAROT (AUTO)' },
  { value: 'GRVO.PA', label: 'GRAINES VOLTZ' },
  { value: 'MLCMG.PA', label: 'GRECEMAR' },
  { value: 'MLGRC.PA', label: 'GROUPE CARNIVOR' },
  { value: 'CEN.PA', label: 'GROUPE CRIT' },
  { value: 'FLO.PA', label: 'GROUPE FLO' },
  { value: 'GOE.PA', label: 'GROUPE GORGE' },
  { value: 'ALGIL.PA', label: 'GROUPE GUILLIN' },
  { value: 'IRD.PA', label: 'GROUPE IRD' },
  { value: 'GJAJ.PA', label: 'GROUPE JAJ' },
  { value: 'ALLDL.PA', label: 'GROUPE LDLC' },
  { value: 'OPN.PA', label: 'GROUPE OPEN' },
  { value: 'PARP.PA', label: 'GROUPE PARTOUCHE' },
  { value: 'MLPVG.PA', label: 'GROUPE PLUS-VALUES' },
  { value: 'SFPI.PA', label: 'GROUPE SFPI' },
  { value: 'ALGTR.PA', label: 'GROUPE TERA' },
  { value: 'ALIMO.PA', label: 'GROUPIMO' },
  { value: 'GTBP.PA', label: 'GT BIOPHARMA INC' },
  { value: 'GTT.PA', label: 'GTT' },
  { value: 'MLGDI.PA', label: 'GUANDAO PUER INVES' },
  { value: 'GBT.PA', label: 'GUERBET' },
  { value: 'GUI.PA', label: 'GUILLEMOT' },
  { value: 'ALHEO.PA', label: 'H2O INNOVATION INC' },
  { value: 'PIG.PA', label: 'HAULOTTE GROUP' },
  { value: 'MLAHC.PA', label: 'HEALTH' },
  { value: 'MLHAY.PA', label: 'HEALTHCARE ACTIVOS' },
  { value: 'ALHRG.PA', label: 'HERIGE' },
  { value: 'RMS.PA', label: 'HERMES INTL' },
  { value: 'HEXA.PA', label: 'HEXAOM' },
  { value: 'HF.PA', label: 'HF' },
  { value: 'HCO.PA', label: 'HIGH CO' },
  { value: 'ALHIO.PA', label: 'HIOLLE INDUSTRIES' },
  { value: 'HIPAY.PA', label: 'HIPAY GROUP' },
  { value: 'ALHIT.PA', label: 'HITECHPROS' },
  { value: 'MLHK.PA', label: 'HK' },
  { value: 'MLHBB.PA', label: 'HOCHE BAINS L.BAIN' },
  { value: 'ALHGR.PA', label: 'HOFFMANN' },
  { value: 'MLHCF.PA', label: 'HOME CONCEPT' },
  { value: 'MLHPE.PA', label: 'HOPENING' },
  { value: 'HOP.PA', label: 'HOPSCOTCH GROUPE' },
  { value: 'ALHSW.PA', label: 'HORIZONTALSOFTWARE' },
  { value: 'MLHMC.PA', label: 'HOT.MAJESTIC CANNE' },
  { value: 'MLHOT.PA', label: 'HOTELIM' },
  { value: 'HDP.PA', label: 'HOTELS DE PARIS' },
  { value: 'MLHIN.PA', label: 'HOTL.IMMOB.NICE' },
  { value: 'HSB.PA', label: 'HSBC HOLDINGS' },
  { value: 'ALHYG.PA', label: 'HYBRIGENICS' },
  { value: 'MLHYD.PA', label: 'HYDRAULIQUE PB' },
  { value: 'MLHYE.PA', label: 'HYDRO-EXPLOIT.' },
  { value: 'ALICR.PA', label: 'I.CERAM' },
  { value: 'ALI2S.PA', label: 'I2S' },
  { value: 'MLINT.PA', label: 'IANTE INVESTMENTS' },
  { value: 'ICAD.PA', label: 'ICADE' },
  { value: 'IDL.PA', label: 'ID LOGISTICS GROUP' },
  { value: 'IDIP.PA', label: 'IDI' },
  { value: 'MLIDS.PA', label: 'IDS' },
  { value: 'ALIDS.PA', label: 'IDSUD' },
  { value: 'IFF.PA', label: 'IFF' },
  { value: 'IGE.PA', label: 'IGE + XAO' },
  { value: 'ILD.PA', label: 'ILIAD' },
  { value: 'MLIML.PA', label: 'IMALLIANCE' },
  { value: 'NK.PA', label: 'IMERYS' },
  { value: 'MLIPP.PA', label: 'IMM.PARIS.PERLE' },
  { value: 'ALIMR.PA', label: 'IMMERSION' },
  { value: 'IMDA.PA', label: 'IMMOB.DASSAULT' },
  { value: 'ALIMP.PA', label: 'IMPLANET' },
  { value: 'MLIMP.PA', label: 'IMPRIMERIE CHIRAT' },
  { value: 'INFE.PA', label: 'INDLE FIN.ENTREPR.' },
  { value: 'MLIFC.PA', label: 'INFOCLIP' },
  { value: 'INF.PA', label: 'INFOTEL' },
  { value: 'MLISP.PA', label: 'INMOSUPA' },
  { value: 'IPH.PA', label: 'INNATE PHARMA' },
  { value: 'INN.PA', label: 'INNELEC MULTIMEDIA' },
  { value: 'MLIDP.PA', label: 'INNOVADERMA PLC' },
  { value: 'MLIRF.PA', label: 'INNOVATIVE RFK SPA' },
  { value: 'ALLUX.PA', label: 'INSTALLUX' },
  { value: 'ALINT.PA', label: 'INTEGRAGEN' },
  { value: 'ITP.PA', label: 'INTERPARFUMS' },
  { value: 'ITXT.PA', label: 'INTEXA' },
  { value: 'ALINS.PA', label: 'INTRASENSE' },
  { value: 'IVA.PA', label: 'INVENTIVA' },
  { value: 'ALINV.PA', label: 'INVIBES ADVERTSING' },
  { value: 'MLIOC.PA', label: 'IOC HOLDING' },
  { value: 'MLIPO.PA', label: 'IPOSA PROPERTIES' },
  { value: 'IPN.PA', label: 'IPSEN' },
  { value: 'IPS.PA', label: 'IPSOS' },
  { value: 'ALITL.PA', label: 'IT LINK' },
  { value: 'MLITN.PA', label: 'ITALY INNOVAZIONI' },
  { value: 'ITE.PA', label: 'ITESOFT' },
  { value: 'ALIVA.PA', label: 'IVALIS' },
  { value: 'JBOG.PA', label: 'JACQUES BOGART' },
  { value: 'JCQ.PA', label: 'JACQUET METALS' },
  { value: 'DEC.PA', label: 'JC DECAUX SA.' },
  { value: 'MLJSA.PA', label: 'JSA TECHNOLOGY' },
  { value: 'ALKAL.PA', label: 'KALRAY' },
  { value: 'KOF.PA', label: 'KAUFMAN ET BROAD' },
  { value: 'KER.PA', label: 'KERING' },
  { value: 'ALKLK.PA', label: 'KERLINK' },
  { value: 'KEY.PA', label: 'KEYRUS' },
  { value: 'ALKKO.PA', label: 'KKO INTERNATIONAL' },
  { value: 'LI.PA', label: 'KLEPIERRE' },
  { value: 'ALSIM.PA', label: 'KLIMVEST' },
  { value: 'KORI.PA', label: 'KORIAN' },
  { value: 'MLKRI.PA', label: 'KRIEF GROUP' },
  { value: 'MLVAP.PA', label: 'KUMULUS VAPE' },
  { value: 'OR.PA', label: "L'OREAL" },
  { value: 'LFVE.PA', label: 'LA FONCIERE VERTE' },
  { value: 'ALPER.PA', label: 'LA PERLA FASHION' },
  { value: 'LACR.PA', label: 'LACROIX SA' },
  { value: 'LHN.PA', label: 'LAFARGEHOLCIM LTD' },
  { value: 'LAF.PA', label: 'LAFUMA' },
  { value: 'MMB.PA', label: 'LAGARDERE S.C.A.' },
  { value: 'ALLAN.PA', label: 'LANSON-BCC' },
  { value: 'LAT.PA', label: 'LATECOERE' },
  { value: 'LPE.PA', label: 'LAURENT-PERRIER' },
  { value: 'LOUP.PA', label: 'LDC' },
  { value: 'ALTAN.PA', label: 'LE TANNEUR' },
  { value: 'LBON.PA', label: 'LEBON' },
  { value: 'LSS.PA', label: 'LECTRA' },
  { value: 'LR.PA', label: 'LEGRAND' },
  { value: 'ALLHB.PA', label: 'LES HOTELS BAVEREZ' },
  { value: 'TBMBT.PA', label: 'LESTQBLANC202212BS' },
  { value: 'ALLEX.PA', label: 'LEXIBOOK LINGUIST.' },
  { value: 'LIN.PA', label: 'LINEDATA SERVICES' },
  { value: 'FII.PA', label: 'LISI' },
  { value: 'ALLLN.PA', label: 'LLEIDA' },
  { value: 'LNA.PA', label: 'LNA SANTE' },
  { value: 'MLLOI.PA', label: 'LOCASYSTEM INTL' },
  { value: 'ALLOG.PA', label: 'LOGIC INSTRUMENT' },
  { value: 'MLLOG.PA', label: 'LOGIS CONFORT' },
  { value: 'MLCAC.PA', label: 'LOMBARD ET MEDOT' },
  { value: 'ALUCI.PA', label: 'LUCIBEL' },
  { value: 'LUCBS.PA', label: 'LUCIBEL BS' },
  { value: 'LBIRD.PA', label: 'LUMIBIRD' },
  { value: 'MLV4S.PA', label: 'LV4S' },
  { value: 'MC.PA', label: 'LVMH' },
  { value: 'LYS.PA', label: 'LYSOGENE' },
  { value: 'MRM.PA', label: 'M.R.M' },
  { value: 'ALMII.PA', label: 'M2I' },
  { value: 'MLMAD.PA', label: 'MADE' },
  { value: 'ALMNG.PA', label: 'MADVERTISE' },
  { value: 'MLMGL.PA', label: 'MAGILLEM' },
  { value: 'MLMAB.PA', label: 'MAIS.ANTOINE BAUD' },
  { value: 'MLCLI.PA', label: 'MAISON CLIO BLUE' },
  { value: 'MLMAI.PA', label: "MAISONS D'AUJOURD'HUI" },
  { value: 'MDM.PA', label: 'MAISONS DU MONDE' },
  { value: 'ALMAK.PA', label: 'MAKHEIA GROUP' },
  { value: 'MAKBS.PA', label: 'MAKHEIA GROUP BSA' },
  { value: 'ALMKS.PA', label: 'MAKING SCIENCE' },
  { value: 'MALT.PA', label: 'MALTERIES FCO-BEL.' },
  { value: 'MTU.PA', label: 'MANITOU BF' },
  { value: 'MAN.PA', label: 'MANUTAN INTL' },
  { value: 'MLMAQ.PA', label: 'MAQ ADMON. URBANAS' },
  { value: 'ALMAR.PA', label: 'MARE NOSTRUM' },
  { value: 'IAM.PA', label: 'MAROC TELECOM' },
  { value: 'ALMAS.PA', label: 'MASTRAD' },
  { value: 'MASBS.PA', label: 'MASTRAD BS29' },
  { value: 'MKEA.PA', label: 'MAUNA KEA TECH' },
  { value: 'MAU.PA', label: 'MAUREL ET PROM' },
  { value: 'MBWS.PA', label: 'MBWS' },
  { value: 'MBWBT.PA', label: 'MBWS BSA 2022' },
  { value: 'MBWSZ.PA', label: 'MBWS BSAR 2023' },
  { value: 'MCPHY.PA', label: 'MCPHY ENERGY' },
  { value: 'ALMEC.PA', label: 'MECELEC COMPOSITES' },
  { value: 'EDI.PA', label: 'MEDIA 6' },
  { value: 'MLLAB.PA', label: 'MEDIA LAB' },
  { value: 'ALKER.PA', label: 'MEDIA MAKER' },
  { value: 'ALMDT.PA', label: 'MEDIANTECHNOLOGIES' },
  { value: 'MDW.PA', label: 'MEDIAWAN' },
  { value: 'MDWBS.PA', label: 'MEDIAWAN WAR' },
  { value: 'MEDCL.PA', label: 'MEDINCELL' },
  { value: 'MLMCE.PA', label: 'MEDIOCREDITO EUROP' },
  { value: 'MEMS.PA', label: 'MEMSCAP REGPT' },
  { value: 'MERY.PA', label: 'MERCIALYS' },
  { value: 'MRK.PA', label: 'MERCK AND CO INC' },
  { value: 'MRN.PA', label: 'MERSEN' },
  { value: 'METBS.PA', label: 'METABOLIC EX BSA21' },
  { value: 'METEX.PA', label: 'METABOLIC EXPLORER' },
  { value: 'MLETA.PA', label: 'METALLIANCE' },
  { value: 'ALMET.PA', label: 'METHANOR' },
  { value: 'ALMTH.PA', label: 'METHORIOS CAPITAL' },
  { value: 'MLMIB.PA', label: 'METRICS IN BALANCE' },
  { value: 'MMT.PA', label: 'METROPOLE TV' },
  { value: 'ALMGI.PA', label: 'MG INTERNATIONAL' },
  { value: 'ALMDG.PA', label: 'MGI DIGITAL GRAPHI' },
  { value: 'ML.PA', label: 'MICHELIN' },
  { value: 'MUN.PA', label: 'MICROPOLE' },
  { value: 'MLSKN.PA', label: 'MICROSKIN' },
  { value: 'ALMIC.PA', label: 'MICROWAVE VISION' },
  { value: 'MLNMA.PA', label: 'MIGUET ET ASSOCIES' },
  { value: 'ALMLB.PA', label: 'MILIBOO' },
  { value: 'ALBUD.PA', label: 'MINT' },
  { value: 'BUDBS.PA', label: 'MINT BS' },
  { value: 'MLAMY.PA', label: 'MLD' },
  { value: 'ALMND.PA', label: 'MND' },
  { value: 'ALMBS.PA', label: 'MND BSA 2019' },
  { value: 'MONC.PA', label: 'MONCEY (FIN.) NOM.' },
  { value: 'MLMON.PA', label: 'MONFINANCIER' },
  { value: 'MONT.PA', label: 'MONTEA C.V.A.' },
  { value: 'ALMOU.PA', label: 'MOULINVEST' },
  { value: 'ALMRB.PA', label: 'MR BRICOLAGE' },
  { value: 'MLMRE.PA', label: 'MRE-III.P-5.SOCIMI' },
  { value: 'MLMTD.PA', label: 'MTD FINANCE' },
  { value: 'MLMUL.PA', label: 'MULANN' },
  { value: 'MLMMC.PA', label: 'MULTIMICROCLOUD' },
  { value: 'ALMUN.PA', label: 'MUNIC' },
  { value: 'GREV.PA', label: 'MUSEE GREVIN' },
  { value: 'ALMBG.PA', label: 'MYBEST GROUP' },
  { value: 'NACON.PA', label: 'NACON' },
  { value: 'NANO.PA', label: 'NANOBIOTIX' },
  { value: 'KN.PA', label: 'NATIXIS' },
  { value: 'MLNAT.PA', label: 'NATURE ET LOGIS' },
  { value: 'NAVYA.PA', label: 'NAVYA' },
  { value: 'MLNEO.PA', label: 'NEOCOM MULTIMEDIA' },
  { value: 'NEOEN.PA', label: 'NEOEN' },
  { value: 'ALNLF.PA', label: 'NEOLIFE' },
  { value: 'NLFBS.PA', label: 'NEOLIFE BS' },
  { value: 'ALNEV.PA', label: 'NEOVACS' },
  { value: 'NEVBS.PA', label: 'NEOVACS BSA' },
  { value: 'NTG.PA', label: 'NETGEM' },
  { value: 'NRO.PA', label: 'NEURONES' },
  { value: 'MLNEI.PA', label: 'NEWSINVEST' },
  { value: 'NEX.PA', label: 'NEXANS' },
  { value: 'NXI.PA', label: 'NEXITY' },
  { value: 'ALNXT.PA', label: 'NEXTEDIA' },
  { value: 'NEXTS.PA', label: 'NEXTSTAGE' },
  { value: 'COX.PA', label: 'NICOX' },
  { value: 'NOKIA.PA', label: 'NOKIA' },
  { value: 'ALNOV.PA', label: 'NOVACYT' },
  { value: 'MLNOV.PA', label: 'NOVATECH IND.' },
  { value: 'ALNOX.PA', label: 'NOXXON' },
  { value: 'NR21.PA', label: 'NR21' },
  { value: 'NRG.PA', label: 'NRJ GROUP' },
  { value: 'ALNSC.PA', label: 'NSC GROUPE' },
  { value: 'ALNSE.PA', label: 'NSE' },
  { value: 'MLOSA.PA', label: 'O SORBET D AMOUR' },
  { value: 'ALODI.PA', label: 'O2I' },
  { value: 'O2IBS.PA', label: 'O2I BSA' },
  { value: 'ODBS2.PA', label: 'O2I BSA 2' },
  { value: 'ALOBR.PA', label: 'OBER' },
  { value: 'MLOCT.PA', label: 'OCTOPUS ROBOTS' },
  { value: 'SBT.PA', label: 'OENEO' },
  { value: 'OLG.PA', label: 'OL GROUPE' },
  { value: 'MLOLM.PA', label: 'OLMIX' },
  { value: 'ALONC.PA', label: 'ONCODESIGN' },
  { value: 'MLOEX.PA', label: 'ONE EXPERIENCE' },
  { value: 'MLONL.PA', label: 'ONLINEFORMAPRO' },
  { value: 'ONXEO.PA', label: 'ONXEO' },
  { value: 'ORA.PA', label: 'ORANGE' },
  { value: 'ORAP.PA', label: 'ORAPI' },
  { value: 'ORAPB.PA', label: 'ORAPI BSA' },
  { value: 'MLORB.PA', label: 'ORBIS PROPERTIES' },
  { value: 'KAZI.PA', label: 'ORCHESTRA-PREMAMAN' },
  { value: 'ALORD.PA', label: 'ORDISSIMO' },
  { value: 'OREGE.PA', label: 'OREGE' },
  { value: 'ORP.PA', label: 'ORPEA' },
  { value: 'OSE.PA', label: 'OSE IMMUNO' },
  { value: 'ALOSM.PA', label: 'OSMOZIS' },
  { value: 'MLPAC.PA', label: 'PACTE NOVATION' },
  { value: 'PID.PA', label: 'PARAGON ID' },
  { value: 'PAR.PA', label: 'PAREF' },
  { value: 'MLPFX.PA', label: 'PARFEX' },
  { value: 'PARRO.PA', label: 'PARROT' },
  { value: 'PABSA.PA', label: 'PARROT BSA 1' },
  { value: 'PABSB.PA', label: 'PARROT BSA 2' },
  { value: 'MLHOP.PA', label: 'PART.INDLES MINI.' },
  { value: 'MLPRX.PA', label: 'PARX MATERIALS NV' },
  { value: 'PSAT.PA', label: 'PASSAT' },
  { value: 'PAT.PA', label: 'PATRIMOINE ET COMM' },
  { value: 'ALPAU.PA', label: 'PAULIC MEUNERIE' },
  { value: 'PCA.PA', label: 'PCAS' },
  { value: 'RI.PA', label: 'PERNOD RICARD' },
  { value: 'PERR.PA', label: 'PERRIER (GERARD)' },
  { value: 'UG.PA', label: 'PEUGEOT' },
  { value: 'PHA.PA', label: 'PHARMAGEST INTER.' },
  { value: 'ALPHS.PA', label: 'PHARMASIMPLE' },
  { value: 'ALPHA.PA', label: 'PHARNEXT' },
  { value: 'MLPHW.PA', label: 'PHONE WEB' },
  { value: 'MLPHO.PA', label: 'PHOTONIKE CAPITAL' },
  { value: 'VAC.PA', label: 'PIERRE VACANCES' },
  { value: 'ALPDX.PA', label: 'PISCINES DESJOYAUX' },
  { value: 'ALPIX.PA', label: 'PIXIUM VISION' },
  { value: 'MLPLC.PA', label: 'PLACOPLATRE' },
  { value: 'ALPLA.PA', label: 'PLANET MEDIA' },
  { value: 'ALPAT.PA', label: 'PLANT ADVANCED' },
  { value: 'PATBS.PA', label: 'PLANT ADVANCED BS' },
  { value: 'PVL.PA', label: 'PLAST.VAL LOIRE' },
  { value: 'POM.PA', label: 'PLASTIC OMNIUM' },
  { value: 'ALPJT.PA', label: 'POUJOULAT' },
  { value: 'ALPOU.PA', label: 'POULAILLON' },
  { value: 'POXEL.PA', label: 'POXEL' },
  { value: 'PREC.PA', label: 'PRECIA' },
  { value: 'ALPRE.PA', label: 'PREDILIFE' },
  { value: 'ALPRI.PA', label: 'PRISMAFLEX INTL' },
  { value: 'PROAC.PA', label: 'PROACTIS SA' },
  { value: 'ALPRO.PA', label: 'PRODWARE' },
  { value: 'PWG.PA', label: 'PRODWAYS' },
  { value: 'PRBS1.PA', label: 'PROLOG BSAAR20' },
  { value: 'PROL.PA', label: 'PROLOGUE' },
  { value: 'PROBT.PA', label: 'PROLOGUE BSA' },
  { value: 'PRBS2.PA', label: 'PROLOGUE BSAA2021' },
  { value: 'MLPRI.PA', label: 'PROP.IMMEUBLES' },
  { value: 'MLPRO.PA', label: 'PROVENTURE GOLD' },
  { value: 'PSB.PA', label: 'PSB INDUSTRIES' },
  { value: 'PUBBS.PA', label: 'PUBLICIS BSA' },
  { value: 'PUB.PA', label: 'PUBLICIS GROUPE SA' },
  { value: 'QDT.PA', label: 'QUADIENT' },
  { value: 'ALQP.PA', label: 'QUADPACK' },
  { value: 'ALQGC.PA', label: 'QUANTUM GENOMICS' },
  { value: 'ALQWA.PA', label: 'QWAMPLIFY' },
  { value: 'QWABS.PA', label: 'QWAMPLIFY BSAANE' },
  { value: 'RAL.PA', label: 'RALLYE' },
  { value: 'GDS.PA', label: 'RAMSAY GEN SANTE' },
  { value: 'ML350.PA', label: 'RAPIDO PRET' },
  { value: 'ALREA.PA', label: 'REALITES' },
  { value: 'RX.PA', label: 'RECYLEX S.A.' },
  { value: 'RCO.PA', label: 'REMY COINTREAU' },
  { value: 'RNO.PA', label: 'RENAULT' },
  { value: 'MLREX.PA', label: 'REVIVAL EXPANSION' },
  { value: 'ALREW.PA', label: 'REWORLD MEDIA' },
  { value: 'RXL.PA', label: 'REXEL' },
  { value: 'ALRIB.PA', label: 'RIBER' },
  { value: 'RBT.PA', label: 'ROBERTET' },
  { value: 'CBR.PA', label: 'ROBERTET CDV 87' },
  { value: 'CBE.PA', label: 'ROBERTET CI' },
  { value: 'RBO.PA', label: 'ROCHE BOBOIS' },
  { value: 'ALROC.PA', label: 'ROCTOOL' },
  { value: 'ROCBS.PA', label: 'ROCTOOL BSA 2020' },
  { value: 'ROCBT.PA', label: 'ROCTOOL BSA 2020-2' },
  { value: 'ROTH.PA', label: 'ROTHSCHILD & CO' },
  { value: 'ALRGR.PA', label: 'ROUGIER S.A.' },
  { value: 'MLROU.PA', label: 'ROUSSELET CENTRIF.' },
  { value: 'RUI.PA', label: 'RUBIS' },
  { value: 'SK.PA', label: 'S.E.B.' },
  { value: 'ALSAF.PA', label: 'SAFE ORTHOPAEDICS' },
  { value: 'SAF.PA', label: 'SAFRAN' },
  { value: 'ALWOO.PA', label: 'SAFWOOD' },
  { value: 'SGO.PA', label: 'SAINT GOBAIN' },
  { value: 'SABE.PA', label: 'SAINT JEAN GROUPE' },
  { value: 'SAMS.PA', label: 'SAMSE' },
  { value: 'SAN.PA', label: 'SANOFI' },
  { value: 'ALMER.PA', label: 'SAPMER' },
  { value: 'DIM.PA', label: 'SARTORIUS STED BIO' },
  { value: 'SAVE.PA', label: 'SAVENCIA' },
  { value: 'MLSDN.PA', label: 'SAVONNERIE NYONS' },
  { value: 'MLSBT.PA', label: 'SBT' },
  { value: 'MLSHD.PA', label: 'SCANDINAVIAN HOUSE' },
  { value: 'CBSM.PA', label: 'SCBSM' },
  { value: 'MLCMI.PA', label: 'SCEMI' },
  { value: 'SLB.PA', label: 'SCHLUMBERGER' },
  { value: 'SU.PA', label: 'SCHNEIDER ELECTRIC' },
  { value: 'MLSCH.PA', label: 'SCHOBRUNN PARIS' },
  { value: 'SCR.PA', label: 'SCOR SE' },
  { value: 'SCHP.PA', label: 'SECHE ENVIRONNEM.' },
  { value: 'SGRO.PA', label: 'SEGRO PLC' },
  { value: 'ALSEI.PA', label: 'SEIF SPA' },
  { value: 'SLCO.PA', label: 'SELCODIS' },
  { value: 'SELER.PA', label: 'SELECTIRENTE' },
  { value: 'MLSMP.PA', label: 'SEMPLICEMENTE SpA' },
  { value: 'ALSEN.PA', label: 'SENSORION' },
  { value: 'MLSEQ.PA', label: 'SEQUA PETROLEUM NV' },
  { value: 'SEFER.PA', label: 'SERGEFERRARI GROUP' },
  { value: 'ALSER.PA', label: 'SERMA GROUP' },
  { value: 'SESG.PA', label: 'SES' },
  { value: 'SESL.PA', label: 'SES IMAGOTAG' },
  { value: 'SRP.PA', label: 'SHOWROOMPRIVE' },
  { value: 'ALSIP.PA', label: 'SI PARTICIPATIONS' },
  { value: 'ALBFR.PA', label: 'SIDETRADE' },
  { value: 'GIRO.PA', label: 'SIGNAUX GIROD' },
  { value: 'SII.PA', label: 'SII' },
  { value: 'MLSIL.PA', label: 'SILC' },
  { value: 'MLMAT.PA', label: 'SIMAT' },
  { value: 'MLSIM.PA', label: 'SIMO INTERNATIONAL' },
  { value: 'MLSNT.PA', label: 'SINTESI SpA' },
  { value: 'MLSML.PA', label: 'SMALTO' },
  { value: 'SMLBS.PA', label: 'SMALTO BSA' },
  { value: 'SMCP.PA', label: 'SMCP' },
  { value: 'SMTPC.PA', label: 'SMTPC' },
  { value: 'SFCA.PA', label: 'SOC FRANC CASINOS' },
  { value: 'GLE.PA', label: 'SOCIETE GENERALE' },
  { value: 'SW.PA', label: 'SODEXO' },
  { value: 'SEC.PA', label: 'SODITECH' },
  { value: 'SFBS.PA', label: 'SOFIBUS PATRIMOINE' },
  { value: 'SOFR.PA', label: 'SOFRAGI' },
  { value: 'SOG.PA', label: 'SOGECLAIR' },
  { value: 'SOI.PA', label: 'SOITEC' },
  { value: 'LOCAL.PA', label: 'SOLOCAL GROUP' },
  { value: 'S30.PA', label: 'SOLUTIONS 30 SE' },
  { value: 'SOLB.PA', label: 'SOLVAY' },
  { value: 'SO.PA', label: 'SOMFY SA' },
  { value: 'SOP.PA', label: 'SOPRA STERIA GROUP' },
  { value: 'MLSRP.PA', label: 'SPEED RABBIT PIZZA' },
  { value: 'SPIE.PA', label: 'SPIE' },
  { value: 'ALSGD.PA', label: 'SPINEGUARD' },
  { value: 'ALSPW.PA', label: 'SPINEWAY' },
  { value: 'SPI.PA', label: 'SPIR COMMUNICATION' },
  { value: 'SQI.PA', label: 'SQLI' },
  { value: 'DPT.PA', label: 'ST DUPONT' },
  { value: 'MLSTM.PA', label: 'STEAM FRANCE' },
  { value: 'STF.PA', label: 'STEF' },
  { value: 'STNT.PA', label: 'STENTYS' },
  { value: 'STM.PA', label: 'STMICROELECTRONICS' },
  { value: 'ALSAS.PA', label: 'STRADIM ESPAC.FIN' },
  { value: 'ALSTW.PA', label: 'STREAMWIDE' },
  { value: 'STWDS.PA', label: 'STREAMWIDE BS' },
  { value: 'MLSTR.PA', label: 'STREIT MECANIQUE' },
  { value: 'SEV.PA', label: 'SUEZ' },
  { value: 'MLSUM.PA', label: 'SUMO RESOURCES PLC' },
  { value: 'SSI.PA', label: 'SUPERSONIC IMAGINE' },
  { value: 'SWP.PA', label: 'SWORD GROUP' },
  { value: 'SDG.PA', label: 'SYNERGIE' },
  { value: 'TKTT.PA', label: 'TARKETT' },
  { value: 'TAYN.PA', label: 'TAYNINH' },
  { value: 'MLTEA.PA', label: 'TEAM' },
  { value: 'TECBS.PA', label: 'TECH BSA 2024' },
  { value: 'TCH.PA', label: 'TECHNICOLOR' },
  { value: 'FTI.PA', label: 'TECHNIPFMC' },
  { value: 'TEP.PA', label: 'TELEPERFORMANCE' },
  { value: 'TVRB.PA', label: 'TELEVERBIER' },
  { value: 'MLVST.PA', label: 'TELEVISTA' },
  { value: 'TES.PA', label: 'TESSI' },
  { value: 'TFI.PA', label: 'TF1' },
  { value: 'TFF.PA', label: 'TFF GROUP' },
  { value: 'HO.PA', label: 'THALES' },
  { value: 'ALTBG.PA', label: 'THE BLOCKCHAIN GP' },
  { value: 'ALTHE.PA', label: 'THERACLION' },
  { value: 'ALTER.PA', label: 'THERADIAG' },
  { value: 'ALTHX.PA', label: 'THERANEXUS' },
  { value: 'THEP.PA', label: 'THERMADOR GROUPE' },
  { value: 'TKO.PA', label: 'TIKEHAU CAPITAL' },
  { value: 'TIPI.PA', label: 'TIPIAK' },
  { value: 'TITC.PA', label: 'TITAN CEMENT' },
  { value: 'TVLY.PA', label: 'TIVOLY' },
  { value: 'ALTLX.PA', label: 'TOOLUX SANDING' },
  { value: 'MLTBM.PA', label: 'TOQUEBLANCHEMONDE' },
  { value: 'FP.PA', label: 'TOTAL' },
  { value: 'EC.PA', label: 'TOTAL GABON' },
  { value: 'TOUP.PA', label: 'TOUAX' },
  { value: 'EIFF.PA', label: 'TOUR EIFFEL' },
  { value: 'MLABO.PA', label: 'TOUTABO' },
  { value: 'MLPSH.PA', label: 'TPSH' },
  { value: 'MLTRA.PA', label: 'TRAMWAYS DE ROUEN' },
  { value: 'TNG.PA', label: 'TRANSGENE' },
  { value: 'TRI.PA', label: 'TRIGANO' },
  { value: 'ALTRI.PA', label: 'TRILOGIQ' },
  { value: 'MLTRO.PA', label: 'TROC ILE' },
  { value: 'MLTRC.PA', label: 'TROIS CHENES' },
  { value: 'ALTRO.PA', label: 'TRONICS' },
  { value: 'ALTTI.PA', label: 'TTI' },
  { value: 'ALTXC.PA', label: 'TXCOM' },
  { value: 'ALU10.PA', label: 'U10 CORP' },
  { value: 'UBI.PA', label: 'UBISOFT ENTERTAIN' },
  { value: 'ALUCR.PA', label: 'UCAR' },
  { value: 'MLUMG.PA', label: 'UMALIS GROUP' },
  { value: 'ALUMS.PA', label: 'UMANIS' },
  { value: 'MLUMH.PA', label: 'UNI.METALG.HT-SEI.' },
  { value: 'URW.PA', label: 'UNIBAIL-RODAMCO-WE' },
  { value: 'UNBL.PA', label: 'UNIBEL' },
  { value: 'UFF.PA', label: 'UNION FIN.FRANCE' },
  { value: 'FPG.PA', label: 'UNION TECH.INFOR.' },
  { value: 'ALUNT.PA', label: 'UNITI' },
  { value: 'ALUPG.PA', label: 'UPERGY' },
  { value: 'ALUVI.PA', label: 'UV GERMI' },
  { value: 'ALVAL.PA', label: 'VALBIOTIS' },
  { value: 'FR.PA', label: 'VALEO' },
  { value: 'VK.PA', label: 'VALLOUREC' },
  { value: 'VLA.PA', label: 'VALNEVA' },
  { value: 'MLVAL.PA', label: 'VALONEO' },
  { value: 'ALVU.PA', label: 'VENTE UNIQUE.COM' },
  { value: 'VIE.PA', label: 'VEOLIA ENVIRON.' },
  { value: 'VRLA.PA', label: 'VERALLIA' },
  { value: 'ALVER.PA', label: 'VERGNET' },
  { value: 'VMX.PA', label: 'VERIMATRIX' },
  { value: 'VRNL.PA', label: 'VERNEUIL FINANCE' },
  { value: 'MLVER.PA', label: 'VERNEY CARRON' },
  { value: 'VETO.PA', label: 'VETOQUINOL' },
  { value: 'ALVIA.PA', label: 'VIALIFE' },
  { value: 'VCT.PA', label: 'VICAT' },
  { value: 'VDLO.PA', label: 'VIDELIO' },
  { value: 'VIL.PA', label: 'VIEL ET COMPAGNIE' },
  { value: 'RIN.PA', label: 'VILMORIN & CIE' },
  { value: 'DG.PA', label: 'VINCI' },
  { value: 'VIRP.PA', label: 'VIRBAC' },
  { value: 'ALVIV.PA', label: 'VISIATIV' },
  { value: 'MLVIS.PA', label: 'VISIO NERF' }
];
export default tickers;
