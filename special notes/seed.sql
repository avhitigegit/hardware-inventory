-- ============================================================
-- Hardware Inventory — Master Seed Script
-- ============================================================
-- WHAT THIS DOES (run order):
--   PART 1 : 36 hardware categories  (ON CONFLICT DO NOTHING)
--   PART 2 : 454 standard products   (ON CONFLICT DO NOTHING)
--   PART 3 : UAT demo data           (DO $$ block)
--             5 suppliers, 20 demo products, 6 customers,
--             7 GRN purchases, 12 sales, 4 stock adjustments,
--             2 customer payments, 2 supplier payments, 2 returns
--   PART 4 : Verify queries
--
-- SAFE TO RUN ON ANY DATABASE:
--   Parts 1 & 2 skip duplicates silently (ON CONFLICT DO NOTHING).
--   Part 3 (DO block) is UAT demo data — run only once on fresh DB.
--   users, audit_logs, and all other tables are NOT touched.
--
-- REQUIREMENT:
--   schema.sql must have been run first.
--   At least one ADMIN user (role=ADMIN, status=ACTIVE) must exist.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste → Run
-- ============================================================


-- ============================================================
-- PART 1 — 36 CATEGORIES
-- ============================================================

INSERT INTO categories (name, description) VALUES
  ('Fasteners & Fixings',
   'Nuts, bolts, screws, washers, anchor bolts, rawl plugs, rivets, nails, pins, and all threaded fasteners. The highest variety category in any hardware shop — available in dozens of sizes and materials including GI, stainless steel, and brass.'),
  ('Hand Tools',
   'Hammers, screwdrivers, spanners, pliers, wrenches, chisels, files, hacksaws, tape measures, spirit levels, mallets, tin snips, utility knives, and all non-powered hand tools used on site or in workshops.'),
  ('Power Tools',
   'Electric drills, angle grinders, circular saws, jigsaws, sanders, impact drivers, rotary hammers, heat guns, and cordless tool sets. Includes accessories such as drill bits, grinding discs, and saw blades.'),
  ('Electrical — Wiring & Cables',
   'PVC wiring cables, flexible cords, armoured cables, earth cables, telephone cables, CCTV cables, and speaker cables. Available in various core sizes including 1.5mm, 2.5mm, 4mm, and 6mm. Sold by metre or roll.'),
  ('Electrical — Switches, Sockets & Accessories',
   'Wall switches, socket outlets, 3-pin plugs, extension boards, junction boxes, conduit boxes, cable clips, cable ties, electrical tape, and all surface and concealed wiring accessories.'),
  ('Electrical — Circuit Protection (MCB / RCCB)',
   'Miniature Circuit Breakers (MCBs), RCCBs, distribution boards (DB boxes), fuse holders, fuse wire, surge protectors, and consumer unit components. High-demand category in construction and renovation projects.'),
  ('Lighting & Fixtures',
   'LED bulbs, tube lights, downlights, floodlights, street lights, batten fittings, panel lights, emergency lights, dimmer switches, and lamp holders. Growing category as LED replaces traditional fluorescent lighting.'),
  ('Pipes — PVC & uPVC',
   'PVC pressure pipes, uPVC drainage pipes, column pipes, conduit pipes, and related fittings including couplings, elbows, tees, reducers, and end caps. Sold by metre or in standard lengths. Very high volume in Sri Lanka construction.'),
  ('Pipes — GI & Steel',
   'Galvanized iron (GI) pipes, black iron pipes, square hollow sections, rectangular hollow sections, and round pipes used for structural framing, railings, and plumbing applications. Sold by length or cut to size.'),
  ('Plumbing Fittings — Brass & CP',
   'Brass gate valves, ball valves, check valves, globe valves, bib taps, pillar taps, wall mixers, shower heads, pipe unions, nipples, and bushings. Chrome plated (CP) items for visible and decorative plumbing fixtures.'),
  ('Sanitary Fittings & Accessories',
   'Wash basin traps, floor traps, toilet flush systems, concealed cisterns, bathroom accessories including towel rails, soap dishes and toilet paper holders, shower enclosure hardware, and waste outlet fittings.'),
  ('Structural Steel & Metal Products',
   'MS flat bars, angle iron, channel sections, I-beams, chequered plates, GI sheets, corrugated iron sheets, steel reinforcement bars (re-bars), and binding wire. Used in construction, fabrication, and welding works.'),
  ('Roofing Materials & Accessories',
   'GI corrugated sheets, Zincalume and Colorbond roofing sheets, ridge caps, J-hooks, roofing screws with rubber washers, roof gutters, downpipes, and rainwater collection fittings.'),
  ('Doors, Windows & Ironmongery',
   'Door hinges, door handles, door closers, floor springs, tower bolts, barrel bolts, door viewers (peepholes), window stays, casement fasteners, sliding door tracks, and all door and window frame hardware.'),
  ('Locks & Security Hardware',
   'Padlocks, mortice locks, cylinder rim locks, deadbolts, door chains, hasps and staples, cabinet locks, combination locks, and master key systems. High-demand in both residential and commercial applications.'),
  ('Paint & Surface Coatings',
   'Interior emulsion paints, exterior weather shield paints, enamel paints, primers, undercoats, varnishes, wood stains, anti-rust paints, epoxy floor coatings, and waterproofing compounds for roofs and walls.'),
  ('Paint Tools & Accessories',
   'Paint brushes, rollers, roller trays, masking tape, painter''s plastic sheets, paint strainers, putty knives, scraper tools, sandpaper sheets and rolls, and spray painting equipment and accessories.'),
  ('Cement, Concrete & Masonry',
   'Portland cement sold by bag, ready-mix concrete products, tile adhesive, tile grout, epoxy grout, cement admixtures, waterproofing compounds, and concrete bonding agents used in construction and tiling works.'),
  ('Adhesives, Sealants & Fillers',
   'Epoxy adhesives, contact cement (Dunlop-type), super glue, PVC solvent cement, silicone sealant, polyurethane sealant, acrylic sealant, wall filler and putty, expanding foam, and wood glue.'),
  ('Abrasives & Cutting Consumables',
   'Grinding discs, cutting discs, flap discs, wire cup brushes, emery cloth, sandpaper sheets and rolls, abrasive blocks, diamond cutting blades, and TCT saw blades. High-turnover consumable category.'),
  ('Ladders & Access Equipment',
   'Aluminium step ladders, extension ladders, platform stepladders, scaffold boards, trestle platforms, and construction safety barriers. Used by contractors, electricians, and painters working at height.'),
  ('Safety & PPE Equipment',
   'Safety helmets, safety boots, safety gloves, safety spectacles, dust masks, respirators, ear muffs, high-visibility vests, safety harnesses, face shields, and first aid kits for site and workshop use.'),
  ('Welding & Gas Equipment',
   'Welding electrodes (rods), MIG and TIG welding wire, welding helmets, welding gloves, gas pressure regulators, gas hoses, oxygen and acetylene fittings, electrode holders, and welding earth clamps.'),
  ('Pumps & Motors',
   'Submersible pumps, jet pumps, centrifugal pumps, booster pumps, sewage pumps, single and three phase electric motors, pressure tanks, pressure switches, and foot valves. Essential category in Sri Lanka due to water supply demands.'),
  ('Toolbox & Storage',
   'Tool boxes, tool bags and pouches, wall-mounted tool racks, steel storage cabinets, parts organizer trays, and stackable plastic bins for storing small hardware items and workshop consumables.'),
  ('Garden & Outdoor Hardware',
   'Garden hoses, hose connectors and fittings, sprinkler heads, hose reels, garden taps, drip irrigation fittings, wheelbarrows, garden hand tools, and outdoor post and fence fittings.'),
  ('Automotive Hardware',
   'Automotive bolts and fasteners, hose clamps, battery terminals and lugs, automotive electrical wire, cable lugs, heat shrink tubing, zip ties, workshop consumables, and vehicle maintenance hardware.'),
  ('Timber & Wood Products',
   'Treated timber planks, plywood sheets in various thicknesses (3mm to 18mm), MDF boards, hardboard, chipboard, timber mouldings, skirting boards, and wooden dowel rods for furniture and construction use.'),
  ('Insulation Materials',
   'Rock wool insulation rolls and slabs, glass wool, foam insulation sheets, pipe lagging, reflective foil insulation, and acoustic insulation boards used in walls, ceilings, roofs, and pipework.'),
  ('Fire Safety Equipment',
   'Fire extinguishers (CO2, dry powder, foam types), fire hose reels, smoke detectors, heat detectors, fire alarm control panels, fire blankets, sprinkler heads, and emergency exit signage.'),
  ('Bearings, Belts & Mechanical Parts',
   'Ball bearings, roller bearings, thrust bearings, V-belts, flat belts, timing belts, pulleys, sprockets, roller chains, and shaft couplings. Used by workshops, factories, and agricultural equipment repair shops.'),
  ('Magnets, Springs & Miscellaneous Hardware',
   'Compression springs, extension springs, torsion springs, rare earth and ferrite magnets, rubber door stops, rubber grommets, O-rings, nylon bushes, and assorted small workshop hardware items.'),
  ('CCTV & Security Systems',
   'IP cameras, AHD and HD cameras, DVRs, NVRs, CCTV coaxial cables (RG59), CAT6 network cables, 12V power supply units, BNC and DC connectors, and camera mounting brackets. A fast-growing market segment in Sri Lanka.'),
  ('Networking & Data Cabling',
   'CAT5e and CAT6 ethernet cables, RJ45 connectors and crimping tools, patch panels, wall sockets, cable management trays, conduit trunking, and network switches. Increasingly demanded in commercial and office construction.'),
  ('Batteries & Power Backup',
   'Dry cell batteries (AA, AAA, C, D sizes), lantern batteries, sealed lead acid batteries for UPS systems, rechargeable NiMH batteries, battery chargers, inverter batteries, and solar charge controllers.'),
  ('Others',
   'Miscellaneous hardware items that do not fall under any specific category. Use this category for unique or rarely stocked items until a more appropriate category is created.')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- PART 2 — 454 STANDARD PRODUCTS
-- ============================================================

