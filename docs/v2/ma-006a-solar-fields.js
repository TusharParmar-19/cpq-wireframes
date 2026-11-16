/* MA-006A: solar-specific field templates.
 * Field schema, not verified product specifications. Units and labels must be validated by engineering. */
window.CPQ_MA006A_SOLAR_FIELDS={
 types:[
  ["general","General / Electrical Equipment"],["pv-module","Solar PV Module"],
  ["inverter","Solar Inverter"],["battery","Battery / Storage"],
  ["mounting","Mounting Structure"],["cable","Solar Cable & Conductors"],
  ["bos","ACDB / DCDB / BOS"],["monitoring","Metering & Monitoring"],
  ["service","Solar EPC / Service"]
 ],
 templates:{
  "pv-module":{label:"PV Module",essential:[
   ["pmaxWp","Rated Power Pmax","Wp","number"],["technology","Cell technology","","select","TOPCon;Mono PERC;HJT;Other"],
   ["efficiencyPct","Module efficiency","%","number"],["vocV","Open-circuit voltage Voc","V","number"],
   ["iscA","Short-circuit current Isc","A","number"],["vmpV","Max-power voltage Vmp","V","number"],
   ["impA","Max-power current Imp","A","number"],["bifacial","Module construction","","select","Monofacial;Bifacial"]
  ],advanced:[
   ["tempCoeffPmax","Pmax temp. coefficient","%/°C","number"],["tempCoeffVoc","Voc temp. coefficient","%/°C","number"],
   ["tempCoeffIsc","Isc temp. coefficient","%/°C","number"],["maxSystemVoltage","Max system voltage","V","number"],
   ["maxSeriesFuse","Max series fuse","A","number"],["cellCount","Cell count / layout","","text"],
   ["glassAndFrame","Glass, frame & junction box","","text"],["connectors","Connector type","","text"],
   ["mechanicalLoad","Mechanical load rating","Pa","number"],["operatingTemp","Operating temperature range","°C","text"],
   ["productWarrantyYears","Product warranty","years","number"],["performanceWarrantyYears","Performance warranty","years","number"],
   ["certifications","IEC / BIS certification refs","","text"],["almmReference","ALMM model/list reference if applicable","","text"],
   ["dcrEvidence","DCR evidence if applicable","","text"],["leadTimeDays","Estimated lead time","days","number"]
  ]},
  inverter:{label:"Solar Inverter",essential:[
   ["inverterType","Inverter type","","select","String;Hybrid;Off-grid;Micro;Central"],
   ["ratedAcKw","Rated AC output","kW","number"],["maxPvInputKwp","Supported PV input","kWp","number"],
   ["maxDcVoltage","Maximum DC voltage","V","number"],["mpptMinV","MPPT minimum voltage","V","number"],
   ["mpptMaxV","MPPT maximum voltage","V","number"],["mpptCount","Number of MPPTs","","number"],
   ["stringsPerMppt","Strings per MPPT","","number"],["phase","AC phase","","select","Single-phase;Three-phase"]
  ],advanced:[
   ["startupVoltage","Startup voltage","V","number"],["maxDcInputCurrent","Maximum DC input current","A","number"],
   ["maxShortCircuitCurrent","Maximum PV short-circuit current","A","number"],
   ["acVoltage","Nominal AC voltage","V","text"],["frequencyHz","AC frequency","Hz","number"],
   ["efficiencyPct","Peak efficiency","%","number"],["protection","SPD / anti-islanding / protection","","text"],
   ["ipRating","Enclosure protection","","text"],["communication","Monitoring interface","","text"],
   ["warrantyYears","Warranty","years","number"],["certifications","IEC / BIS / grid certifications","","text"],
   ["leadTimeDays","Estimated lead time","days","number"]
  ]},
  battery:{label:"Battery / Storage",essential:[
   ["chemistry","Battery chemistry","","select","LFP;NMC;Other"],["nominalKwh","Nominal energy","kWh","number"],
   ["usableKwh","Usable energy","kWh","number"],["continuousKw","Continuous charge/discharge power","kW","number"],
   ["peakKw","Peak power","kW","number"],["nominalVoltage","Nominal voltage","V","number"],
   ["backupMode","Backup operating mode","","select","Not specified;Backup;Self-consumption;Hybrid"]
  ],advanced:[
   ["minVoltage","Minimum voltage","V","number"],["maxVoltage","Maximum voltage","V","number"],
   ["dodPct","Depth of discharge","%","number"],["roundTripEfficiency","Round-trip efficiency","%","number"],
   ["cycleLife","Rated cycle life","cycles","number"],["modulesPerStack","Modules per stack","","number"],
   ["bms","Battery management system","","text"],["protocol","Communication protocol","","text"],
   ["compatibleInverters","Approved inverter references","","text"],["warrantyYears","Warranty","years","number"],
   ["certifications","Battery safety certifications","","text"],["leadTimeDays","Estimated lead time","days","number"]
  ]},
  mounting:{label:"Mounting Structure",essential:[
   ["mountType","Installation type","","select","RCC Rooftop;Metal Roof;Ground Mount;Carport;Elevated"],
   ["material","Structural material","","text"],["compatibleModules","Compatible module sizes","","text"],
   ["tiltMinDeg","Minimum tilt","°","number"],["tiltMaxDeg","Maximum tilt","°","number"],
   ["railLengthMm","Rail / section length","mm","number"],["sectionSize","Section size","","text"]
  ],advanced:[
   ["windLoad","Approved wind-load rating","","text"],["structuralEvidence","Design / structural calculation ref","","text"],
   ["clamps","Clamps / fastener specification","","text"],["coating","Coating / corrosion grade","","text"],
   ["roofCompatibility","Roof compatibility notes","","text"],["warrantyYears","Warranty","years","number"],
   ["certifications","Applicable compliance refs","","text"]
  ]},
  cable:{label:"Solar Cable",essential:[
   ["cableType","Cable application","","select","Solar DC;AC LT;HT;Earth;Communication"],
   ["conductor","Conductor material","","select","Copper;Aluminium;Other"],["cores","Number of cores","","text"],
   ["crossSection","Conductor cross-section","mm²","number"],["voltageRating","Voltage rating","V","text"],
   ["insulation","Insulation / jacket","","text"],["unitLength","Standard coil / drum length","m","number"]
  ],advanced:[
   ["tempRating","Operating temperature","","text"],["uvRating","UV / weather resistance","","text"],
   ["fireRating","Fire / flame rating","","text"],["bendRadius","Minimum bend radius","","text"],
   ["certifications","Cable compliance refs","","text"],["warrantyYears","Warranty","years","number"]
  ]},
  bos:{label:"Electrical BOS & Protection",essential:[
   ["bosType","Equipment type","","select","DCDB;ACDB;Combiner;SPD;Isolator;Earthing;Connector;Other"],
   ["voltageRating","Voltage rating","V","text"],["currentRating","Current rating","A","text"],
   ["ipRating","Ingress protection","","text"],["phase","Phase","","select","DC;Single-phase;Three-phase;Other"],
   ["circuits","Circuits / ways","","text"]
  ],advanced:[
   ["spdType","Surge protection type","","text"],["breakerType","Breaker / isolator type","","text"],
   ["metering","Integrated metering","","text"],["earthing","Earthing specification","","text"],
   ["certifications","Applicable compliance refs","","text"],["warrantyYears","Warranty","years","number"]
  ]},
  monitoring:{label:"Metering & Monitoring",essential:[
   ["deviceType","Device type","","select","Energy Meter;Net Meter;Datalogger;Gateway;Monitoring Platform"],
   ["phase","Electrical phase","","select","Single-phase;Three-phase;N/A"],
   ["accuracy","Accuracy class","","text"],["protocol","Communication","","text"],
   ["interface","Connectivity","","text"]
  ],advanced:[
   ["ctRating","CT ratio / compatibility","","text"],["dataInterval","Reporting interval","","text"],
   ["remoteMonitoring","Remote monitoring capability","","text"],["warrantyYears","Warranty","years","number"],
   ["certifications","Applicable compliance refs","","text"]
  ]},
  service:{label:"Services / EPC",essential:[
   ["scope","Service scope","","text"],["deliverable","Expected deliverables","","text"],
   ["serviceUnit","Commercial unit","","select","Job;Visit;Package;Project;kWp"],
   ["duration","Estimated execution duration","days","number"]
  ],advanced:[
   ["siteConditions","Site and access conditions","","text"],["exclusions","Scope exclusions","","text"],
   ["warranty","Service warranty / SLA","","text"],["commissioningEvidence","Testing & commissioning evidence","","text"]
  ]},
  general:{label:"Generic Product",essential:[],advanced:[]}
 },
 project:{
  essential:[
   ["systemType","Solar system type","","select","On-grid Rooftop;Off-grid;Hybrid;Ground Mount;Carport"],
   ["targetDcKwp","Target DC capacity","kWp","number"],
   ["targetAcKw","Target AC capacity","kW","number"],
   ["roofType","Roof / mounting location","","select","RCC Roof;Metal Sheet Roof;Other Roof;Open Land;Carport"],
   ["usableArea","Usable installation area","m²","number"],
   ["siteLocation","Installation location","","text"]
  ],
  site:[
   ["orientation","Roof orientation / azimuth","°","text"],
   ["tilt","Proposed tilt","°","number"],
   ["shading","Shading observations","","text"],["obstructions","Obstructions / setbacks","","text"],
   ["roofNotes","Roof condition / structural evidence","","text"],["installSchedule","Required completion date","","date"]
  ],
  electrical:[
   ["discom","DISCOM / utility","","text"],["sanctionedLoadKw","Sanctioned load","kW","number"],
   ["monthlyKwh","Monthly electricity consumption","kWh","number"],
   ["tariffInr","Average tariff estimate","₹/kWh","number"],["billReference","Electricity bill reference","","text"],
   ["gridConnection","Interconnection / net metering","","text"]
  ],
  engineering:[
   ["moduleCount","Proposed PV module count","","number"],
   ["stringsPerInverter","String / MPPT arrangement","","text"],
   ["mountingNotes","Mounting structure selection","","text"],
   ["batteriesNeeded","Storage required","","select","No;Yes;To be assessed"],
   ["backupLoadKw","Required backup load","kW","number"],
   ["batteryAutonomyHours","Backup duration","hours","number"],
   ["performanceAssumption","Annual generation / loss assumptions","","text"],
   ["complianceNotes","ALMM / BIS / DCR / DISCOM review notes","","text"]
  ]
 }
};