INSERT INTO products (name, sku, unit, buying_price, selling_price, stock_quantity, reorder_level, category_id)
SELECT v.pname, v.sku, v.unit, v.bp::NUMERIC(12,2), v.sp::NUMERIC(12,2), 0::NUMERIC(10,3), v.rl::NUMERIC(10,3), c.id
FROM (VALUES
  ('Hex Bolt M6 x 30mm GI','FF-001','PCS','7.00','12.00','100','Fasteners & Fixings'),
  ('Hex Bolt M8 x 40mm GI','FF-002','PCS','10.00','18.00','100','Fasteners & Fixings'),
  ('Hex Bolt M10 x 50mm GI','FF-003','PCS','16.00','28.00','100','Fasteners & Fixings'),
  ('Hex Bolt M12 x 60mm GI','FF-004','PCS','24.00','40.00','50','Fasteners & Fixings'),
  ('Hex Nut M6 GI','FF-005','PCS','2.50','5.00','200','Fasteners & Fixings'),
  ('Hex Nut M8 GI','FF-006','PCS','3.50','6.00','200','Fasteners & Fixings'),
  ('Hex Nut M10 GI','FF-007','PCS','5.00','9.00','150','Fasteners & Fixings'),
  ('Flat Washer M6 GI','FF-008','PCS','1.50','3.00','200','Fasteners & Fixings'),
  ('Flat Washer M8 GI','FF-009','PCS','2.00','4.00','200','Fasteners & Fixings'),
  ('Spring Washer M8 GI','FF-010','PCS','2.00','4.00','150','Fasteners & Fixings'),
  ('Wood Screw 1.5 Inch Box 100','FF-011','BOX','280.00','420.00','20','Fasteners & Fixings'),
  ('Wood Screw 2 Inch Box 100','FF-012','BOX','320.00','480.00','20','Fasteners & Fixings'),
  ('Wood Screw 3 Inch Box 100','FF-013','BOX','380.00','560.00','20','Fasteners & Fixings'),
  ('Self Tapping Screw No8 x 1 Inch','FF-014','PCS','3.50','6.00','100','Fasteners & Fixings'),
  ('Rawl Plug 6mm Pack 100','FF-015','PACK','280.00','420.00','20','Fasteners & Fixings'),
  ('Rawl Plug 8mm Pack 100','FF-016','PACK','320.00','480.00','20','Fasteners & Fixings'),
  ('GI Wire Nail 2 Inch 1kg','FF-017','KG','145.00','220.00','50','Fasteners & Fixings'),
  ('GI Wire Nail 3 Inch 1kg','FF-018','KG','155.00','240.00','50','Fasteners & Fixings'),
  ('GI Wire Nail 4 Inch 1kg','FF-019','KG','165.00','260.00','50','Fasteners & Fixings'),
  ('Anchor Bolt M10 x 100mm','FF-020','PCS','68.00','110.00','50','Fasteners & Fixings'),
  ('Anchor Bolt M12 x 130mm','FF-021','PCS','95.00','150.00','50','Fasteners & Fixings'),
  ('Pop Rivet 3mm Box 100','FF-022','BOX','280.00','420.00','20','Fasteners & Fixings'),
  ('Pop Rivet 4mm Box 100','FF-023','BOX','320.00','480.00','20','Fasteners & Fixings'),
  ('Binding Wire 1kg Roll','FF-024','KG','220.00','340.00','30','Fasteners & Fixings'),
  ('Coach Bolt M8 x 60mm GI','FF-025','PCS','18.00','30.00','50','Fasteners & Fixings'),
  ('Claw Hammer 20oz Wooden Handle','HT-001','PCS','650.00','950.00','10','Hand Tools'),
  ('Ball Pein Hammer 1kg','HT-002','PCS','750.00','1100.00','10','Hand Tools'),
  ('Flathead Screwdriver 6 Inch','HT-003','PCS','180.00','280.00','10','Hand Tools'),
  ('Phillips Screwdriver No2','HT-004','PCS','180.00','280.00','10','Hand Tools'),
  ('Combination Spanner Set 8pcs','HT-005','SET','1800.00','2700.00','5','Hand Tools'),
  ('Adjustable Wrench 8 Inch','HT-006','PCS','750.00','1100.00','5','Hand Tools'),
  ('Long Nose Pliers 6 Inch','HT-007','PCS','380.00','580.00','10','Hand Tools'),
  ('Combination Pliers 8 Inch','HT-008','PCS','420.00','650.00','10','Hand Tools'),
  ('Pipe Wrench 14 Inch','HT-009','PCS','1100.00','1650.00','5','Hand Tools'),
  ('Hacksaw Frame Adjustable','HT-010','PCS','420.00','650.00','5','Hand Tools'),
  ('Hacksaw Blade Pack 10','HT-011','PACK','380.00','580.00','10','Hand Tools'),
  ('Steel Tape Measure 5m','HT-012','PCS','380.00','580.00','10','Hand Tools'),
  ('Spirit Level 600mm Aluminium','HT-013','PCS','850.00','1300.00','5','Hand Tools'),
  ('Cold Chisel 1 Inch','HT-014','PCS','180.00','280.00','10','Hand Tools'),
  ('Wood Chisel Set 4pcs','HT-015','SET','850.00','1300.00','5','Hand Tools'),
  ('Utility Knife Retractable','HT-016','PCS','180.00','280.00','10','Hand Tools'),
  ('Tin Snips 10 Inch Straight','HT-017','PCS','580.00','880.00','5','Hand Tools'),
  ('Try Square 6 Inch','HT-018','PCS','380.00','580.00','5','Hand Tools'),
  ('Centre Punch Steel','HT-019','PCS','120.00','200.00','10','Hand Tools'),
  ('Wire Stripper and Cutter 8 Inch','HT-020','PCS','480.00','720.00','5','Hand Tools'),
  ('Electric Drill 13mm 650W','PWT-001','PCS','5500.00','7800.00','3','Power Tools'),
  ('Rotary Hammer Drill 26mm 800W','PWT-002','PCS','12000.00','17000.00','2','Power Tools'),
  ('Angle Grinder 4 Inch 850W','PWT-003','PCS','4500.00','6500.00','3','Power Tools'),
  ('Angle Grinder 5 Inch 900W','PWT-004','PCS','5500.00','7800.00','3','Power Tools'),
  ('Circular Saw 7.5 Inch 1400W','PWT-005','PCS','11000.00','15500.00','2','Power Tools'),
  ('Jigsaw Variable Speed 650W','PWT-006','PCS','8500.00','12000.00','2','Power Tools'),
  ('Random Orbital Sander 230W','PWT-007','PCS','3800.00','5500.00','2','Power Tools'),
  ('Impact Driver 18V Cordless','PWT-008','PCS','14000.00','19500.00','2','Power Tools'),
  ('Cordless Drill 18V 2 Battery','PWT-009','PCS','13000.00','18500.00','2','Power Tools'),
  ('Heat Gun 2000W Variable','PWT-010','PCS','3800.00','5500.00','2','Power Tools'),
  ('Bench Grinder 6 Inch 350W','PWT-011','PCS','6500.00','9200.00','2','Power Tools'),
  ('Electric Planer 580W','PWT-012','PCS','7500.00','10500.00','2','Power Tools'),
  ('Air Compressor 24L 1.5HP','PWT-013','PCS','18000.00','25000.00','1','Power Tools'),
  ('Drill Bit Set HSS 13pcs','PWT-014','SET','1200.00','1800.00','5','Power Tools'),
  ('Masonry Drill Bit Set 5pcs','PWT-015','SET','850.00','1300.00','5','Power Tools'),
  ('PVC Wire 1.5mm Single Core 100m Red','EWC-001','ROLL','6500.00','9200.00','5','Electrical — Wiring & Cables'),
  ('PVC Wire 1.5mm Single Core 100m Black','EWC-002','ROLL','6500.00','9200.00','5','Electrical — Wiring & Cables'),
  ('PVC Wire 2.5mm Single Core 100m Red','EWC-003','ROLL','9800.00','13800.00','5','Electrical — Wiring & Cables'),
  ('PVC Wire 2.5mm Single Core 100m Black','EWC-004','ROLL','9800.00','13800.00','5','Electrical — Wiring & Cables'),
  ('PVC Wire 4mm Single Core 100m Red','EWC-005','ROLL','15500.00','21500.00','3','Electrical — Wiring & Cables'),
  ('PVC Wire 6mm Single Core 50m Red','EWC-006','ROLL','12000.00','17000.00','3','Electrical — Wiring & Cables'),
  ('Flexible Cord 2 Core 1.5mm 100m','EWC-007','ROLL','8500.00','12000.00','3','Electrical — Wiring & Cables'),
  ('Flexible Cord 3 Core 1.5mm 100m','EWC-008','ROLL','10500.00','14800.00','3','Electrical — Wiring & Cables'),
  ('Flat Twin 1.5mm 2+E 100m Roll','EWC-009','ROLL','11500.00','16000.00','3','Electrical — Wiring & Cables'),
  ('Flat Twin 2.5mm 2+E 100m Roll','EWC-010','ROLL','16500.00','23000.00','3','Electrical — Wiring & Cables'),
  ('Armoured Cable 2.5mm 2 Core per Metre','EWC-011','MTR','180.00','260.00','20','Electrical — Wiring & Cables'),
  ('CAT6 UTP Cable 305m Box','EWC-012','BOX','18000.00','25000.00','3','Electrical — Wiring & Cables'),
  ('CCTV RG59 Coaxial Cable 100m','EWC-013','ROLL','5500.00','7800.00','5','Electrical — Wiring & Cables'),
  ('Earth Cable 6mm Green 100m Roll','EWC-014','ROLL','15500.00','21500.00','3','Electrical — Wiring & Cables'),
  ('Extension Cord 3m 3 Pin 13A','EWC-015','PCS','580.00','880.00','10','Electrical — Wiring & Cables'),
  ('Single Switch 1 Gang 10A White','ESS-001','PCS','185.00','280.00','20','Electrical — Switches, Sockets & Accessories'),
  ('Double Switch 2 Gang 10A White','ESS-002','PCS','280.00','420.00','20','Electrical — Switches, Sockets & Accessories'),
  ('Single Socket Outlet 13A White','ESS-003','PCS','220.00','340.00','20','Electrical — Switches, Sockets & Accessories'),
  ('Double Socket Outlet 13A White','ESS-004','PCS','380.00','580.00','20','Electrical — Switches, Sockets & Accessories'),
  ('3 Pin Plug 13A Rubber','ESS-005','PCS','85.00','140.00','30','Electrical — Switches, Sockets & Accessories'),
  ('Junction Box 60mm Round Plastic','ESS-006','PCS','45.00','75.00','30','Electrical — Switches, Sockets & Accessories'),
  ('Junction Box 100x100mm Square','ESS-007','PCS','85.00','135.00','20','Electrical — Switches, Sockets & Accessories'),
  ('PVC Conduit Pipe 20mm 3m','ESS-008','PCS','95.00','150.00','30','Electrical — Switches, Sockets & Accessories'),
  ('PVC Conduit Pipe 25mm 3m','ESS-009','PCS','120.00','185.00','20','Electrical — Switches, Sockets & Accessories'),
  ('Conduit Elbow 20mm 90 Degree','ESS-010','PCS','25.00','42.00','30','Electrical — Switches, Sockets & Accessories'),
  ('Cable Clip 14mm Pack 100','ESS-011','PACK','180.00','280.00','20','Electrical — Switches, Sockets & Accessories'),
  ('Cable Tie 200mm Pack 100','ESS-012','PACK','220.00','340.00','20','Electrical — Switches, Sockets & Accessories'),
  ('Electrical Insulation Tape Black 19mm','ESS-013','PCS','65.00','110.00','30','Electrical — Switches, Sockets & Accessories'),
  ('Distribution Board 6 Way Flush','ESS-014','PCS','1800.00','2600.00','5','Electrical — Switches, Sockets & Accessories'),
  ('Consumer Unit 12 Way Metal','ESS-015','PCS','4500.00','6500.00','3','Electrical — Switches, Sockets & Accessories'),
  ('MCB Single Pole 6A 10kA','ECP-001','PCS','380.00','560.00','10','Electrical — Circuit Protection (MCB / RCCB)'),
  ('MCB Single Pole 10A 10kA','ECP-002','PCS','380.00','560.00','10','Electrical — Circuit Protection (MCB / RCCB)'),
  ('MCB Single Pole 16A 10kA','ECP-003','PCS','420.00','620.00','10','Electrical — Circuit Protection (MCB / RCCB)'),
  ('MCB Single Pole 20A 10kA','ECP-004','PCS','420.00','620.00','10','Electrical — Circuit Protection (MCB / RCCB)'),
  ('MCB Single Pole 32A 10kA','ECP-005','PCS','480.00','720.00','10','Electrical — Circuit Protection (MCB / RCCB)'),
  ('MCB Double Pole 32A 10kA','ECP-006','PCS','1200.00','1750.00','5','Electrical — Circuit Protection (MCB / RCCB)'),
  ('MCB Double Pole 63A 10kA','ECP-007','PCS','1800.00','2600.00','5','Electrical — Circuit Protection (MCB / RCCB)'),
  ('RCCB 2 Pole 25A 30mA','ECP-008','PCS','1800.00','2600.00','5','Electrical — Circuit Protection (MCB / RCCB)'),
  ('RCCB 2 Pole 40A 30mA','ECP-009','PCS','2200.00','3200.00','5','Electrical — Circuit Protection (MCB / RCCB)'),
  ('RCCB 4 Pole 63A 30mA','ECP-010','PCS','5500.00','7800.00','3','Electrical — Circuit Protection (MCB / RCCB)'),
  ('Fuse Holder Rewireable 30A','ECP-011','PCS','120.00','190.00','10','Electrical — Circuit Protection (MCB / RCCB)'),
  ('Surge Protector 4 Way 2m Cord','ECP-012','PCS','850.00','1300.00','5','Electrical — Circuit Protection (MCB / RCCB)'),
  ('LED Bulb 7W E27 Warm White','LF-001','PCS','185.00','280.00','20','Lighting & Fixtures'),
  ('LED Bulb 12W E27 Daylight','LF-002','PCS','280.00','420.00','20','Lighting & Fixtures'),
  ('LED Bulb 15W E27 Daylight','LF-003','PCS','350.00','520.00','15','Lighting & Fixtures'),
  ('LED Tube 18W 4ft Daylight','LF-004','PCS','380.00','580.00','15','Lighting & Fixtures'),
  ('LED Tube 36W 5ft Daylight','LF-005','PCS','480.00','720.00','10','Lighting & Fixtures'),
  ('LED Downlight 10W Round Recessed','LF-006','PCS','480.00','720.00','10','Lighting & Fixtures'),
  ('LED Flood Light 20W Outdoor','LF-007','PCS','1200.00','1800.00','5','Lighting & Fixtures'),
  ('LED Flood Light 50W Outdoor','LF-008','PCS','2500.00','3600.00','5','Lighting & Fixtures'),
  ('LED Flood Light 100W Outdoor','LF-009','PCS','4500.00','6500.00','3','Lighting & Fixtures'),
  ('LED Panel Light 18W Square','LF-010','PCS','1200.00','1800.00','5','Lighting & Fixtures'),
  ('Batten Fitting 2ft Single','LF-011','PCS','580.00','880.00','10','Lighting & Fixtures'),
  ('Batten Fitting 4ft Twin','LF-012','PCS','950.00','1400.00','5','Lighting & Fixtures'),
  ('Emergency Light 2 Head 6W','LF-013','PCS','1800.00','2600.00','5','Lighting & Fixtures'),
  ('Lamp Holder E27 Plastic','LF-014','PCS','65.00','110.00','20','Lighting & Fixtures'),
  ('Lamp Holder B22 Porcelain','LF-015','PCS','85.00','140.00','20','Lighting & Fixtures'),
  ('PVC Pressure Pipe 0.5 Inch PN10 per Metre','PVC-001','MTR','78.00','120.00','50','Pipes — PVC & uPVC'),
  ('PVC Pressure Pipe 0.75 Inch PN10 per Metre','PVC-002','MTR','115.00','175.00','50','Pipes — PVC & uPVC'),
  ('PVC Pressure Pipe 1 Inch PN10 per Metre','PVC-003','MTR','160.00','245.00','30','Pipes — PVC & uPVC'),
  ('PVC Pressure Pipe 1.5 Inch PN10 per Metre','PVC-004','MTR','265.00','400.00','20','Pipes — PVC & uPVC'),
  ('PVC Pressure Pipe 2 Inch PN10 per Metre','PVC-005','MTR','420.00','630.00','20','Pipes — PVC & uPVC'),
  ('uPVC Drainage Pipe 3 Inch per Metre','PVC-006','MTR','280.00','420.00','20','Pipes — PVC & uPVC'),
  ('uPVC Drainage Pipe 4 Inch per Metre','PVC-007','MTR','480.00','720.00','20','Pipes — PVC & uPVC'),
  ('PVC Elbow 0.5 Inch 90 Degree','PVC-008','PCS','22.00','38.00','50','Pipes — PVC & uPVC'),
  ('PVC Elbow 1 Inch 90 Degree','PVC-009','PCS','55.00','88.00','30','Pipes — PVC & uPVC'),
  ('PVC Tee 0.5 Inch','PVC-010','PCS','28.00','45.00','50','Pipes — PVC & uPVC'),
  ('PVC Tee 1 Inch','PVC-011','PCS','68.00','110.00','30','Pipes — PVC & uPVC'),
  ('PVC Coupling 0.5 Inch','PVC-012','PCS','18.00','30.00','50','Pipes — PVC & uPVC'),
  ('PVC Coupling 1 Inch','PVC-013','PCS','42.00','68.00','30','Pipes — PVC & uPVC'),
  ('PVC Reducer 1 Inch to 0.5 Inch','PVC-014','PCS','32.00','52.00','20','Pipes — PVC & uPVC'),
  ('PVC End Cap 0.5 Inch','PVC-015','PCS','18.00','30.00','30','Pipes — PVC & uPVC'),
  ('PVC End Cap 1 Inch','PVC-016','PCS','35.00','58.00','20','Pipes — PVC & uPVC'),
  ('PVC Solvent Cement 250ml','PVC-017','PCS','180.00','280.00','20','Pipes — PVC & uPVC'),
  ('PVC Float Ball 0.5 Inch','PVC-018','PCS','95.00','150.00','20','Pipes — PVC & uPVC'),
  ('GI Pipe 0.5 Inch per Metre','PGS-001','MTR','280.00','420.00','20','Pipes — GI & Steel'),
  ('GI Pipe 0.75 Inch per Metre','PGS-002','MTR','380.00','580.00','20','Pipes — GI & Steel'),
  ('GI Pipe 1 Inch per Metre','PGS-003','MTR','520.00','780.00','20','Pipes — GI & Steel'),
  ('GI Pipe 1.5 Inch per Metre','PGS-004','MTR','820.00','1200.00','10','Pipes — GI & Steel'),
  ('GI Pipe 2 Inch per Metre','PGS-005','MTR','1200.00','1800.00','10','Pipes — GI & Steel'),
  ('Square Hollow Section 25x25mm per Metre','PGS-006','MTR','320.00','480.00','20','Pipes — GI & Steel'),
  ('Square Hollow Section 40x40mm per Metre','PGS-007','MTR','580.00','880.00','10','Pipes — GI & Steel'),
  ('Rectangular Section 40x20mm per Metre','PGS-008','MTR','380.00','580.00','10','Pipes — GI & Steel'),
  ('Angle Iron 25x25x3mm per Metre','PGS-009','MTR','280.00','420.00','20','Pipes — GI & Steel'),
  ('Angle Iron 50x50x5mm per Metre','PGS-010','MTR','680.00','1020.00','10','Pipes — GI & Steel'),
  ('MS Flat Bar 25x6mm per Metre','PGS-011','MTR','180.00','280.00','20','Pipes — GI & Steel'),
  ('MS Round Bar 10mm per Metre','PGS-012','MTR','220.00','340.00','20','Pipes — GI & Steel'),
  ('Brass Ball Valve 0.5 Inch','PLB-001','PCS','385.00','580.00','10','Plumbing Fittings — Brass & CP'),
  ('Brass Ball Valve 0.75 Inch','PLB-002','PCS','520.00','780.00','10','Plumbing Fittings — Brass & CP'),
  ('Brass Ball Valve 1 Inch','PLB-003','PCS','780.00','1180.00','5','Plumbing Fittings — Brass & CP'),
  ('Brass Gate Valve 0.5 Inch','PLB-004','PCS','420.00','650.00','10','Plumbing Fittings — Brass & CP'),
  ('Brass Gate Valve 0.75 Inch','PLB-005','PCS','580.00','880.00','10','Plumbing Fittings — Brass & CP'),
  ('Brass Check Valve 0.5 Inch','PLB-006','PCS','380.00','580.00','5','Plumbing Fittings — Brass & CP'),
  ('Brass Bib Tap 0.5 Inch','PLB-007','PCS','580.00','880.00','10','Plumbing Fittings — Brass & CP'),
  ('CP Pillar Tap 0.5 Inch Pair','PLB-008','PAIR','1800.00','2700.00','5','Plumbing Fittings — Brass & CP'),
  ('CP Single Lever Wall Mixer','PLB-009','PCS','4500.00','6500.00','3','Plumbing Fittings — Brass & CP'),
  ('CP Overhead Shower Set 8 Inch','PLB-010','SET','2800.00','4200.00','3','Plumbing Fittings — Brass & CP'),
  ('Brass Pipe Union 0.5 Inch','PLB-011','PCS','280.00','420.00','10','Plumbing Fittings — Brass & CP'),
  ('Brass Pipe Union 0.75 Inch','PLB-012','PCS','380.00','580.00','10','Plumbing Fittings — Brass & CP'),
  ('GI Nipple 0.5 Inch 50mm','PLB-013','PCS','85.00','140.00','20','Plumbing Fittings — Brass & CP'),
  ('GI Nipple 0.75 Inch 50mm','PLB-014','PCS','115.00','185.00','20','Plumbing Fittings — Brass & CP'),
  ('Brass Reducing Bush 0.75 x 0.5 Inch','PLB-015','PCS','85.00','140.00','10','Plumbing Fittings — Brass & CP'),
  ('Brass Float Valve 0.5 Inch','PLB-016','PCS','380.00','580.00','10','Plumbing Fittings — Brass & CP'),
  ('Brass Float Valve 0.75 Inch','PLB-017','PCS','480.00','720.00','10','Plumbing Fittings — Brass & CP'),
  ('Pressure Reducing Valve 0.5 Inch','PLB-018','PCS','1200.00','1800.00','5','Plumbing Fittings — Brass & CP'),
  ('Flexible Hose 12 Inch Pair','PLB-019','PAIR','380.00','580.00','10','Plumbing Fittings — Brass & CP'),
  ('Compression Elbow 15mm Brass','PLB-020','PCS','185.00','280.00','10','Plumbing Fittings — Brass & CP'),
  ('Wash Basin Trap 32mm Chrome P-Type','SAN-001','PCS','380.00','580.00','5','Sanitary Fittings & Accessories'),
  ('Floor Trap 100x100mm Stainless Steel','SAN-002','PCS','580.00','880.00','5','Sanitary Fittings & Accessories'),
  ('Toilet Flush Valve Bottom Entry','SAN-003','PCS','480.00','720.00','5','Sanitary Fittings & Accessories'),
  ('Concealed Cistern Dual Flush','SAN-004','PCS','5500.00','7800.00','2','Sanitary Fittings & Accessories'),
  ('Towel Rail 600mm Chrome','SAN-005','PCS','850.00','1300.00','3','Sanitary Fittings & Accessories'),
  ('Soap Dish Wall Mount Chrome','SAN-006','PCS','480.00','720.00','3','Sanitary Fittings & Accessories'),
  ('Toilet Paper Holder Chrome','SAN-007','PCS','480.00','720.00','3','Sanitary Fittings & Accessories'),
  ('Towel Ring Chrome','SAN-008','PCS','380.00','580.00','3','Sanitary Fittings & Accessories'),
  ('Fixed Shower Head Chrome 4 Inch','SAN-009','PCS','580.00','880.00','5','Sanitary Fittings & Accessories'),
  ('Flexible Shower Hose 1.5m Chrome','SAN-010','PCS','380.00','580.00','5','Sanitary Fittings & Accessories'),
  ('Pop-Up Waste 32mm Chrome','SAN-011','PCS','380.00','580.00','5','Sanitary Fittings & Accessories'),
  ('Basket Waste Outlet 40mm Chrome','SAN-012','PCS','280.00','420.00','5','Sanitary Fittings & Accessories'),
  ('Bath Drain 40mm with Overflow Chrome','SAN-013','PCS','480.00','720.00','3','Sanitary Fittings & Accessories'),
  ('Urinal Flush Valve 0.5 Inch','SAN-014','PCS','850.00','1300.00','3','Sanitary Fittings & Accessories'),
  ('Sink Overflow Pipe 22mm per Metre','SAN-015','MTR','85.00','140.00','10','Sanitary Fittings & Accessories'),
  ('MS Angle Iron 40x40x4mm 6m Bar','STL-001','PCS','2200.00','3200.00','5','Structural Steel & Metal Products'),
  ('MS Angle Iron 50x50x5mm 6m Bar','STL-002','PCS','3200.00','4600.00','5','Structural Steel & Metal Products'),
  ('MS Channel 75x40mm 6m Bar','STL-003','PCS','5500.00','7800.00','3','Structural Steel & Metal Products'),
  ('MS Flat Bar 50x5mm 6m','STL-004','PCS','1800.00','2600.00','5','Structural Steel & Metal Products'),
  ('GI Corrugated Sheet 8ft 26G','STL-005','PCS','2800.00','4000.00','5','Structural Steel & Metal Products'),
  ('GI Corrugated Sheet 10ft 26G','STL-006','PCS','3500.00','5000.00','5','Structural Steel & Metal Products'),
  ('GI Plain Sheet 4x8ft 26G','STL-007','PCS','4200.00','6000.00','3','Structural Steel & Metal Products'),
  ('Chequered Plate 4x8ft 6mm','STL-008','PCS','28000.00','39000.00','2','Structural Steel & Metal Products'),
  ('Steel Re-bar 10mm 12m','STL-009','PCS','1800.00','2600.00','10','Structural Steel & Metal Products'),
  ('Steel Re-bar 12mm 12m','STL-010','PCS','2600.00','3700.00','10','Structural Steel & Metal Products'),
  ('Steel Re-bar 16mm 12m','STL-011','PCS','4600.00','6500.00','5','Structural Steel & Metal Products'),
  ('Expanded Metal Sheet 4x8ft 2mm','STL-012','PCS','4800.00','6800.00','3','Structural Steel & Metal Products'),
  ('Zincalume Roof Sheet 0.47mm per Metre','RFG-001','MTR','680.00','980.00','20','Roofing Materials & Accessories'),
  ('GI Corrugated Roof Sheet 8ft 28G','RFG-002','PCS','2600.00','3700.00','5','Roofing Materials & Accessories'),
  ('GI Ridge Cap 8ft','RFG-003','PCS','1200.00','1750.00','5','Roofing Materials & Accessories'),
  ('J-Hook 150mm GI Pack 10','RFG-004','PACK','580.00','880.00','10','Roofing Materials & Accessories'),
  ('Roofing Screw 50mm with Washer Box 100','RFG-005','BOX','580.00','880.00','10','Roofing Materials & Accessories'),
  ('GI Gutter 4 Inch 3m','RFG-006','PCS','1200.00','1750.00','5','Roofing Materials & Accessories'),
  ('GI Round Downpipe 3 Inch 3m','RFG-007','PCS','850.00','1300.00','5','Roofing Materials & Accessories'),
  ('Gutter Bracket Adjustable GI','RFG-008','PCS','85.00','140.00','20','Roofing Materials & Accessories'),
  ('Polycarbonate Sheet Clear 8ft 4mm','RFG-009','PCS','3500.00','5000.00','3','Roofing Materials & Accessories'),
  ('Bitumen Waterproofing Membrane 4mm','RFG-010','M2','380.00','580.00','10','Roofing Materials & Accessories'),
  ('Door Hinge 3 Inch SS 304 Pair','DWI-001','PAIR','280.00','420.00','10','Doors, Windows & Ironmongery'),
  ('Door Hinge 4 Inch SS 304 Pair','DWI-002','PAIR','380.00','580.00','10','Doors, Windows & Ironmongery'),
  ('Door Hinge 4 Inch Heavy Duty Pair','DWI-003','PAIR','580.00','880.00','5','Doors, Windows & Ironmongery'),
  ('Lever Handle Mortice Set SS','DWI-004','SET','1200.00','1800.00','5','Doors, Windows & Ironmongery'),
  ('Round Door Knob Set SS','DWI-005','SET','850.00','1300.00','5','Doors, Windows & Ironmongery'),
  ('Door Closer Heavy Duty Silver','DWI-006','PCS','2800.00','4000.00','3','Doors, Windows & Ironmongery'),
  ('Floor Spring Heavy Duty','DWI-007','PCS','5500.00','7800.00','2','Doors, Windows & Ironmongery'),
  ('Tower Bolt 4 Inch SS','DWI-008','PCS','180.00','280.00','10','Doors, Windows & Ironmongery'),
  ('Tower Bolt 6 Inch SS','DWI-009','PCS','220.00','340.00','10','Doors, Windows & Ironmongery'),
  ('Barrel Bolt 4 Inch Galvanised','DWI-010','PCS','120.00','190.00','10','Doors, Windows & Ironmongery'),
  ('Door Viewer Peephole Wide Angle','DWI-011','PCS','180.00','280.00','10','Doors, Windows & Ironmongery'),
  ('Window Stay 8 Inch SS','DWI-012','PCS','280.00','420.00','10','Doors, Windows & Ironmongery'),
  ('Casement Window Fastener SS','DWI-013','PCS','180.00','280.00','10','Doors, Windows & Ironmongery'),
  ('Sliding Door Track Set 1.8m','DWI-014','SET','2200.00','3200.00','3','Doors, Windows & Ironmongery'),
  ('Floor Door Stopper SS','DWI-015','PCS','120.00','190.00','10','Doors, Windows & Ironmongery'),
  ('Pull Handle 300mm SS','DWI-016','PCS','580.00','880.00','5','Doors, Windows & Ironmongery'),
  ('Security Door Chain SS','DWI-017','PCS','280.00','420.00','10','Doors, Windows & Ironmongery'),
  ('Aluminium Door Threshold 900mm','DWI-018','PCS','380.00','580.00','5','Doors, Windows & Ironmongery'),
  ('Padlock 40mm Brass Body','LCK-001','PCS','380.00','580.00','10','Locks & Security Hardware'),
  ('Padlock 50mm Hardened Steel','LCK-002','PCS','580.00','880.00','10','Locks & Security Hardware'),
  ('Padlock 60mm Heavy Duty','LCK-003','PCS','850.00','1300.00','5','Locks & Security Hardware'),
  ('Padlock 20mm Mini Brass','LCK-004','PCS','180.00','280.00','10','Locks & Security Hardware'),
  ('Mortice Lock 3 Lever 63mm','LCK-005','PCS','850.00','1300.00','5','Locks & Security Hardware'),
  ('Mortice Lock 5 Lever 63mm','LCK-006','PCS','1500.00','2300.00','5','Locks & Security Hardware'),
  ('Cylinder Rim Lock Aluminium','LCK-007','PCS','850.00','1300.00','5','Locks & Security Hardware'),
  ('Yale Style Rim Nightlatch','LCK-008','PCS','1800.00','2600.00','3','Locks & Security Hardware'),
  ('Digital Keypad Door Lock','LCK-009','PCS','8500.00','12000.00','2','Locks & Security Hardware'),
  ('Hasp and Staple 4 Inch SS','LCK-010','PCS','220.00','340.00','10','Locks & Security Hardware'),
  ('Deadbolt Lock Single Cylinder','LCK-011','PCS','1200.00','1800.00','5','Locks & Security Hardware'),
  ('Door Chain Brass','LCK-012','PCS','280.00','420.00','10','Locks & Security Hardware'),
  ('Cabinet Lock 20mm Cam','LCK-013','PCS','180.00','280.00','10','Locks & Security Hardware'),
  ('Combination Padlock 40mm 4 Digit','LCK-014','PCS','480.00','720.00','5','Locks & Security Hardware'),
  ('Disc Padlock 50mm Anti-Shim','LCK-015','PCS','850.00','1300.00','5','Locks & Security Hardware'),
  ('Interior Emulsion Paint White 1L','PNT-001','L','550.00','850.00','10','Paint & Surface Coatings'),
  ('Interior Emulsion Paint White 4L','PNT-002','PCS','1650.00','2500.00','10','Paint & Surface Coatings'),
  ('Interior Emulsion Paint White 20L','PNT-003','PCS','7800.00','11500.00','5','Paint & Surface Coatings'),
  ('Exterior Weather Shield White 4L','PNT-004','PCS','2200.00','3300.00','5','Paint & Surface Coatings'),
  ('Exterior Weather Shield White 20L','PNT-005','PCS','10500.00','15000.00','3','Paint & Surface Coatings'),
  ('Enamel Paint White 1L','PNT-006','L','850.00','1300.00','10','Paint & Surface Coatings'),
  ('Enamel Paint White 4L','PNT-007','PCS','3200.00','4700.00','5','Paint & Surface Coatings'),
  ('Red Oxide Primer 1L','PNT-008','L','580.00','880.00','10','Paint & Surface Coatings'),
  ('Red Oxide Primer 4L','PNT-009','PCS','1800.00','2700.00','5','Paint & Surface Coatings'),
  ('Anti-Rust Paint Black 1L','PNT-010','L','750.00','1150.00','5','Paint & Surface Coatings'),
  ('Wood Varnish Clear Gloss 1L','PNT-011','L','850.00','1300.00','5','Paint & Surface Coatings'),
  ('Floor Paint Grey 4L','PNT-012','PCS','2800.00','4200.00','3','Paint & Surface Coatings'),
  ('Waterproofing Compound 4kg','PNT-013','PCS','1800.00','2700.00','5','Paint & Surface Coatings'),
  ('Bitumen Waterproof Paint 4L','PNT-014','PCS','1500.00','2200.00','5','Paint & Surface Coatings'),
  ('Wall Putty White 5kg','PNT-015','PCS','750.00','1150.00','10','Paint & Surface Coatings'),
  ('Paint Brush 2 Inch Natural Bristle','PTA-001','PCS','120.00','190.00','10','Paint Tools & Accessories'),
  ('Paint Brush 4 Inch Natural Bristle','PTA-002','PCS','180.00','280.00','10','Paint Tools & Accessories'),
  ('Paint Roller 9 Inch with Frame','PTA-003','PCS','280.00','420.00','10','Paint Tools & Accessories'),
  ('Paint Roller Tray 9 Inch Plastic','PTA-004','PCS','180.00','280.00','10','Paint Tools & Accessories'),
  ('Masking Tape 25mm x 50m','PTA-005','ROLL','120.00','190.00','20','Paint Tools & Accessories'),
  ('Painters Plastic Drop Sheet 4x5m','PTA-006','PCS','180.00','280.00','10','Paint Tools & Accessories'),
  ('Putty Knife 4 Inch Flexible','PTA-007','PCS','180.00','280.00','5','Paint Tools & Accessories'),
  ('Paint Scraper 4 Inch Rigid','PTA-008','PCS','180.00','280.00','5','Paint Tools & Accessories'),
  ('Sandpaper Sheet P120 Pack 10','PTA-009','PACK','220.00','340.00','10','Paint Tools & Accessories'),
  ('Paint Stirrer Wooden Pack 10','PTA-010','PACK','85.00','140.00','10','Paint Tools & Accessories'),
  ('Portland Cement 50kg Bag','CCM-001','BAG','1650.00','1900.00','20','Cement, Concrete & Masonry'),
  ('White Cement 1kg','CCM-002','KG','95.00','150.00','20','Cement, Concrete & Masonry'),
  ('Tile Adhesive Grey 20kg Bag','CCM-003','BAG','1200.00','1750.00','10','Cement, Concrete & Masonry'),
  ('Tile Grout Grey 1kg','CCM-004','KG','180.00','280.00','20','Cement, Concrete & Masonry'),
  ('Tile Grout White 1kg','CCM-005','KG','180.00','280.00','20','Cement, Concrete & Masonry'),
  ('Epoxy Tile Grout 1kg','CCM-006','KG','850.00','1300.00','10','Cement, Concrete & Masonry'),
  ('Waterproofing Admixture 1L','CCM-007','L','380.00','580.00','10','Cement, Concrete & Masonry'),
  ('Concrete Bonding Agent 1L','CCM-008','L','480.00','720.00','10','Cement, Concrete & Masonry'),
  ('Ready Mix Plaster 20kg Bag','CCM-009','BAG','850.00','1300.00','10','Cement, Concrete & Masonry'),
  ('Concrete Repair Mortar 5kg','CCM-010','KG','550.00','850.00','5','Cement, Concrete & Masonry'),
  ('Epoxy Adhesive 2-Part 50ml','ADH-001','PCS','280.00','420.00','10','Adhesives, Sealants & Fillers'),
  ('Contact Cement 250ml','ADH-002','PCS','280.00','420.00','10','Adhesives, Sealants & Fillers'),
  ('Contact Cement 1L','ADH-003','L','850.00','1300.00','5','Adhesives, Sealants & Fillers'),
  ('Super Glue Gel 20g','ADH-004','PCS','85.00','140.00','20','Adhesives, Sealants & Fillers'),
  ('PVC Solvent Cement 250ml','ADH-005','PCS','180.00','280.00','10','Adhesives, Sealants & Fillers'),
  ('Silicone Sealant Clear 280ml','ADH-006','PCS','380.00','580.00','10','Adhesives, Sealants & Fillers'),
  ('Silicone Sealant White 280ml','ADH-007','PCS','380.00','580.00','10','Adhesives, Sealants & Fillers'),
  ('Silicone Sealant Black 280ml','ADH-008','PCS','380.00','580.00','10','Adhesives, Sealants & Fillers'),
  ('Polyurethane Sealant Grey 600ml','ADH-009','PCS','650.00','980.00','5','Adhesives, Sealants & Fillers'),
  ('Acrylic Sealant White 280ml','ADH-010','PCS','220.00','340.00','10','Adhesives, Sealants & Fillers'),
  ('Expanding Foam 750ml','ADH-011','PCS','850.00','1300.00','5','Adhesives, Sealants & Fillers'),
  ('Wood Glue PVA 500ml','ADH-012','PCS','280.00','420.00','10','Adhesives, Sealants & Fillers'),
  ('Grinding Disc 4 Inch 6mm Box 25','ABR-001','BOX','850.00','1300.00','5','Abrasives & Cutting Consumables'),
  ('Grinding Disc 5 Inch 6mm Box 25','ABR-002','BOX','1050.00','1600.00','5','Abrasives & Cutting Consumables'),
  ('Cutting Disc 4 Inch 1mm Box 25','ABR-003','BOX','750.00','1150.00','5','Abrasives & Cutting Consumables'),
  ('Cutting Disc 5 Inch 1mm Box 25','ABR-004','BOX','950.00','1450.00','5','Abrasives & Cutting Consumables'),
  ('Flap Disc 4 Inch 40 Grit Box 10','ABR-005','BOX','850.00','1300.00','5','Abrasives & Cutting Consumables'),
  ('Flap Disc 4 Inch 80 Grit Box 10','ABR-006','BOX','850.00','1300.00','5','Abrasives & Cutting Consumables'),
  ('Wire Cup Brush 4 Inch Angle Grinder','ABR-007','PCS','380.00','580.00','5','Abrasives & Cutting Consumables'),
  ('Emery Cloth P80 Roll 50m','ABR-008','ROLL','850.00','1300.00','3','Abrasives & Cutting Consumables'),
  ('Sandpaper Sheet P60 Pack 10','ABR-009','PACK','220.00','340.00','10','Abrasives & Cutting Consumables'),
  ('Sandpaper Sheet P120 Pack 10','ABR-010','PACK','220.00','340.00','10','Abrasives & Cutting Consumables'),
  ('Sandpaper Sheet P240 Pack 10','ABR-011','PACK','220.00','340.00','10','Abrasives & Cutting Consumables'),
  ('Diamond Cutting Blade 4 Inch Dry','ABR-012','PCS','580.00','880.00','5','Abrasives & Cutting Consumables'),
  ('Diamond Cutting Blade 7 Inch Dry','ABR-013','PCS','1200.00','1800.00','3','Abrasives & Cutting Consumables'),
  ('TCT Circular Saw Blade 7.5 Inch 60T','ABR-014','PCS','1500.00','2200.00','3','Abrasives & Cutting Consumables'),
  ('Hacksaw Blade 300mm Bi-Metal Pack 10','ABR-015','PACK','380.00','580.00','10','Abrasives & Cutting Consumables'),
  ('Aluminium Step Ladder 4 Step','LAD-001','PCS','4500.00','6500.00','2','Ladders & Access Equipment'),
  ('Aluminium Step Ladder 6 Step','LAD-002','PCS','6500.00','9200.00','2','Ladders & Access Equipment'),
  ('Aluminium Step Ladder 8 Step','LAD-003','PCS','8500.00','12000.00','2','Ladders & Access Equipment'),
  ('Aluminium Extension Ladder 16ft','LAD-004','PCS','11000.00','15500.00','1','Ladders & Access Equipment'),
  ('Aluminium Extension Ladder 20ft','LAD-005','PCS','15000.00','21000.00','1','Ladders & Access Equipment'),
  ('Platform Step Ladder 3 Step','LAD-006','PCS','5500.00','7800.00','2','Ladders & Access Equipment'),
  ('Scaffold Plank 3m Aluminium','LAD-007','PCS','4500.00','6500.00','2','Ladders & Access Equipment'),
  ('Safety Barrier 2m Expandable','LAD-008','PCS','2800.00','4000.00','2','Ladders & Access Equipment'),
  ('Safety Helmet White HDPE','PPE-001','PCS','380.00','580.00','10','Safety & PPE Equipment'),
  ('Safety Helmet Yellow HDPE','PPE-002','PCS','380.00','580.00','10','Safety & PPE Equipment'),
  ('Safety Boots Size 41 Steel Toe','PPE-003','PAIR','3200.00','4700.00','5','Safety & PPE Equipment'),
  ('Safety Boots Size 42 Steel Toe','PPE-004','PAIR','3200.00','4700.00','5','Safety & PPE Equipment'),
  ('Safety Gloves Cut Resistant Level 3','PPE-005','PAIR','380.00','580.00','10','Safety & PPE Equipment'),
  ('Safety Gloves Leather Palm','PPE-006','PAIR','280.00','420.00','10','Safety & PPE Equipment'),
  ('Safety Spectacles Clear Anti-Scratch','PPE-007','PCS','180.00','280.00','10','Safety & PPE Equipment'),
  ('Dust Mask N95 Box 20','PPE-008','BOX','1200.00','1800.00','5','Safety & PPE Equipment'),
  ('Ear Muffs 28dB Noise Reduction','PPE-009','PCS','850.00','1300.00','5','Safety & PPE Equipment'),
  ('High Visibility Vest Yellow','PPE-010','PCS','280.00','420.00','10','Safety & PPE Equipment'),
  ('Safety Harness Full Body Class A','PPE-011','PCS','3500.00','5000.00','3','Safety & PPE Equipment'),
  ('First Aid Kit 50 Piece','PPE-012','PCS','1200.00','1800.00','3','Safety & PPE Equipment'),
  ('Welding Electrode 2.5mm 2.5kg','WLD-001','KG','380.00','580.00','10','Welding & Gas Equipment'),
  ('Welding Electrode 3.2mm 5kg','WLD-002','KG','380.00','580.00','10','Welding & Gas Equipment'),
  ('MIG Welding Wire 0.8mm 5kg','WLD-003','KG','850.00','1300.00','5','Welding & Gas Equipment'),
  ('TIG Welding Wire 2.0mm 5kg','WLD-004','KG','1200.00','1800.00','5','Welding & Gas Equipment'),
  ('Welding Helmet Auto Darkening','WLD-005','PCS','4500.00','6500.00','3','Welding & Gas Equipment'),
  ('Welding Gloves Heavy Duty Leather','WLD-006','PAIR','380.00','580.00','10','Welding & Gas Equipment'),
  ('Gas Regulator Oxygen Single Stage','WLD-007','PCS','3500.00','5000.00','2','Welding & Gas Equipment'),
  ('Gas Regulator LPG Single Stage','WLD-008','PCS','2800.00','4000.00','2','Welding & Gas Equipment'),
  ('Gas Hose 5m Twin Oxygen Acetylene','WLD-009','PCS','1800.00','2600.00','3','Welding & Gas Equipment'),
  ('Electrode Holder 300A','WLD-010','PCS','580.00','880.00','5','Welding & Gas Equipment'),
  ('Earth Clamp 300A','WLD-011','PCS','480.00','720.00','5','Welding & Gas Equipment'),
  ('Chipping Hammer and Wire Brush Set','WLD-012','SET','280.00','420.00','5','Welding & Gas Equipment'),
  ('Submersible Pump 0.5HP Stainless','PMP-001','PCS','8500.00','12000.00','2','Pumps & Motors'),
  ('Submersible Pump 1HP Stainless','PMP-002','PCS','14000.00','19500.00','2','Pumps & Motors'),
  ('Jet Pump 0.5HP Self Priming','PMP-003','PCS','9500.00','13500.00','2','Pumps & Motors'),
  ('Jet Pump 1HP Self Priming','PMP-004','PCS','15000.00','21000.00','2','Pumps & Motors'),
  ('Centrifugal Pump 1HP','PMP-005','PCS','12000.00','17000.00','2','Pumps & Motors'),
  ('Booster Pump 0.5HP Automatic','PMP-006','PCS','9500.00','13500.00','2','Pumps & Motors'),
  ('Sewage Pump 1HP Submersible','PMP-007','PCS','18000.00','25000.00','1','Pumps & Motors'),
  ('Electric Motor 0.5HP Single Phase','PMP-008','PCS','8500.00','12000.00','2','Pumps & Motors'),
  ('Electric Motor 1HP Single Phase','PMP-009','PCS','12000.00','17000.00','2','Pumps & Motors'),
  ('Electric Motor 2HP Single Phase','PMP-010','PCS','18000.00','25000.00','1','Pumps & Motors'),
  ('Pressure Tank 24L with Valve','PMP-011','PCS','8500.00','12000.00','2','Pumps & Motors'),
  ('Pressure Switch 0.25 Inch Automatic','PMP-012','PCS','1800.00','2600.00','5','Pumps & Motors'),
  ('Metal Tool Box 16 Inch with Tray','TBS-001','PCS','1800.00','2600.00','3','Toolbox & Storage'),
  ('Plastic Tool Box 20 Inch','TBS-002','PCS','1200.00','1800.00','3','Toolbox & Storage'),
  ('Canvas Tool Bag 14 Inch','TBS-003','PCS','850.00','1300.00','3','Toolbox & Storage'),
  ('Wall Tool Rack 60cm Metal','TBS-004','PCS','850.00','1300.00','3','Toolbox & Storage'),
  ('Steel Storage Cabinet 2 Door','TBS-005','PCS','18000.00','25000.00','1','Toolbox & Storage'),
  ('Parts Organizer 30 Compartment','TBS-006','PCS','580.00','880.00','5','Toolbox & Storage'),
  ('Stackable Storage Bin Small','TBS-007','PCS','180.00','280.00','10','Toolbox & Storage'),
  ('Stackable Storage Bin Large','TBS-008','PCS','280.00','420.00','10','Toolbox & Storage'),
  ('Garden Hose 0.5 Inch 15m','GDN-001','PCS','850.00','1300.00','5','Garden & Outdoor Hardware'),
  ('Garden Hose 0.5 Inch 30m','GDN-002','PCS','1500.00','2200.00','3','Garden & Outdoor Hardware'),
  ('Hose Nozzle Adjustable 7 Pattern','GDN-003','PCS','280.00','420.00','5','Garden & Outdoor Hardware'),
  ('Quick Release Hose Connector Set','GDN-004','SET','280.00','420.00','5','Garden & Outdoor Hardware'),
  ('Pop-up Sprinkler Head 0.5 Inch','GDN-005','PCS','180.00','280.00','5','Garden & Outdoor Hardware'),
  ('Wall-Mount Hose Reel 20m Capacity','GDN-006','PCS','3500.00','5000.00','2','Garden & Outdoor Hardware'),
  ('Garden Tap 0.5 Inch Brass','GDN-007','PCS','280.00','420.00','5','Garden & Outdoor Hardware'),
  ('Drip Irrigation Kit 50 Plants','GDN-008','SET','1800.00','2600.00','2','Garden & Outdoor Hardware'),
  ('Wheelbarrow 65L Galvanised','GDN-009','PCS','5500.00','7800.00','2','Garden & Outdoor Hardware'),
  ('Post Spike 100x100mm Ground Anchor','GDN-010','PCS','580.00','880.00','5','Garden & Outdoor Hardware'),
  ('Hose Clamp 20-32mm Worm Drive Pack5','AUT-001','PACK','180.00','280.00','10','Automotive Hardware'),
  ('Hose Clamp 32-50mm Worm Drive Pack5','AUT-002','PACK','220.00','340.00','10','Automotive Hardware'),
  ('Battery Terminal Positive Clamp','AUT-003','PCS','85.00','140.00','10','Automotive Hardware'),
  ('Battery Terminal Negative Clamp','AUT-004','PCS','85.00','140.00','10','Automotive Hardware'),
  ('Automotive Wire 1.5mm Red 10m','AUT-005','ROLL','380.00','580.00','5','Automotive Hardware'),
  ('Cable Lug 50mm Copper Pack 10','AUT-006','PACK','280.00','420.00','5','Automotive Hardware'),
  ('Heat Shrink Tube 6mm Pack 10','AUT-007','PACK','120.00','190.00','10','Automotive Hardware'),
  ('Zip Ties 200mm Black Pack 100','AUT-008','PACK','220.00','340.00','10','Automotive Hardware'),
  ('Blade Fuse 10A Pack 10','AUT-009','PACK','120.00','190.00','10','Automotive Hardware'),
  ('Multi-Purpose Lubricant Spray 400ml','AUT-010','PCS','480.00','720.00','5','Automotive Hardware'),
  ('Plywood 4x8ft 6mm Interior Grade','TMB-001','PCS','2800.00','4000.00','5','Timber & Wood Products'),
  ('Plywood 4x8ft 9mm Interior Grade','TMB-002','PCS','4200.00','6000.00','5','Timber & Wood Products'),
  ('Plywood 4x8ft 12mm Interior Grade','TMB-003','PCS','5500.00','7800.00','3','Timber & Wood Products'),
  ('Plywood 4x8ft 18mm Interior Grade','TMB-004','PCS','8000.00','11500.00','3','Timber & Wood Products'),
  ('MDF Board 4x8ft 12mm','TMB-005','PCS','4500.00','6500.00','3','Timber & Wood Products'),
  ('MDF Board 4x8ft 18mm','TMB-006','PCS','6500.00','9200.00','3','Timber & Wood Products'),
  ('Hardboard 4x8ft 3mm','TMB-007','PCS','1800.00','2600.00','5','Timber & Wood Products'),
  ('Timber Plank 2x4 Inch 10ft Treated','TMB-008','PCS','850.00','1300.00','10','Timber & Wood Products'),
  ('Timber Plank 2x6 Inch 10ft Treated','TMB-009','PCS','1200.00','1800.00','10','Timber & Wood Products'),
  ('Timber Moulding 2x1 Inch 10ft','TMB-010','PCS','380.00','580.00','10','Timber & Wood Products'),
  ('Chipboard 4x8ft 18mm','TMB-011','PCS','5500.00','7800.00','3','Timber & Wood Products'),
  ('Wood Dowel 8mm x 1m','TMB-012','PCS','65.00','110.00','20','Timber & Wood Products'),
  ('Rock Wool Insulation 50mm per m2','INS-001','M2','580.00','880.00','5','Insulation Materials'),
  ('Glass Wool Roll 50mm 10m2','INS-002','ROLL','3500.00','5000.00','2','Insulation Materials'),
  ('Foam Insulation Sheet 25mm per m2','INS-003','M2','380.00','580.00','5','Insulation Materials'),
  ('Pipe Lagging 22mm x 1m','INS-004','PCS','120.00','190.00','10','Insulation Materials'),
  ('Pipe Lagging 28mm x 1m','INS-005','PCS','150.00','240.00','10','Insulation Materials'),
  ('Reflective Foil Insulation Roll 50m2','INS-006','ROLL','4500.00','6500.00','3','Insulation Materials'),
  ('Acoustic Foam Panel 50mm per m2','INS-007','M2','850.00','1300.00','5','Insulation Materials'),
  ('Foam Tape Self Adhesive 10mm x 10m','INS-008','ROLL','180.00','280.00','10','Insulation Materials'),
  ('Fire Extinguisher CO2 2kg','FSF-001','PCS','4500.00','6500.00','2','Fire Safety Equipment'),
  ('Fire Extinguisher Dry Powder 1kg','FSF-002','PCS','2800.00','4000.00','3','Fire Safety Equipment'),
  ('Fire Extinguisher Dry Powder 4kg','FSF-003','PCS','5500.00','7800.00','2','Fire Safety Equipment'),
  ('Fire Hose Reel 30m with Bracket','FSF-004','PCS','8500.00','12000.00','1','Fire Safety Equipment'),
  ('Smoke Detector Optical Ceiling','FSF-005','PCS','1200.00','1800.00','5','Fire Safety Equipment'),
  ('Heat Detector Fixed Temperature','FSF-006','PCS','1200.00','1800.00','5','Fire Safety Equipment'),
  ('Fire Blanket 1x1m Fibreglass','FSF-007','PCS','850.00','1300.00','5','Fire Safety Equipment'),
  ('Emergency Exit Sign LED','FSF-008','PCS','1800.00','2600.00','3','Fire Safety Equipment'),
  ('Ball Bearing 6204 ZZ 20x47x14mm','BRG-001','PCS','380.00','580.00','5','Bearings, Belts & Mechanical Parts'),
  ('Ball Bearing 6205 ZZ 25x52x15mm','BRG-002','PCS','420.00','650.00','5','Bearings, Belts & Mechanical Parts'),
  ('Ball Bearing 6206 ZZ 30x62x16mm','BRG-003','PCS','480.00','720.00','5','Bearings, Belts & Mechanical Parts'),
  ('Ball Bearing 6208 ZZ 40x80x18mm','BRG-004','PCS','650.00','980.00','5','Bearings, Belts & Mechanical Parts'),
  ('V-Belt A Section A40','BRG-005','PCS','380.00','580.00','5','Bearings, Belts & Mechanical Parts'),
  ('V-Belt B Section B40','BRG-006','PCS','480.00','720.00','5','Bearings, Belts & Mechanical Parts'),
  ('Timing Belt 450H 9mm Wide','BRG-007','PCS','850.00','1300.00','3','Bearings, Belts & Mechanical Parts'),
  ('Flat Belt 25mm per Metre','BRG-008','MTR','280.00','420.00','5','Bearings, Belts & Mechanical Parts'),
  ('Sprocket 25T 0.5 Inch Bore','BRG-009','PCS','850.00','1300.00','3','Bearings, Belts & Mechanical Parts'),
  ('Roller Chain 0.5 Inch per Metre','BRG-010','MTR','380.00','580.00','5','Bearings, Belts & Mechanical Parts'),
  ('Compression Spring 25mm x 10mm','MGS-001','PCS','45.00','80.00','20','Magnets, Springs & Miscellaneous Hardware'),
  ('Extension Spring 50mm x 8mm','MGS-002','PCS','55.00','95.00','20','Magnets, Springs & Miscellaneous Hardware'),
  ('Neodymium Magnet 20mm Round','MGS-003','PCS','85.00','140.00','20','Magnets, Springs & Miscellaneous Hardware'),
  ('Rubber Door Stop Wedge Pack 4','MGS-004','PACK','120.00','190.00','10','Magnets, Springs & Miscellaneous Hardware'),
  ('Rubber Grommet 20mm Pack 10','MGS-005','PACK','120.00','190.00','10','Magnets, Springs & Miscellaneous Hardware'),
  ('O-Ring Assorted Set 225pcs','MGS-006','SET','580.00','880.00','5','Magnets, Springs & Miscellaneous Hardware'),
  ('Nylon Bush 10mm ID Pack 10','MGS-007','PACK','120.00','190.00','10','Magnets, Springs & Miscellaneous Hardware'),
  ('Cotter Pin Assorted Set 100pcs','MGS-008','SET','280.00','420.00','10','Magnets, Springs & Miscellaneous Hardware'),
  ('IP Camera 2MP Outdoor Bullet','CTV-001','PCS','4500.00','6500.00','3','CCTV & Security Systems'),
  ('IP Camera 4MP Dome Indoor','CTV-002','PCS','6500.00','9200.00','3','CCTV & Security Systems'),
  ('AHD Camera 2MP Bullet Outdoor','CTV-003','PCS','2800.00','4000.00','3','CCTV & Security Systems'),
  ('AHD Camera 5MP Dome Outdoor','CTV-004','PCS','5500.00','7800.00','3','CCTV & Security Systems'),
  ('NVR 4 Channel PoE H265','CTV-005','PCS','12000.00','17000.00','2','CCTV & Security Systems'),
  ('NVR 8 Channel PoE H265','CTV-006','PCS','18000.00','25000.00','2','CCTV & Security Systems'),
  ('DVR 4 Channel AHD 5MP','CTV-007','PCS','8500.00','12000.00','2','CCTV & Security Systems'),
  ('DVR 8 Channel AHD 5MP','CTV-008','PCS','12000.00','17000.00','2','CCTV & Security Systems'),
  ('CCTV Power Supply 12V 5A','CTV-009','PCS','850.00','1300.00','5','CCTV & Security Systems'),
  ('BNC Connector Compression Pack 50','CTV-010','PACK','580.00','880.00','5','CCTV & Security Systems'),
  ('Camera Wall Bracket Adjustable','CTV-011','PCS','280.00','420.00','10','CCTV & Security Systems'),
  ('PoE Network Switch 4 Port','CTV-012','PCS','2800.00','4000.00','3','CCTV & Security Systems'),
  ('CAT6 UTP Cable 305m Pull Box','NET-001','BOX','18000.00','25000.00','2','Networking & Data Cabling'),
  ('CAT6 Patch Cable 1m Blue','NET-002','PCS','280.00','420.00','20','Networking & Data Cabling'),
  ('CAT6 Patch Cable 3m Blue','NET-003','PCS','380.00','580.00','15','Networking & Data Cabling'),
  ('RJ45 Connector CAT6 Pack 100','NET-004','PACK','850.00','1300.00','5','Networking & Data Cabling'),
  ('CAT6 Wall Socket Double Port','NET-005','PCS','380.00','580.00','10','Networking & Data Cabling'),
  ('Patch Panel 24 Port CAT6','NET-006','PCS','4500.00','6500.00','2','Networking & Data Cabling'),
  ('Cable Tray 100mm per Metre','NET-007','MTR','280.00','420.00','10','Networking & Data Cabling'),
  ('Network Switch 8 Port Unmanaged','NET-008','PCS','2800.00','4000.00','3','Networking & Data Cabling'),
  ('Cable Duct 60x40mm 2m','NET-009','PCS','280.00','420.00','10','Networking & Data Cabling'),
  ('RJ45 Crimping Tool with Cutter','NET-010','PCS','850.00','1300.00','5','Networking & Data Cabling'),
  ('AA Alkaline Battery Pack 4','BAT-001','PACK','120.00','190.00','20','Batteries & Power Backup'),
  ('AAA Alkaline Battery Pack 4','BAT-002','PACK','120.00','190.00','20','Batteries & Power Backup'),
  ('D Size Alkaline Battery Pack 2','BAT-003','PACK','180.00','280.00','10','Batteries & Power Backup'),
  ('9V Alkaline Battery','BAT-004','PCS','120.00','190.00','10','Batteries & Power Backup'),
  ('Lantern Battery 6V','BAT-005','PCS','180.00','280.00','10','Batteries & Power Backup'),
  ('Sealed Lead Acid Battery 12V 7Ah','BAT-006','PCS','1800.00','2600.00','5','Batteries & Power Backup'),
  ('Sealed Lead Acid Battery 12V 18Ah','BAT-007','PCS','3500.00','5000.00','3','Batteries & Power Backup'),
  ('NiMH Rechargeable AA Pack 4','BAT-008','PACK','580.00','880.00','5','Batteries & Power Backup'),
  ('Smart Battery Charger AA AAA','BAT-009','PCS','850.00','1300.00','3','Batteries & Power Backup'),
  ('Solar Charge Controller 10A 12V24V','BAT-010','PCS','1800.00','2600.00','3','Batteries & Power Backup'),
  ('General Hardware Item','OTH-001','PCS','100.00','150.00','5','Others'),
  ('Miscellaneous Electrical Part','OTH-002','PCS','100.00','150.00','5','Others'),
  ('Miscellaneous Plumbing Part','OTH-003','PCS','100.00','150.00','5','Others'),
  ('Site Consumable Item','OTH-004','PCS','100.00','150.00','5','Others'),
  ('Workshop Sundry Item','OTH-005','PCS','100.00','150.00','5','Others')
) AS v(pname, sku, unit, bp, sp, rl, cat_name)
JOIN categories c ON c.name = v.cat_name
ON CONFLICT (sku) DO NOTHING;


-- ============================================================
-- PART 3 — UAT DEMO DATA
-- Suppliers, demo products, customers, purchases, sales,
-- adjustments, payments, returns. Run once on a fresh DB.
-- ============================================================

DO $$
DECLARE
  admin_id UUID;

  -- Categories for the 20 UAT demo products
  cat_power      BIGINT; cat_hand       BIGINT; cat_plumbing  BIGINT;
  cat_electrical BIGINT; cat_fasteners  BIGINT; cat_painting  BIGINT;
  cat_safety     BIGINT;

  -- Suppliers
  sup_lanka   BIGINT; sup_ceylon  BIGINT; sup_colombo BIGINT;
  sup_rainbow BIGINT; sup_sathosa BIGINT;

  -- Demo Products
  prod_drill       BIGINT; prod_grinder   BIGINT; prod_hammer    BIGINT;
  prod_tapemeasure BIGINT; prod_hacksaw   BIGINT; prod_pvc       BIGINT;
  prod_elbow       BIGINT; prod_wire      BIGINT; prod_mcb       BIGINT;
  prod_socket      BIGINT; prod_sandpaper BIGINT; prod_brush     BIGINT;
  prod_screw       BIGINT; prod_nail      BIGINT; prod_padlock   BIGINT;
  prod_tape        BIGINT; prod_putty     BIGINT; prod_paint     BIGINT;
  prod_helmet      BIGINT; prod_gloves    BIGINT;

  -- Customers
  cust_chaminda BIGINT; cust_small   BIGINT; cust_perera  BIGINT;
  cust_anura    BIGINT; cust_nimal   BIGINT; cust_sunrise BIGINT;

  -- Purchases
  pur1 BIGINT; pur2 BIGINT; pur3 BIGINT; pur4 BIGINT;
  pur5 BIGINT; pur6 BIGINT; pur7 BIGINT;

  -- Sales
  sale1  BIGINT; sale2  BIGINT; sale3  BIGINT; sale4  BIGINT;
  sale5  BIGINT; sale6  BIGINT; sale7  BIGINT; sale8  BIGINT;
  sale9  BIGINT; sale10 BIGINT; sale11 BIGINT; sale12 BIGINT;

  -- Returns
  ret1 BIGINT; ret2 BIGINT;

BEGIN

  SELECT id INTO admin_id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No active ADMIN user found. Insert one into the users table first.';
  END IF;

  -- ── Get or create the 7 UAT category IDs ──────────────────
  -- Uses ON CONFLICT DO UPDATE so it returns the ID whether the
  -- category already exists (from Part 1) or is being created now.

  INSERT INTO categories (name, description) VALUES ('Power Tools', 'Electric and battery-powered tools')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO cat_power;

  INSERT INTO categories (name, description) VALUES ('Hand Tools', 'Manual hand tools and basic equipment')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO cat_hand;

  INSERT INTO categories (name, description) VALUES ('Plumbing', 'Pipes, fittings, and plumbing supplies')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO cat_plumbing;

  INSERT INTO categories (name, description) VALUES ('Electrical', 'Wiring, sockets, switches, and electrical parts')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO cat_electrical;

  INSERT INTO categories (name, description) VALUES ('Hardware & Fasteners', 'Screws, nails, bolts, padlocks, and fixings')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO cat_fasteners;

  INSERT INTO categories (name, description) VALUES ('Painting & Finishing', 'Paints, brushes, putty, and finishing materials')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO cat_painting;

  INSERT INTO categories (name, description) VALUES ('Safety & PPE', 'Personal protective equipment and site safety')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id INTO cat_safety;


  -- ── SUPPLIERS (5) ─────────────────────────────────────────
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Lanka Tools Import','Suresh Fernando','0112345678','suresh@lankatools.lk','Main Street, Pettah, Colombo 11',0) RETURNING id INTO sup_lanka;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Ceylon Hardware Ltd','Niroshan Silva','0114567890','niroshan@ceylonhw.lk','Maradana Road, Colombo 10',0) RETURNING id INTO sup_ceylon;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Colombo Building Supplies','Ranjith Jayawardena','0117654321','ranjith@cbs.lk','Borella Junction, Colombo 08',0) RETURNING id INTO sup_colombo;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Rainbow Paints Lanka','Priya Mendis','0112233445','priya@rainbowpaints.lk','Nawala Road, Nugegoda',0) RETURNING id INTO sup_rainbow;
  INSERT INTO suppliers (name, contact_person, phone, email, address, credit_balance) VALUES
    ('Sathosa Hardware','Bandara Wickrama','0118877665','bandara@sathosahw.lk','Baseline Road, Colombo 09',0) RETURNING id INTO sup_sathosa;


  -- ── DEMO PRODUCTS (20) — stock built by GRNs below ────────
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Makita Drill 750W','MKT-DRILL-750','4012345670001',cat_power,sup_lanka,'PCS',12500,15000,0,10,true) RETURNING id INTO prod_drill;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Angle Grinder 4"','ANG-GRND-4IN','4012345670011',cat_power,sup_lanka,'PCS',8500,11000,0,5,true) RETURNING id INTO prod_grinder;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Stanley Hammer 500g','STN-HMR-500G','4012345670002',cat_hand,sup_lanka,'PCS',850,1200,0,5,true) RETURNING id INTO prod_hammer;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Measuring Tape 5m','MSR-TAPE-5M','4012345670012',cat_hand,sup_sathosa,'PCS',280,420,0,10,true) RETURNING id INTO prod_tapemeasure;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Hacksaw Blade 12"','HKS-BLD-12IN','4012345670013',cat_hand,sup_ceylon,'PCS',35,60,0,20,true) RETURNING id INTO prod_hacksaw;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('PVC Pipe 1/2"','PVC-PIPE-HLF','4012345670003',cat_plumbing,sup_colombo,'PCS',120,180,0,50,true) RETURNING id INTO prod_pvc;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('PVC Elbow 1/2"','PVC-ELBW-HLF','4012345670014',cat_plumbing,sup_colombo,'PCS',15,28,0,50,true) RETURNING id INTO prod_elbow;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Wire 2.5mm (per metre)','WR-2.5MM-M','4012345670004',cat_electrical,sup_ceylon,'MTR',45,75,0,30,true) RETURNING id INTO prod_wire;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('MCB Switch 20A','MCB-SW-20A','4012345670015',cat_electrical,sup_sathosa,'PCS',320,480,0,15,true) RETURNING id INTO prod_mcb;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Electric Socket 3-Pin','ELEC-SCK-3P','4012345670010',cat_electrical,sup_colombo,'PCS',280,450,0,10,true) RETURNING id INTO prod_socket;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Sandpaper 80 Grit','SND-80G-SHT','4012345670005',cat_hand,sup_ceylon,'PCS',15,25,0,90,true) RETURNING id INTO prod_sandpaper;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Paint Brush 3"','PNT-BRSH-3IN','4012345670006',cat_painting,sup_ceylon,'PCS',85,120,0,10,true) RETURNING id INTO prod_brush;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Cement Screw 3"','SCR-CEM-3IN','4012345670007',cat_fasteners,sup_colombo,'PCS',5,8,0,200,true) RETURNING id INTO prod_screw;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('GI Wire Nail 2"','NAIL-GI-2IN','4012345670016',cat_fasteners,sup_sathosa,'KG',180,260,0,20,true) RETURNING id INTO prod_nail;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Padlock 40mm Steel','PDL-40MM-STL','4012345670008',cat_fasteners,sup_lanka,'PCS',180,280,0,10,true) RETURNING id INTO prod_padlock;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Duct Tape 48mm','DCT-TAPE-48','4012345670009',cat_fasteners,sup_colombo,'PCS',80,130,0,10,true) RETURNING id INTO prod_tape;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Wall Putty 1kg','WPT-1KG','4012345670017',cat_painting,sup_rainbow,'PCS',120,180,0,20,true) RETURNING id INTO prod_putty;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Gloss Paint White 1L','GPNT-WHT-1L','4012345670018',cat_painting,sup_rainbow,'PCS',480,680,0,15,true) RETURNING id INTO prod_paint;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Safety Helmet White','SFT-HLM-WHT','4012345670019',cat_safety,sup_sathosa,'PCS',350,550,0,10,true) RETURNING id INTO prod_helmet;
  INSERT INTO products (name,sku,barcode,category_id,supplier_id,unit,buying_price,selling_price,stock_quantity,reorder_level,is_active) VALUES
    ('Safety Gloves (pair)','SFT-GLV-PR','4012345670020',cat_safety,sup_sathosa,'PR',95,150,0,20,true) RETURNING id INTO prod_gloves;


  -- ── CUSTOMERS (6) ─────────────────────────────────────────
  INSERT INTO customers (name,phone,email,address,credit_limit,credit_balance) VALUES
    ('Chaminda Construction','0771234567','chaminda@construct.lk','Nugegoda, Colombo',100000,0) RETURNING id INTO cust_chaminda;
  INSERT INTO customers (name,phone,email,address,credit_limit,credit_balance) VALUES
    ('Small Shop Owner','0779876543','','Kaduwela',10000,0) RETURNING id INTO cust_small;
  INSERT INTO customers (name,phone,email,address,credit_limit,credit_balance) VALUES
    ('Perera Hardware','0712233445','info@pererahw.lk','Kandy Road, Kegalle',150000,0) RETURNING id INTO cust_perera;
  INSERT INTO customers (name,phone,email,address,credit_limit,credit_balance) VALUES
    ('Anura Builders','0762233991','','Gampaha',50000,0) RETURNING id INTO cust_anura;
  INSERT INTO customers (name,phone,email,address,credit_limit,credit_balance) VALUES
    ('Nimal Contractors','0771122334','nimal@contractors.lk','Piliyandala, Colombo',75000,0) RETURNING id INTO cust_nimal;
  INSERT INTO customers (name,phone,email,address,credit_limit,credit_balance) VALUES
    ('Sunrise Properties','0115566778','info@sunriseprop.lk','Rajagiriya, Colombo',200000,0) RETURNING id INTO cust_sunrise;


  -- ── PURCHASES / GRN (7) ───────────────────────────────────
  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_lanka,'INV-LT-2024-001',278250,'CASH','Initial power tools order',admin_id,NOW()-INTERVAL '50 days') RETURNING id INTO pur1;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur1,prod_drill,12,12500,150000),(pur1,prod_grinder,12,8500,102000),(pur1,prod_hammer,25,850,21250);

  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_lanka,'INV-LT-2024-002',5400,'CREDIT','Padlock restock — 30-day credit',admin_id,NOW()-INTERVAL '45 days') RETURNING id INTO pur2;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur2,prod_padlock,30,180,5400);

  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_ceylon,'INV-CH-2024-101',25850,'CASH','Consumables and blades',admin_id,NOW()-INTERVAL '38 days') RETURNING id INTO pur3;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur3,prod_wire,400,45,18000),(pur3,prod_sandpaper,150,15,2250),(pur3,prod_brush,50,85,4250),(pur3,prod_hacksaw,60,35,2100);

  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_colombo,'INV-CBS-2024-052',47100,'CASH','Plumbing, electrical and fastener stock',admin_id,NOW()-INTERVAL '30 days') RETURNING id INTO pur4;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur4,prod_pvc,80,120,9600),(pur4,prod_elbow,150,15,2250),(pur4,prod_screw,1000,5,5000),
    (pur4,prod_tape,60,80,4800),(pur4,prod_socket,50,280,14000),(pur4,prod_nail,30,180,5400),(pur4,prod_mcb,35,320,11200);

  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_rainbow,'INV-RP-2024-201',33900,'CASH','Paints, putty and safety gloves',admin_id,NOW()-INTERVAL '20 days') RETURNING id INTO pur5;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur5,prod_putty,60,120,7200),(pur5,prod_paint,40,480,19200),(pur5,prod_gloves,60,95,5700);

  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_sathosa,'INV-SH-2024-301',5250,'CREDIT','Safety helmets on credit',admin_id,NOW()-INTERVAL '12 days') RETURNING id INTO pur6;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur6,prod_helmet,15,350,5250);

  INSERT INTO purchases (supplier_id,invoice_number,total_amount,payment_type,notes,created_by,created_at)
    VALUES (sup_sathosa,'INV-SH-2024-302',7000,'CASH','Measuring tapes',admin_id,NOW()-INTERVAL '10 days') RETURNING id INTO pur7;
  INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES
    (pur7,prod_tapemeasure,25,280,7000);


  -- ── SALES (12) ────────────────────────────────────────────
  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL,18240,0,18240,0,'CASH',NULL,admin_id,NOW()-INTERVAL '40 days') RETURNING id INTO sale1;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale1,prod_drill,1,15000,15000),(sale1,prod_hammer,2,1200,2400),(sale1,prod_padlock,3,280,840);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_chaminda,30000,0,0,30000,'CREDIT','Site project — 2 drills on credit',admin_id,NOW()-INTERVAL '35 days') RETURNING id INTO sale2;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale2,prod_drill,2,15000,30000);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL,8850,0,8850,0,'CASH',NULL,admin_id,NOW()-INTERVAL '28 days') RETURNING id INTO sale3;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale3,prod_wire,100,75,7500),(sale3,prod_brush,5,120,600),(sale3,prod_sandpaper,30,25,750);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_perera,10540,0,0,10540,'CREDIT','Monthly stock supply',admin_id,NOW()-INTERVAL '22 days') RETURNING id INTO sale4;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale4,prod_socket,8,450,3600),(sale4,prod_mcb,8,480,3840),(sale4,prod_screw,200,8,1600),
    (sale4,prod_hacksaw,15,60,900),(sale4,prod_brush,5,120,600);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL,8310,500,8310,0,'CASH','Bulk discount applied',admin_id,NOW()-INTERVAL '18 days') RETURNING id INTO sale5;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale5,prod_pvc,35,180,6300),(sale5,prod_elbow,20,28,560),(sale5,prod_tape,5,130,650),(sale5,prod_nail,5,260,1300);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_nimal,8900,0,4000,4900,'SPLIT','Partial cash, balance on credit',admin_id,NOW()-INTERVAL '15 days') RETURNING id INTO sale6;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale6,prod_wire,100,75,7500),(sale6,prod_padlock,5,280,1400);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_anura,5350,0,0,5350,'CREDIT','Safety equipment for construction site',admin_id,NOW()-INTERVAL '10 days') RETURNING id INTO sale7;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale7,prod_helmet,7,550,3850),(sale7,prod_gloves,10,150,1500);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_sunrise,24940,0,24940,0,'CASH','Property renovation supplies',admin_id,NOW()-INTERVAL '8 days') RETURNING id INTO sale8;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale8,prod_grinder,2,11000,22000),(sale8,prod_paint,3,680,2040),(sale8,prod_putty,5,180,900);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL,2610,0,2610,0,'CASH',NULL,admin_id,NOW()-INTERVAL '5 days') RETURNING id INTO sale9;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale9,prod_brush,5,120,600),(sale9,prod_sandpaper,30,25,750),(sale9,prod_tapemeasure,3,420,1260);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (cust_small,2900,0,1500,1400,'SPLIT',NULL,admin_id,NOW()-INTERVAL '3 days') RETURNING id INTO sale10;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale10,prod_screw,200,8,1600),(sale10,prod_nail,5,260,1300);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL,4440,0,4440,0,'CASH',NULL,admin_id,NOW()-INTERVAL '2 days') RETURNING id INTO sale11;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale11,prod_hammer,2,1200,2400),(sale11,prod_hacksaw,10,60,600),(sale11,prod_mcb,3,480,1440);

  INSERT INTO sales (customer_id,total_amount,discount_amount,paid_amount,balance_amount,payment_type,notes,created_by,created_at)
    VALUES (NULL,5750,0,5750,0,'CASH',NULL,admin_id,NOW()) RETURNING id INTO sale12;
  INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,total_price) VALUES
    (sale12,prod_wire,50,75,3750),(sale12,prod_socket,3,450,1350),(sale12,prod_tape,5,130,650);


  -- ── STOCK ADJUSTMENTS (4) ─────────────────────────────────
  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_sandpaper,'SUBTRACT',2,'Two damaged sheets found during stocktake — disposed',admin_id,NOW()-INTERVAL '1 day');
  UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = prod_sandpaper;

  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_tape,'SUBTRACT',2,'Two rolls damaged in storage — moisture damage',admin_id,NOW()-INTERVAL '3 days');
  UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = prod_tape;

  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_drill,'SUBTRACT',2,'Two drills returned — motor failure, written off as damaged',admin_id,NOW()-INTERVAL '2 days');
  UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = prod_drill;

  INSERT INTO stock_adjustments (product_id,adjustment_type,quantity,reason,created_by,created_at)
    VALUES (prod_putty,'ADD',5,'5 bags found in back store — not previously counted in system',admin_id,NOW()-INTERVAL '6 days');
  UPDATE products SET stock_quantity = stock_quantity + 5 WHERE id = prod_putty;


  -- ── CUSTOMER PAYMENTS (2) ─────────────────────────────────
  INSERT INTO customer_payments (customer_id,amount,notes,created_by,created_at)
    VALUES (cust_chaminda,20000,'Partial payment — cash',admin_id,NOW()-INTERVAL '28 days');
  UPDATE customers SET credit_balance = credit_balance - 20000 WHERE id = cust_chaminda;

  INSERT INTO customer_payments (customer_id,amount,notes,created_by,created_at)
    VALUES (cust_perera,5000,'Bank transfer received',admin_id,NOW()-INTERVAL '18 days');
  UPDATE customers SET credit_balance = credit_balance - 5000 WHERE id = cust_perera;


  -- ── SUPPLIER PAYMENTS (2) ─────────────────────────────────
  INSERT INTO supplier_payments (supplier_id,amount,notes,created_by,created_at)
    VALUES (sup_lanka,3000,'Partial settlement — bank transfer',admin_id,NOW()-INTERVAL '38 days');
  UPDATE suppliers SET credit_balance = credit_balance - 3000 WHERE id = sup_lanka;

  INSERT INTO supplier_payments (supplier_id,amount,notes,created_by,created_at)
    VALUES (sup_sathosa,2500,'Partial payment — cash',admin_id,NOW()-INTERVAL '8 days');
  UPDATE suppliers SET credit_balance = credit_balance - 2500 WHERE id = sup_sathosa;


  -- ── RETURNS (2) ───────────────────────────────────────────
  INSERT INTO returns (sale_id,customer_id,total_return_amount,return_method,notes,created_by,created_at)
    VALUES (sale7,cust_anura,300,'CREDIT_ADJUSTMENT','2 pairs — wrong size, exchanged',admin_id,NOW()-INTERVAL '7 days') RETURNING id INTO ret1;
  INSERT INTO return_items (return_id,product_id,quantity,unit_price,total_price) VALUES
    (ret1,prod_gloves,2,150,300);
  UPDATE products  SET stock_quantity = stock_quantity + 2   WHERE id = prod_gloves;
  UPDATE customers SET credit_balance = credit_balance - 300 WHERE id = cust_anura;

  INSERT INTO returns (sale_id,customer_id,total_return_amount,return_method,notes,created_by,created_at)
    VALUES (sale1,NULL,280,'CASH_REFUND','Wrong size, cash refunded at counter',admin_id,NOW()-INTERVAL '38 days') RETURNING id INTO ret2;
  INSERT INTO return_items (return_id,product_id,quantity,unit_price,total_price) VALUES
    (ret2,prod_padlock,1,280,280);
  UPDATE products SET stock_quantity = stock_quantity + 1 WHERE id = prod_padlock;

END $$;


-- ============================================================
-- PART 4 — VERIFY (run after seed to confirm correctness)
-- ============================================================

SELECT name, sku, stock_quantity, reorder_level,
  CASE WHEN stock_quantity = 0              THEN 'OUT OF STOCK'
       WHEN stock_quantity <= reorder_level THEN 'LOW STOCK'
       ELSE 'OK' END AS status
FROM products ORDER BY status, stock_quantity ASC;

SELECT name, credit_limit, credit_balance,
  credit_limit - credit_balance AS available_credit
FROM customers ORDER BY credit_balance DESC;

SELECT name, credit_balance FROM suppliers WHERE credit_balance > 0;

SELECT COUNT(*) AS total_sales, SUM(total_amount) AS total_revenue,
  SUM(CASE WHEN payment_type='CASH'   THEN 1 ELSE 0 END) AS cash_count,
  SUM(CASE WHEN payment_type='CREDIT' THEN 1 ELSE 0 END) AS credit_count,
  SUM(CASE WHEN payment_type='SPLIT'  THEN 1 ELSE 0 END) AS split_count
FROM sales;

SELECT c.name AS category, COUNT(p.id) AS product_count
FROM categories c LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name ORDER BY c.name;
